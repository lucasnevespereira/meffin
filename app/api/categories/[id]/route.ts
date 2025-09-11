import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, transactions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
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
    if (id.startsWith('default_')) {
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
    if (id.startsWith('default_')) {
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

    // Check if category has transactions
    const categoryTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.categoryId, id))
      .limit(1);

    if (categoryTransactions.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete category with existing transactions'
      }, { status: 409 });
    }

    await db.delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      ))
      .returning();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
