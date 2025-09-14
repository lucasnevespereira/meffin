import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, users, categories } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  estimatedPrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export async function POST(
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
    const validatedData = createItemSchema.parse(body);

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

    // Verify the list exists and user has access
    const listResult = await db.select()
      .from(lists)
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
      return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 404 });
    }

    // Validate category exists
    const isDefaultCategory = validatedData.categoryId.startsWith('default_');

    if (!isDefaultCategory) {
      const customCategory = await db.select()
        .from(categories)
        .where(eq(categories.id, validatedData.categoryId))
        .limit(1);

      if (customCategory.length === 0) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      // Check if user has access to the custom category
      const categoryBelongsToUser = user[0].partnerId
        ? (customCategory[0].userId === session.user.id || customCategory[0].userId === user[0].partnerId)
        : customCategory[0].userId === session.user.id;

      if (!categoryBelongsToUser) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    } else {
      const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.id === validatedData.categoryId);
      if (!defaultCategory) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const [newItem] = await db.insert(listItems).values({
      id: crypto.randomUUID(),
      listId: listId,
      createdBy: session.user.id,
      name: validatedData.name,
      estimatedPrice: validatedData.estimatedPrice?.toString(),
      categoryId: validatedData.categoryId,
      isChecked: false,
    }).returning();

    // Update list's updatedAt timestamp
    await db.update(lists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(lists.id, listId));

    return NextResponse.json({ item: newItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating list item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}