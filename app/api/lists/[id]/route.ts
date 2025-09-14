import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or, and } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';

const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  isShared: z.boolean().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId } = await params;

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

    // Get the list with creator info
    const listResult = await db.select({
      list: lists,
      creator: {
        id: users.id,
        name: users.name,
      }
    })
    .from(lists)
    .leftJoin(users, eq(lists.createdBy, users.id))
    .where(
      and(
        eq(lists.id, listId),
        user[0].partnerId
          ? or(
              // Own lists (all of them)
              eq(lists.userId, session.user.id),
              // Partner's shared lists only
              and(eq(lists.userId, user[0].partnerId), eq(lists.isShared, true))
            )
          : eq(lists.userId, session.user.id) // No partner, only own lists
      )
    )
    .limit(1);

    if (!listResult.length) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Get list items with creator info
    const listItemsResult = await db.select({
      item: listItems,
      creator: {
        id: users.id,
        name: users.name,
      }
    })
    .from(listItems)
    .leftJoin(users, eq(listItems.createdBy, users.id))
    .where(eq(listItems.listId, listId))
    .orderBy(desc(listItems.createdAt));

    // Get custom categories
    const customCategories = await db.select()
      .from(categories)
      .where(
        user[0].partnerId
          ? or(eq(categories.userId, session.user.id), eq(categories.userId, user[0].partnerId))
          : eq(categories.userId, session.user.id)
      );

    // Create category lookup
    const categoryLookup: Record<string, Category> = {};

    // Add default categories
    DEFAULT_CATEGORIES.forEach(cat => {
      categoryLookup[cat.id] = {
        id: cat.id,
        name: cat.name,
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

    // Map items with category info
    const itemsWithCategories = listItemsResult.map(({ item, creator }) => ({
      ...item,
      createdBy: creator,
      category: categoryLookup[item.categoryId] || {
        id: item.categoryId,
        name: 'Unknown',
        type: 'expense' as const,
        color: '#6B7280',
        isCustom: false,
        userId: null,
        createdAt: undefined,
      }
    }));

    const listWithItems = {
      ...listResult[0].list,
      createdBy: listResult[0].creator,
      items: itemsWithCategories,
      itemCount: itemsWithCategories.length,
      checkedCount: itemsWithCategories.filter(item => item.isChecked).length,
      totalEstimatedPrice: itemsWithCategories.reduce((sum, item) =>
        sum + (item.estimatedPrice ? parseFloat(item.estimatedPrice) : 0), 0
      ),
    };

    return NextResponse.json({ list: listWithItems });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId } = await params;
    const body = await request.json();
    const validatedData = updateListSchema.parse(body);

    // Verify the list belongs to the user
    const existingList = await db.select()
      .from(lists)
      .where(and(
        eq(lists.id, listId),
        eq(lists.userId, session.user.id)
      ))
      .limit(1);

    if (!existingList.length) {
      return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 404 });
    }

    const [updatedList] = await db.update(lists)
      .set({
        title: validatedData.title,
        description: validatedData.description || null,
        color: validatedData.color,
        isShared: validatedData.isShared,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(lists.id, listId))
      .returning();

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error updating list:', error);
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

    const { id: listId } = await params;

    // Verify the list belongs to the user
    const existingList = await db.select()
      .from(lists)
      .where(and(
        eq(lists.id, listId),
        eq(lists.userId, session.user.id)
      ))
      .limit(1);

    if (!existingList.length) {
      return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 404 });
    }

    // Delete the list (items will be deleted automatically due to cascade)
    await db.delete(lists).where(eq(lists.id, listId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}