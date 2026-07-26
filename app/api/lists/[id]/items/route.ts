import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { canUseCategory } from '@/lib/services/categories/access';
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

    const userIds = user[0].partnerId
      ? [session.user.id, user[0].partnerId]
      : [session.user.id];

    if (!await canUseCategory({ categoryId: validatedData.categoryId, userIds })) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
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
