import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  date: z.string().datetime('Invalid date'),
  isFixed: z.boolean().default(false),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Verify transaction belongs to user
    const existingTransaction = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.id, params.id),
        eq(transactions.userId, session.user.id)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify category belongs to user
    const userCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, validatedData.categoryId),
        eq(categories.userId, session.user.id)
      ))
      .limit(1);

    if (userCategory.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const [updatedTransaction] = await db.update(transactions)
      .set({
        categoryId: validatedData.categoryId,
        description: validatedData.description,
        amount: validatedData.amount.toString(),
        date: new Date(validatedData.date),
        isFixed: validatedData.isFixed,
        updatedAt: new Date(),
      })
      .where(and(
        eq(transactions.id, params.id),
        eq(transactions.userId, session.user.id)
      ))
      .returning();

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.delete(transactions)
      .where(and(
        eq(transactions.id, params.id),
        eq(transactions.userId, session.user.id)
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}