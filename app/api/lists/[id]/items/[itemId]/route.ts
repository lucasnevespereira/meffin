import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  estimatedPrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
});


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId, itemId } = await params;
    const body = await request.json();
    const validatedData = updateItemSchema.parse(body);

    // Verify the item belongs to a list the user has access to
    const itemResult = await db.select({
      item: listItems,
      list: lists
    })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(and(
      eq(listItems.id, itemId),
      eq(listItems.listId, listId)
    ))
    .limit(1);

    if (!itemResult.length) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check user has access to the list
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

    // Check if user has access to this list
    const list = itemResult[0].list;
    const hasAccess = user[0].partnerId
      ? (
          // Own list - full access
          list.userId === session.user.id ||
          // Partner's shared list
          (list.userId === user[0].partnerId && list.isShared)
        )
      : list.userId === session.user.id; // No partner - only own lists

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [updatedItem] = await db.update(listItems)
      .set({
        name: validatedData.name,
        estimatedPrice: validatedData.estimatedPrice?.toString(),
        categoryId: validatedData.categoryId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(listItems.id, itemId))
      .returning();

    // Update list's updatedAt timestamp
    await db.update(lists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(lists.id, listId));

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId, itemId } = await params;

    // Verify the item belongs to a list the user has access to
    const itemResult = await db.select({
      item: listItems,
      list: lists
    })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(and(
      eq(listItems.id, itemId),
      eq(listItems.listId, listId)
    ))
    .limit(1);

    if (!itemResult.length) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check user has access to the list
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

    // Check if user has access to this list
    const list = itemResult[0].list;
    const hasAccess = user[0].partnerId
      ? (
          // Own list - full access
          list.userId === session.user.id ||
          // Partner's shared list
          (list.userId === user[0].partnerId && list.isShared)
        )
      : list.userId === session.user.id; // No partner - only own lists

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.delete(listItems).where(eq(listItems.id, itemId));

    // Update list's updatedAt timestamp
    await db.update(lists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(lists.id, listId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}