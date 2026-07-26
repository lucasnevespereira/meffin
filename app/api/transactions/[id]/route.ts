import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, users, listItems } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, gte, inArray, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { isProjectedId } from '@/lib/services/budget/project';
import {
  monthKeyFromDateString,
  occurrenceDate,
  dayOfMonth,
} from '@/lib/services/budget/keys';
import {
  canonicalEndDate,
  resolveEndMonth,
  resolveOccurrenceMonth,
} from '@/lib/services/budget/schedule';
import { canUseCategory } from '@/lib/services/categories/access';

const updateTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().pipe(z.coerce.date()),
  isFixed: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  repeatType: z.enum(['forever', '3months', '4months', '6months', '12months', 'annual', 'until', 'once']).default('once'),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
});

/** Future months have no stored row, so they carry a synthetic id. They're preview-only:
 *  changing the forecast means editing the current month, which is a real row. */
const PROJECTED_MESSAGE = 'This month is a forecast. Edit the current month to change it.';
const deleteScopeSchema = z.enum(['occurrence', 'future']);

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
    if (isProjectedId(id)) {
      return NextResponse.json({ error: PROJECTED_MESSAGE }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Get current user's partner info to determine access
    const [user] = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if transaction exists and is accessible to user or their partner
    const userIds = user.partnerId ? [session.user.id, user.partnerId] : [session.user.id];

    const [existing] = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        inArray(transactions.userId, userIds),
        eq(transactions.voided, false)
      ))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if user is the creator of this transaction (creator-only editing)
    if (existing.createdBy !== session.user.id) {
      return NextResponse.json({
        error: 'You can only edit transactions that you created'
      }, { status: 403 });
    }

    const keepsCurrentCategory = validatedData.categoryId === existing.categoryId;
    if (!await canUseCategory({
      categoryId: validatedData.categoryId,
      userIds,
      includeArchived: keepsCurrentCategory,
    })) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const submittedDate = validatedData.date.toISOString();
    const submittedMonth = monthKeyFromDateString(submittedDate);
    const submittedEndDate = validatedData.endDate
      ? validatedData.endDate.toISOString()
      : null;
    const repeatType = validatedData.repeatType;
    const wantsSeries = repeatType !== 'once';

    // An occurrence belongs to its month; only the day is editable. Letting a submitted
    // date move it would collide with the row already sitting in the target month — and
    // clients round-trip whatever date they were handed. One-off rows move freely, which
    // is what dating a bill into a future month relies on.
    const occurrenceMonth = resolveOccurrenceMonth(
      existing,
      submittedMonth,
      repeatType
    );
    const keepsSubmittedDate =
      !existing.seriesId ||
      (existing.repeatType === 'annual' && repeatType === 'annual');
    const date =
      keepsSubmittedDate && occurrenceMonth === submittedMonth
        ? submittedDate
        : occurrenceDate(occurrenceMonth, dayOfMonth(submittedDate));

    let seriesId = existing.seriesId;

    if (!existing.seriesId && wantsSeries) {
      // Turning a one-off into a series. A shopping-list transaction can't make the trip:
      // its list item points at this row, and unchecking the item relies on deleting it.
      const [linked] = await db
        .select({ id: listItems.id })
        .from(listItems)
        .where(and(eq(listItems.transactionId, id), isNotNull(listItems.transactionId)))
        .limit(1);

      if (linked) {
        return NextResponse.json({
          error: 'This transaction came from a shopping list and cannot be made recurring.'
        }, { status: 400 });
      }

      seriesId = id;
    }

    const endMonth = resolveEndMonth(
      existing,
      occurrenceMonth,
      repeatType,
      submittedEndDate
    );

    if (repeatType === 'until' && endMonth === null) {
      return NextResponse.json({ error: 'End date is required' }, { status: 400 });
    }
    if (endMonth !== null && endMonth < occurrenceMonth) {
      return NextResponse.json({
        error: 'End date cannot be before the first occurrence'
      }, { status: 400 });
    }

    const endDate = canonicalEndDate(
      endMonth,
      repeatType,
      date,
      submittedEndDate
    );

    const [updatedTransaction] = await db.update(transactions)
      .set({
        description: validatedData.description,
        amount: validatedData.amount.toString(),
        categoryId: validatedData.categoryId,
        date,
        isFixed: wantsSeries,
        isPrivate: validatedData.isPrivate || false,
        repeatType,
        endDate,
        seriesId,
        endMonth,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(transactions.id, id),
        eq(transactions.createdBy, session.user.id)
      ))
      .returning();

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Error updating transaction:', error);
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
    if (isProjectedId(id)) {
      return NextResponse.json({ error: PROJECTED_MESSAGE }, { status: 400 });
    }

    const submittedScope = request.nextUrl.searchParams.get('scope');
    const parsedScope = submittedScope
      ? deleteScopeSchema.safeParse(submittedScope)
      : null;

    if (parsedScope && !parsedScope.success) {
      return NextResponse.json({ error: 'Invalid delete scope' }, { status: 400 });
    }

    // Existing clients don't send a scope. For a recurring transaction, stopping the
    // schedule is the least surprising behavior: a transaction the user deleted must not
    // silently return in next month's forecast.
    const deleteScope = parsedScope?.data ?? 'future';

    // Get current user's partner info to determine access
    const [user] = await db
      .select({
        id: users.id,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if transaction exists and is accessible to user or their partner
    const userIds = user.partnerId ? [session.user.id, user.partnerId] : [session.user.id];

    const [existing] = await db.select({
      id: transactions.id,
      createdBy: transactions.createdBy,
      seriesId: transactions.seriesId,
      monthKey: transactions.monthKey,
      date: transactions.date,
    })
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        inArray(transactions.userId, userIds),
        eq(transactions.voided, false)
      ))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if user is the creator of this transaction (creator-only deletion)
    if (existing.createdBy !== session.user.id) {
      return NextResponse.json({
        error: 'You can only delete transactions that you created'
      }, { status: 403 });
    }

    if (existing.seriesId) {
      const seriesId = existing.seriesId;

      if (deleteScope === 'occurrence') {
        // Void rather than delete. A removed row would just be written again by the next
        // materialization pass, and the tombstone is what keeps this one-month gap sticky.
        await db.update(transactions)
          .set({ voided: true, updatedAt: new Date().toISOString() })
          .where(and(
            eq(transactions.id, id),
            eq(transactions.createdBy, session.user.id)
          ));
      } else {
        const endMonth = existing.monthKey - 1;
        const endDate = occurrenceDate(endMonth, dayOfMonth(existing.date));
        const updatedAt = new Date().toISOString();

        await db.transaction(async (tx) => {
          // The schedule belongs to the series, not to one occurrence. Persist the bound
          // on every row so whichever historical row becomes the live head carries the
          // same end date and cannot restart the forecast.
          await tx.update(transactions)
            .set({
              isFixed: true,
              repeatType: 'until',
              endDate,
              endMonth,
              updatedAt,
            })
            .where(and(
              eq(transactions.seriesId, seriesId),
              eq(transactions.createdBy, session.user.id)
            ));

          // Keep historical occurrences, but remove the selected month and any stored
          // rows after it. Future projections disappear because the head now ends in the
          // preceding month.
          await tx.update(transactions)
            .set({ voided: true, updatedAt })
            .where(and(
              eq(transactions.seriesId, seriesId),
              eq(transactions.createdBy, session.user.id),
              gte(transactions.monthKey, existing.monthKey)
            ));
        });
      }
    } else {
      const result = await db.delete(transactions)
        .where(and(
          eq(transactions.id, id),
          eq(transactions.createdBy, session.user.id)
        ))
        .returning();

      if (result.length === 0) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, scope: deleteScope });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
