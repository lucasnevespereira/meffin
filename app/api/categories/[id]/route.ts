import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, listItems, lists, transactions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { isDefaultCategoryId } from '@/lib/default-category-identity';
import { findCategoryNameConflict } from '@/lib/services/categories/category-name';
import { shouldArchiveCategory } from '@/lib/services/categories/lifecycle';

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

const restoreCategorySchema = z.object({
  archived: z.literal(false),
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
    const validatedData = updateCategorySchema.parse(body);

    // Check if it's a default category (cannot be edited)
    if (isDefaultCategoryId(id)) {
      return NextResponse.json({ error: 'Cannot edit default categories' }, { status: 403 });
    }

    // Verify category belongs to user
    const existingCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const conflict = await findCategoryNameConflict({
      userId: session.user.id,
      name: validatedData.name,
      type: validatedData.type,
      excludeCategoryId: id,
    });

    if (conflict?.kind === 'default') {
      return NextResponse.json({
        error: 'A built-in category already uses this name.',
        code: 'DEFAULT_CATEGORY_NAME_CONFLICT',
        categoryId: conflict.categoryId,
        categoryNameKey: conflict.categoryNameKey,
      }, { status: 409 });
    }

    if (conflict?.kind === 'custom') {
      return NextResponse.json({
        error: 'A custom category already uses this name.',
        code: 'CUSTOM_CATEGORY_NAME_CONFLICT',
        categoryId: conflict.categoryId,
      }, { status: 409 });
    }

    const [updatedCategory] = await db.update(categories)
      .set({
        name: validatedData.name,
        type: validatedData.type,
        color: validatedData.color,
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .returning();

    // Convert to unified format
    const categoryResponse = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      type: updatedCategory.type,
      color: updatedCategory.color,
      isCustom: true,
      userId: updatedCategory.userId,
      createdAt: updatedCategory.createdAt,
      archivedAt: updatedCategory.archivedAt,
    };

    return NextResponse.json({ category: categoryResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    restoreCategorySchema.parse(await request.json());

    if (isDefaultCategoryId(id)) {
      return NextResponse.json({ error: 'Cannot restore default categories' }, { status: 403 });
    }

    const [restoredCategory] = await db.update(categories)
      .set({ archivedAt: null })
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .returning();

    if (!restoredCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      category: {
        id: restoredCategory.id,
        name: restoredCategory.name,
        type: restoredCategory.type,
        color: restoredCategory.color,
        isCustom: true,
        userId: restoredCategory.userId,
        createdAt: restoredCategory.createdAt,
        archivedAt: restoredCategory.archivedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error restoring category:', error);
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

    // Check if it's a default category (cannot be deleted)
    if (isDefaultCategoryId(id)) {
      return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 403 });
    }

    // Verify category belongs to user
    const existingCategory = await db.select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const [categoryTransactions, categoryLists, categoryListItems] = await Promise.all([
      db.select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.categoryId, id))
        .limit(1),
      db.select({ id: lists.id })
        .from(lists)
        .where(eq(lists.categoryId, id))
        .limit(1),
      db.select({ id: listItems.id })
        .from(listItems)
        .where(eq(listItems.categoryId, id))
        .limit(1),
    ]);

    const shouldArchive = shouldArchiveCategory({
      transactions: categoryTransactions.length > 0,
      lists: categoryLists.length > 0,
      listItems: categoryListItems.length > 0,
    });

    if (shouldArchive) {
      await db.update(categories)
        .set({ archivedAt: new Date() })
        .where(and(
          eq(categories.id, id),
          eq(categories.userId, session.user.id)
        ));

      return NextResponse.json({ success: true, archived: true });
    }

    await db.delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .returning();

    return NextResponse.json({ success: true, archived: false });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
