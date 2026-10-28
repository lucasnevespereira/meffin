import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lists, listItems, users, transactions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { canUseCategory } from '@/lib/services/categories/access';

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

    return await db.transaction(async (tx) => {
      // The lock makes concurrent check/uncheck requests observe the latest item state.
      // The expense and item state then commit or roll back together.
      const itemResult = await tx.select({ item: listItems, list: lists })
        .from(listItems)
        .innerJoin(lists, eq(listItems.listId, lists.id))
        .where(and(eq(listItems.id, itemId), eq(listItems.listId, listId)))
        .limit(1)
        .for('update', { of: listItems });

      if (!itemResult.length) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const { item, list } = itemResult[0];
      const hasAccess = user[0].partnerId
        ? list.userId === session.user.id ||
          (list.userId === user[0].partnerId && list.isShared)
        : list.userId === session.user.id;

      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Repeated requests for the same state must not create or remove an expense.
      if (item.isChecked === validatedData.isChecked) {
        return NextResponse.json({
          item,
          transactionCreated: false,
          transactionDeleted: false,
        });
      }

      let transactionId = item.transactionId;
      if (validatedData.isChecked) {
        const userIds = user[0].partnerId
          ? [session.user.id, user[0].partnerId]
          : [session.user.id];
        if (!await canUseCategory({
          categoryId: item.categoryId,
          userIds,
          includeArchived: true,
          type: 'expense',
          database: tx,
        })) {
          return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        const amount = validatedData.actualPrice ??
          (item.estimatedPrice ? parseFloat(item.estimatedPrice) : 0);

        if (amount > 0) {
          const [newTransaction] = await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId: list.userId,
            createdBy: session.user.id,
            categoryId: item.categoryId,
            description: item.name,
            amount: amount.toString(),
            date: new Date().toISOString(),
            isFixed: false,
            isPrivate: false,
            repeatType: 'once',
          }).returning();

          transactionId = newTransaction.id;
        }
      } else if (item.transactionId) {
        await tx.delete(transactions).where(eq(transactions.id, item.transactionId));
        transactionId = null;
      }

      const now = new Date().toISOString();
      const [updatedItem] = await tx.update(listItems)
        .set({
          isChecked: validatedData.isChecked,
          checkedAt: validatedData.isChecked ? now : null,
          transactionId,
          updatedAt: now,
        })
        .where(eq(listItems.id, itemId))
        .returning();

      await tx.update(lists)
        .set({ updatedAt: now })
        .where(eq(lists.id, listId));

      return NextResponse.json({
        item: updatedItem,
        transactionCreated: validatedData.isChecked ? transactionId : false,
        transactionDeleted: !validatedData.isChecked ? item.transactionId : false,
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error checking/unchecking item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
