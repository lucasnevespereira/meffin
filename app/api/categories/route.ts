import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, users } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';

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

    // Get custom categories from user and partner
    const userIds = user[0].partnerId ? [session.user.id, user[0].partnerId] : [session.user.id];
    
    const customCategories = await db.select()
      .from(categories)
      .where(or(...userIds.map(id => eq(categories.userId, id))))
      .orderBy(categories.name);

    // Convert database categories to unified format
    const customCategoriesFormatted: Category[] = customCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isCustom: true,
      userId: cat.userId,
      createdAt: cat.createdAt,
    }));

    // Convert default categories to unified format
    const defaultCategoriesFormatted: Category[] = DEFAULT_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name, // This is the i18n key
      type: cat.type,
      color: cat.color,
      isCustom: false,
      userId: null,
      createdAt: undefined,
    }));

    // Combine default and custom categories
    const allCategories = [...defaultCategoriesFormatted, ...customCategoriesFormatted];

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
      createdBy: session.user.id,
      name: validatedData.name,
      type: validatedData.type,
      color: validatedData.color,
    }).returning();

    // Convert to unified format
    const categoryResponse: Category = {
      id: newCategory.id,
      name: newCategory.name,
      type: newCategory.type,
      color: newCategory.color,
      isCustom: true,
      userId: newCategory.userId,
      createdAt: newCategory.createdAt,
    };

    return NextResponse.json({ category: categoryResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
