"use server";

import { db } from "@/db";
import { transaction } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { serverUserSession } from "@/lib/auth-utils";
import { z } from "zod";
import { randomUUID } from "crypto";
import { TransactionInput, TransactionRecord } from "@/types/transaction";

// Zod schema for input validation
const transactionInputSchema = z.object({
  description: z.string().min(1),
  amount: z.string().or(z.number()),
  type: z.enum(["income", "expense"]),
  date: z.string().or(z.date()),
  isRecurring: z.boolean().optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

// Get all transactions for the current user
export async function getTransactions(): Promise<TransactionRecord[]> {
  const user = await serverUserSession();
  if (!user) throw new Error("Unauthorized");
  return db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, user.id))
    .orderBy(desc(transaction.date));
}

// Create a new transaction
export async function createTransaction(input: TransactionInput) {
  const user = await serverUserSession();
  if (!user) throw new Error("Unauthorized");
  const data = transactionInputSchema.parse(input);
  const [created] = await db
    .insert(transaction)
    .values({
      id: randomUUID(),
      description: data.description,
      amount:
        typeof data.amount === "number" ? data.amount.toFixed(2) : data.amount,
      type: data.type,
      date: typeof data.date === "string" ? new Date(data.date) : data.date,
      isRecurring: !!data.isRecurring,
      endDate: data.endDate
        ? typeof data.endDate === "string"
          ? new Date(data.endDate)
          : data.endDate
        : null,
      categoryId: data.categoryId ?? null,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

// Update an existing transaction
export async function updateTransaction(id: string, input: TransactionInput) {
  const user = await serverUserSession();
  if (!user) throw new Error("Unauthorized");
  const data = transactionInputSchema.parse(input);
  const [updated] = await db
    .update(transaction)
    .set({
      description: data.description,
      amount:
        typeof data.amount === "number" ? data.amount.toFixed(2) : data.amount,
      type: data.type,
      date: typeof data.date === "string" ? new Date(data.date) : data.date,
      isRecurring: !!data.isRecurring,
      endDate: data.endDate
        ? typeof data.endDate === "string"
          ? new Date(data.endDate)
          : data.endDate
        : null,
      categoryId: data.categoryId ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(transaction.id, id), eq(transaction.userId, user.id)))
    .returning();
  return updated;
}

// Delete a transaction
export async function deleteTransaction(id: string) {
  const user = await serverUserSession();
  if (!user) throw new Error("Unauthorized");
  await db
    .delete(transaction)
    .where(and(eq(transaction.id, id), eq(transaction.userId, user.id)));
  return { success: true };
}
