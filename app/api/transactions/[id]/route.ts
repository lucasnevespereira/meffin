import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';

const updateTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().pipe(z.coerce.date()),
  isFixed: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
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

    // Get current user's partner info to determine access
    const [user] = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if transaction exists and is accessible to user or their partner
    const userIds = user.partnerId ? [session.user.id, user.partnerId] : [session.user.id];

    const existingTransaction = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      createdBy: transactions.createdBy,
    })
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        inArray(transactions.userId, userIds)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if user is the creator of this transaction (creator-only editing)
    if (existingTransaction[0].createdBy !== session.user.id) {
      return NextResponse.json({
        error: 'You can only edit transactions that you created'
      }, { status: 403 });
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
        date: validatedData.date.toISOString(),
        isFixed: validatedData.isFixed,
        isPrivate: validatedData.isPrivate || false,
        endDate: validatedData.endDate ? validatedData.endDate.toISOString() : null,
      })
      .where(and(
        eq(transactions.id, id),
        eq(transactions.createdBy, session.user.id)
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

    // Get current user's partner info to determine access
    const [user] = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if transaction exists and is accessible to user or their partner
    const userIds = user.partnerId ? [session.user.id, user.partnerId] : [session.user.id];

    const existingTransaction = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      createdBy: transactions.createdBy,
    })
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        inArray(transactions.userId, userIds)
      ))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if user is the creator of this transaction (creator-only deletion)
    if (existingTransaction[0].createdBy !== session.user.id) {
      return NextResponse.json({
        error: 'You can only delete transactions that you created'
      }, { status: 403 });
    }

    const result = await db.delete(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.createdBy, session.user.id)
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
