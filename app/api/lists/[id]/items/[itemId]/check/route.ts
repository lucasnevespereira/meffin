import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, categories, users, transactions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, or, and } from 'drizzle-orm';
import { z } from 'zod';

const checkItemSchema = z.object({
  actualPrice: z.number().positive().optional(),
  isChecked: z.boolean(),
});

export async function POST(
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
    const validatedData = checkItemSchema.parse(body);

    // Get the item with list info
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

    const { item, list } = itemResult[0];

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

    let transactionId = item.transactionId;

    // If checking the item, create a transaction
    if (validatedData.isChecked && !item.isChecked) {
      const amount = validatedData.actualPrice || (item.estimatedPrice ? parseFloat(item.estimatedPrice) : 0);

      if (amount > 0) {
        const [newTransaction] = await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: list.userId, // Use list owner as transaction owner
          createdBy: session.user.id,
          categoryId: item.categoryId,
          description: `${item.name} (from ${list.title})`,
          amount: amount.toString(),
          date: new Date().toISOString(),
          isFixed: false,
          isPrivate: false,
          repeatType: 'once',
        }).returning();

        transactionId = newTransaction.id;
      }
    }

    // If unchecking the item and there's a linked transaction, delete it
    if (!validatedData.isChecked && item.isChecked && item.transactionId) {
      await db.delete(transactions).where(eq(transactions.id, item.transactionId));
      transactionId = null;
    }

    // Update the item
    const [updatedItem] = await db.update(listItems)
      .set({
        isChecked: validatedData.isChecked,
        checkedAt: validatedData.isChecked ? new Date().toISOString() : null,
        transactionId: transactionId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(listItems.id, itemId))
      .returning();

    // Update list's updatedAt timestamp
    await db.update(lists)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(lists.id, listId));

    return NextResponse.json({
      item: updatedItem,
      transactionCreated: validatedData.isChecked && !item.isChecked && transactionId,
      transactionDeleted: !validatedData.isChecked && item.isChecked && item.transactionId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error checking/unchecking item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}