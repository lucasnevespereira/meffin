import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORY_IDS } from '@/lib/default-categories';

const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().min(1, 'Date is required'),
  isFixed: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get transactions
    const userTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, session.user.id))
      .orderBy(desc(transactions.date));

    // Get custom categories
    const customCategories = await db.select()
      .from(categories)
      .where(eq(categories.userId, session.user.id));

    // Default categories lookup
    const defaultCategories = {
      [DEFAULT_CATEGORY_IDS.salary]: { id: DEFAULT_CATEGORY_IDS.salary, name: 'Salary', type: 'income', color: '#10B981', isCustom: false },
      [DEFAULT_CATEGORY_IDS.freelance]: { id: DEFAULT_CATEGORY_IDS.freelance, name: 'Freelance', type: 'income', color: '#3B82F6', isCustom: false },
      [DEFAULT_CATEGORY_IDS.investment]: { id: DEFAULT_CATEGORY_IDS.investment, name: 'Investment', type: 'income', color: '#8B5CF6', isCustom: false },
      [DEFAULT_CATEGORY_IDS.business]: { id: DEFAULT_CATEGORY_IDS.business, name: 'Business', type: 'income', color: '#06B6D4', isCustom: false },
      [DEFAULT_CATEGORY_IDS.groceries]: { id: DEFAULT_CATEGORY_IDS.groceries, name: 'Groceries', type: 'expense', color: '#EF4444', isCustom: false },
      [DEFAULT_CATEGORY_IDS.transportation]: { id: DEFAULT_CATEGORY_IDS.transportation, name: 'Transportation', type: 'expense', color: '#F59E0B', isCustom: false },
      [DEFAULT_CATEGORY_IDS.housing]: { id: DEFAULT_CATEGORY_IDS.housing, name: 'Housing', type: 'expense', color: '#6366F1', isCustom: false },
      [DEFAULT_CATEGORY_IDS.utilities]: { id: DEFAULT_CATEGORY_IDS.utilities, name: 'Utilities', type: 'expense', color: '#EC4899', isCustom: false },
      [DEFAULT_CATEGORY_IDS.entertainment]: { id: DEFAULT_CATEGORY_IDS.entertainment, name: 'Entertainment', type: 'expense', color: '#14B8A6', isCustom: false },
      [DEFAULT_CATEGORY_IDS.healthcare]: { id: DEFAULT_CATEGORY_IDS.healthcare, name: 'Healthcare', type: 'expense', color: '#F97316', isCustom: false },
      [DEFAULT_CATEGORY_IDS.shopping]: { id: DEFAULT_CATEGORY_IDS.shopping, name: 'Shopping', type: 'expense', color: '#84CC16', isCustom: false },
      [DEFAULT_CATEGORY_IDS.education]: { id: DEFAULT_CATEGORY_IDS.education, name: 'Education', type: 'expense', color: '#8B5CF6', isCustom: false },
      [DEFAULT_CATEGORY_IDS.insurance]: { id: DEFAULT_CATEGORY_IDS.insurance, name: 'Insurance', type: 'expense', color: '#6B7280', isCustom: false },
      [DEFAULT_CATEGORY_IDS.dining]: { id: DEFAULT_CATEGORY_IDS.dining, name: 'Dining Out', type: 'expense', color: '#F59E0B', isCustom: false },
    };

    // Create category lookup
    const categoryLookup = { ...defaultCategories };
    customCategories.forEach(cat => {
      categoryLookup[cat.id] = cat;
    });

    // Map transactions with category info
    const transactionsWithCategories = userTransactions.map(transaction => ({
      ...transaction,
      categoryId: transaction.categoryId,
      category: categoryLookup[transaction.categoryId] || { 
        id: transaction.categoryId, 
        name: 'Unknown', 
        type: 'expense', 
        color: '#6B7280',
        isCustom: false 
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

    const [newTransaction] = await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      categoryId: validatedData.categoryId,
      description: validatedData.description,
      amount: validatedData.amount.toString(),
      date: new Date(validatedData.date),
      isFixed: validatedData.isFixed,
    }).returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}