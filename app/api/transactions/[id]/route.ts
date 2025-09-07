import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';

const updateTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().pipe(z.coerce.date()),
  isFixed: z.boolean().default(false),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Check if transaction exists and belongs to user
    const existingTransaction = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, session.user.id)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Validate category exists
    const isDefaultCategory = validatedData.categoryId.startsWith('default_');

    if (!isDefaultCategory) {
      // Check if custom category exists and belongs to user
      const customCategory = await db.select()
        .from(categories)
        .where(eq(categories.id, validatedData.categoryId))
        .limit(1);

      if (customCategory.length === 0 || customCategory[0].userId !== session.user.id) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    } else {
      // Check if default category exists
      const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.id === validatedData.categoryId);
      if (!defaultCategory) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const [updatedTransaction] = await db.update(transactions)
      .set({
        description: validatedData.description,
        amount: validatedData.amount.toString(),
        categoryId: validatedData.categoryId,
        date: validatedData.date,
        isFixed: validatedData.isFixed,
        endDate: validatedData.endDate,
      })
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, session.user.id)
      ))
      .returning();

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.delete(transactions)
      .where(and(
        eq(transactions.id, id),
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
