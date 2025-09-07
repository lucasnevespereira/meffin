import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Get all recurring transactions that should be created for this month
    const recurringTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.isFixed, true),
          // Either no end date or end date is in the future
          or(
            isNull(transactions.endDate),
            lte(transactions.endDate, new Date(currentYear, currentMonth + 1, 0)) // End of current month
          )
        )
      );

    let createdCount = 0;

    for (const recurring of recurringTransactions) {
      // Extract day from the original transaction date
      const originalDate = new Date(recurring.date);
      const dayOfMonth = originalDate.getDate();

      // Skip if we're not yet at the day of the month for this transaction
      if (currentDay < dayOfMonth) continue;

      // Check if end date has passed
      if (recurring.endDate) {
        const endDate = new Date(recurring.endDate);
        if (now > endDate) continue;
      }

      // Create the transaction date for current month
      const transactionDate = new Date(currentYear, currentMonth, dayOfMonth);

      // Check if transaction already exists for this month
      const existingTransaction = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, recurring.userId),
            eq(transactions.categoryId, recurring.categoryId),
            eq(transactions.description, recurring.description),
            eq(transactions.amount, recurring.amount),
            eq(transactions.isFixed, true),
            // Check if transaction exists in current month
            and(
              gte(transactions.date, new Date(currentYear, currentMonth, dayOfMonth)),
              lte(transactions.date, new Date(currentYear, currentMonth, dayOfMonth, 23, 59, 59))
            )
          )
        )
        .limit(1);

      if (existingTransaction.length === 0) {
        // Create new transaction for current month
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: recurring.userId,
          categoryId: recurring.categoryId,
          description: recurring.description,
          amount: recurring.amount,
          date: transactionDate,
          isFixed: true,
          endDate: recurring.endDate,
          createdAt: now,
          updatedAt: now,
        });

        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} recurring transactions`,
      createdCount
    });

  } catch (error) {
    console.error('Error creating recurring transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recurring transactions' },
      { status: 500 }
    );
  }
}
