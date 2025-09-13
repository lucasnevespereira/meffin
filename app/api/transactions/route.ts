import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';

const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().pipe(z.coerce.date()),
  isFixed: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and partner info
    const user = await db.select({
      id: users.id,
      partnerId: users.partnerId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get transactions from user and partner
    const userIds = user[0].partnerId ? [session.user.id, user[0].partnerId] : [session.user.id];

    const userTransactions = await db.select({
      transaction: transactions,
      creator: {
        id: users.id,
        name: users.name,
      }
    })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(or(...userIds.map(id => eq(transactions.userId, id))))
      .orderBy(desc(transactions.date));

    // Get custom categories from user and partner
    const customCategories = await db.select()
      .from(categories)
      .where(or(...userIds.map(id => eq(categories.userId, id))));

    // Create category lookup with default categories
    const categoryLookup: Record<string, Category> = {};

    // Add default categories
    DEFAULT_CATEGORIES.forEach(cat => {
      categoryLookup[cat.id] = {
        id: cat.id,
        name: cat.name, // This is the i18n key
        type: cat.type,
        color: cat.color,
        isCustom: false,
        userId: null,
        createdAt: undefined,
      };
    });

    // Add custom categories
    customCategories.forEach(cat => {
      categoryLookup[cat.id] = {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isCustom: true,
        userId: cat.userId,
        createdAt: cat.createdAt,
      };
    });

    // Map transactions with category info
    const transactionsWithCategories = userTransactions.map(({ transaction, creator }) => ({
      ...transaction,
      categoryId: transaction.categoryId,
      createdBy: creator,
      category: categoryLookup[transaction.categoryId] || {
        id: transaction.categoryId,
        name: 'Unknown',
        type: 'expense' as const,
        color: '#6B7280',
        isCustom: false,
        userId: null,
        createdAt: undefined,
      }
    }));

    return NextResponse.json({ transactions: transactionsWithCategories });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

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

    const [newTransaction] = await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdBy: session.user.id,
      categoryId: validatedData.categoryId,
      description: validatedData.description,
      amount: validatedData.amount.toString(),
      date: validatedData.date.toISOString(),
      isFixed: validatedData.isFixed,
      isPrivate: validatedData.isPrivate || false,
      endDate: validatedData.endDate ? validatedData.endDate.toISOString() : null,
    }).returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
