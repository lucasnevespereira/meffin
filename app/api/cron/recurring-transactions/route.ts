import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';

export async function POST() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Only run this job on the first day of each month
    if (currentDay !== 1) {
      return NextResponse.json({
        success: true,
        message: 'Cron job runs only on the 1st day of each month',
        createdCount: 0
      });
    }

    // Get all recurring transactions (monthly and time-limited) that should be created for this month
    const recurringTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.isFixed, true),
          // Handle all recurring types except 'annual' and 'once'
          or(
            eq(transactions.repeatType, 'forever'),
            eq(transactions.repeatType, '3months'),
            eq(transactions.repeatType, '4months'),
            eq(transactions.repeatType, '6months'),
            eq(transactions.repeatType, '12months'),
            eq(transactions.repeatType, 'until'),
            isNull(transactions.repeatType) // Legacy transactions
          ),
          // Either no end date or end date is in the future
          or(
            isNull(transactions.endDate),
            gte(transactions.endDate, new Date(currentYear, currentMonth, 1).toISOString()) // Start of current month
          )
        )
      );

    // Get all annual transactions for monthly budget allocation
    const annualTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.repeatType, 'annual'));


    let createdCount = 0;
    let updatedAnnualCount = 0;

    // Process monthly recurring transactions
    for (const recurring of recurringTransactions) {
      // Extract day from the original transaction date
      const originalDate = new Date(recurring.date);
      const dayOfMonth = originalDate.getDate();

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
              gte(transactions.date, new Date(currentYear, currentMonth, dayOfMonth).toISOString()),
              lte(transactions.date, new Date(currentYear, currentMonth, dayOfMonth, 23, 59, 59).toISOString())
            )
          )
        )
        .limit(1);

      if (existingTransaction.length === 0) {
        // Create new monthly transaction (not recurring, just for this month)
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: recurring.userId,
          categoryId: recurring.categoryId,
          description: recurring.description,
          amount: recurring.amount,
          date: transactionDate.toISOString(),
          isFixed: false, // Monthly generated transactions are not recurring themselves
          repeatType: 'once', // This is a one-time transaction for this month
          createdBy: recurring.userId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        createdCount++;
      }
    }

    // Process annual transactions - update them to next year if their renewal month has passed
    for (const annual of annualTransactions) {
      const annualDate = new Date(annual.date);
      const renewalMonth = annualDate.getMonth();
      const renewalYear = annualDate.getFullYear();

      // If we're past the renewal month of the current year, update to next year
      if (currentMonth > renewalMonth && currentYear >= renewalYear) {
        const nextYearDate = new Date(annualDate);
        nextYearDate.setFullYear(currentYear + 1);

        await db
          .update(transactions)
          .set({
            date: nextYearDate.toISOString(),
            updatedAt: now.toISOString()
          })
          .where(eq(transactions.id, annual.id));

        updatedAnnualCount++;
      }
      // If we're in the same year but renewal month hasn't come yet, and the year is behind current year
      else if (renewalYear < currentYear) {
        const nextYearDate = new Date(annualDate);
        nextYearDate.setFullYear(currentYear);

        // If the renewal month is in the future this year, set to current year
        if (renewalMonth >= currentMonth) {
          await db
            .update(transactions)
            .set({
              date: nextYearDate.toISOString(),
              updatedAt: now.toISOString()
            })
            .where(eq(transactions.id, annual.id));

          updatedAnnualCount++;
        } else {
          // If renewal month already passed this year, set to next year
          nextYearDate.setFullYear(currentYear + 1);
          await db
            .update(transactions)
            .set({
              date: nextYearDate.toISOString(),
              updatedAt: now.toISOString()
            })
            .where(eq(transactions.id, annual.id));

          updatedAnnualCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} recurring transactions, updated ${updatedAnnualCount} annual transactions to next year`,
      createdCount,
      updatedAnnualCount
    });

  } catch (error) {
    console.error('Error creating recurring transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recurring transactions' },
      { status: 500 }
    );
  }
}
