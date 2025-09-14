import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';

const createListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  isShared: z.boolean().default(false),
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

    // Get lists from user and partner
    const userIds = user[0].partnerId ? [session.user.id, user[0].partnerId] : [session.user.id];

    type ListWithCreator = {
      list: typeof lists.$inferSelect;
      creator: {
        id: string;
        name: string;
      } | null;
    };

    // Get user's lists with creator info
    const userLists: ListWithCreator[] = await db.select({
      list: lists,
      creator: {
        id: users.id,
        name: users.name,
      }
    })
    .from(lists)
    .leftJoin(users, eq(lists.createdBy, users.id))
    .where(
      user[0].partnerId
        ? or(
            // Own lists (all of them)
            eq(lists.userId, session.user.id),
            // Partner's shared lists only
            and(eq(lists.userId, user[0].partnerId), eq(lists.isShared, true))
          )
        : eq(lists.userId, session.user.id) // No partner, only own lists
    )
    .orderBy(desc(lists.updatedAt));

    // Get item counts and totals for each list
    const listIds = userLists.map(({ list }) => list.id);

    const itemCounts: Record<string, { total: number; checked: number; estimatedTotal: number }> = {};

    if (listIds.length > 0) {
      const itemCountsQuery = await db.select({
        listId: listItems.listId,
        total: sql<number>`count(*)::integer`,
        checked: sql<number>`count(case when ${listItems.isChecked} then 1 end)::integer`,
        estimatedTotal: sql<string>`coalesce(sum(${listItems.estimatedPrice}), 0)`,
      })
      .from(listItems)
      .where(or(...listIds.map(id => eq(listItems.listId, id))))
      .groupBy(listItems.listId);

      itemCountsQuery.forEach(item => {
        itemCounts[item.listId] = {
          total: item.total,
          checked: item.checked,
          estimatedTotal: parseFloat(item.estimatedTotal),
        };
      });
    }

    // Map lists with counts
    const listsWithCounts = userLists.map(({ list, creator }) => ({
      ...list,
      createdBy: creator,
      itemCount: itemCounts[list.id]?.total || 0,
      checkedCount: itemCounts[list.id]?.checked || 0,
      totalEstimatedPrice: itemCounts[list.id]?.estimatedTotal || 0,
    }));

    return NextResponse.json({ lists: listsWithCounts });
  } catch (error) {
    console.error('Error fetching lists:', error);
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
    const validatedData = createListSchema.parse(body);

    const [newList] = await db.insert(lists).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      createdBy: session.user.id,
      title: validatedData.title,
      description: validatedData.description || null,
      color: validatedData.color,
      isShared: validatedData.isShared,
    }).returning();

    return NextResponse.json({ list: newList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}