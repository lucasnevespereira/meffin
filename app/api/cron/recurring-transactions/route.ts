import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, lte, or, isNull, gte } from "drizzle-orm";

export async function GET() {
  console.log("[Cron Job] Starting recurring transactions cron job...");

  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    console.log(`[Cron Job] Current date: ${now.toISOString()}`);

    // Only run this job on the first day of each month
    if (currentDay !== 1) {
      console.log("[Cron Job] Not the 1st day of the month. Exiting.");
      return NextResponse.json({
        success: true,
        message: "Cron job runs only on the 1st day of each month",
        createdCount: 0,
      });
    }

    console.log("[Cron Job] Fetching recurring transactions...");

    // Get all recurring transactions (monthly and time-limited) that should be created for this month
    const recurringTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.isFixed, true),
          // Handle all recurring types except 'annual' and 'once'
          or(
            eq(transactions.repeatType, "forever"),
            eq(transactions.repeatType, "3months"),
            eq(transactions.repeatType, "4months"),
            eq(transactions.repeatType, "6months"),
            eq(transactions.repeatType, "12months"),
            eq(transactions.repeatType, "until"),
            isNull(transactions.repeatType) // Legacy transactions
          ),
          // Either no end date or end date is in the future
          or(
            isNull(transactions.endDate),
            gte(
              transactions.endDate,
              new Date(currentYear, currentMonth, 1).toISOString()
            ) // Start of current month
          )
        )
      );

    console.log(
      `[Cron Job] Found ${recurringTransactions.length} recurring transactions.`
    );

    let createdCount = 0;

    console.log("[Cron Job] Processing recurring transactions...");

    // Once a recurring transaction has been materialized for a month, that row is
    // its permanent record for that month. We only ever add the current month's
    // entry and never touch past months, so history stays intact.
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

      // Check if an entry already exists for this recurring transaction this month
      const existingTransaction = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, recurring.userId),
            eq(transactions.categoryId, recurring.categoryId),
            eq(transactions.description, recurring.description),
            eq(transactions.isFixed, true),
            // Check if transaction exists in current month
            gte(
              transactions.date,
              new Date(currentYear, currentMonth, 1).toISOString()
            ),
            lte(
              transactions.date,
              new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()
            )
          )
        )
        .limit(1);

      if (existingTransaction.length === 0) {
        // Create this month's entry, keeping the same repeat type
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: recurring.userId,
          categoryId: recurring.categoryId,
          description: recurring.description,
          amount: recurring.amount,
          date: transactionDate.toISOString(),
          isFixed: true,
          repeatType: recurring.repeatType || "forever",
          createdBy: recurring.createdBy,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        createdCount++;
      }
    }

    console.log(
      `[Cron Job] Created ${createdCount} new recurring transactions.`
    );

    // Annual transactions are displayed by their renewal month regardless of the
    // stored year, so there is nothing to materialize or roll forward here.

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} recurring transactions`,
      createdCount,
    });
  } catch (error) {
    console.error("[Cron Job] Error creating recurring transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create recurring transactions" },
      { status: 500 }
    );
  }
}
