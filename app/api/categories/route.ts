import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORY_IDS } from '@/lib/default-categories';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's custom categories from database
    const customCategories = await db.select()
      .from(categories)
      .where(eq(categories.userId, session.user.id))
      .orderBy(categories.name);

    // Hardcoded default categories with proper structure for API
    const defaultCategories = [
      // Income categories
      { id: DEFAULT_CATEGORY_IDS.salary, name: 'Salary', type: 'income' as const, color: '#10B981', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.freelance, name: 'Freelance', type: 'income' as const, color: '#3B82F6', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.investment, name: 'Investment', type: 'income' as const, color: '#8B5CF6', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.business, name: 'Business', type: 'income' as const, color: '#06B6D4', userId: null, createdAt: new Date(), isCustom: false },
      
      // Expense categories
      { id: DEFAULT_CATEGORY_IDS.groceries, name: 'Groceries', type: 'expense' as const, color: '#EF4444', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.transportation, name: 'Transportation', type: 'expense' as const, color: '#F59E0B', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.housing, name: 'Housing', type: 'expense' as const, color: '#6366F1', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.utilities, name: 'Utilities', type: 'expense' as const, color: '#EC4899', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.entertainment, name: 'Entertainment', type: 'expense' as const, color: '#14B8A6', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.healthcare, name: 'Healthcare', type: 'expense' as const, color: '#F97316', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.shopping, name: 'Shopping', type: 'expense' as const, color: '#84CC16', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.education, name: 'Education', type: 'expense' as const, color: '#8B5CF6', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.insurance, name: 'Insurance', type: 'expense' as const, color: '#6B7280', userId: null, createdAt: new Date(), isCustom: false },
      { id: DEFAULT_CATEGORY_IDS.dining, name: 'Dining Out', type: 'expense' as const, color: '#F59E0B', userId: null, createdAt: new Date(), isCustom: false },
    ];

    // Combine default and custom categories
    const allCategories = [...defaultCategories, ...customCategories];

    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const validatedData = createCategorySchema.parse(body);

    const [newCategory] = await db.insert(categories).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: validatedData.name,
      type: validatedData.type,
      color: validatedData.color,
      isCustom: true, // User-created categories are custom
    }).returning();

    return NextResponse.json({ category: newCategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
