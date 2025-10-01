import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or, and, gte, lte } from 'drizzle-orm';
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
  repeatType: z.enum(['forever', '3months', '4months', '6months', '12months', 'annual', 'until', 'once']).default('once'),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().getMonth().toString();
    const year = url.searchParams.get('year') || new Date().getFullYear().toString();
    const isAnnualQuery = url.searchParams.get('annual') === 'true';

    const startDate = new Date(parseInt(year), parseInt(month), 1, 0, 0, 0, 0);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999);


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

    type TransactionWithCreator = {
      transaction: typeof transactions.$inferSelect;
      creator: {
        id: string;
        name: string;
      } | null;
    };
    
    let userTransactions: TransactionWithCreator[] = [];

    if (isAnnualQuery) {
      // For annual query, return ALL annual transactions regardless of month
      userTransactions = await db.select({
        transaction: transactions,
        creator: {
          id: users.id,
          name: users.name,
        }
      })
        .from(transactions)
        .leftJoin(users, eq(transactions.createdBy, users.id))
        .where(and(
          or(...userIds.map(id => eq(transactions.userId, id))),
          eq(transactions.repeatType, 'annual')
        ))
        .orderBy(desc(transactions.date));
    } else {
      // Get regular transactions for this month (EXCLUDING annual transactions)
      const monthlyTransactions = await db.select({
        transaction: transactions,
        creator: {
          id: users.id,
          name: users.name,
        }
      })
        .from(transactions)
        .leftJoin(users, eq(transactions.createdBy, users.id))
        .where(and(
          or(...userIds.map(id => eq(transactions.userId, id))),
          gte(transactions.date, startDate.toISOString()),
          lte(transactions.date, endDate.toISOString()),
          // Exclude annual transactions from monthly query to prevent duplication
          or(
            eq(transactions.repeatType, 'once'),
            eq(transactions.repeatType, 'forever'),
            eq(transactions.repeatType, '3months'),
            eq(transactions.repeatType, '4months'),
            eq(transactions.repeatType, '6months'),
            eq(transactions.repeatType, '12months'),
            eq(transactions.repeatType, 'until')
          )
        ))
        .orderBy(desc(transactions.date));

      // Get annual transactions that should appear in this month
      const annualTransactions = await db.select({
        transaction: transactions,
        creator: {
          id: users.id,
          name: users.name,
        }
      })
        .from(transactions)
        .leftJoin(users, eq(transactions.createdBy, users.id))
        .where(and(
          or(...userIds.map(id => eq(transactions.userId, id))),
          eq(transactions.repeatType, 'annual')
        ));

      // Filter annual transactions to only include ones that renew in current month
      const currentMonthAnnuals = annualTransactions.filter(({ transaction }) => {
        const annualDate = new Date(transaction.date);
        return annualDate.getMonth() === parseInt(month);
      });

      // Combine monthly and applicable annual transactions
      userTransactions = [...monthlyTransactions, ...currentMonthAnnuals];
    }

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

    const transactionData = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdBy: session.user.id,
      categoryId: validatedData.categoryId,
      description: validatedData.description,
      amount: validatedData.amount.toString(),
      date: validatedData.date.toISOString(),
      isFixed: validatedData.isFixed,
      isPrivate: validatedData.isPrivate || false,
      repeatType: validatedData.repeatType || 'once',
      endDate: validatedData.endDate ? validatedData.endDate.toISOString() : null,
    };

    const [newTransaction] = await db.insert(transactions).values(transactionData).returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
