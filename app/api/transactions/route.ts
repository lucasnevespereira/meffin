import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';
import {
  resolveViewer,
  getEntries,
  getCategoryLookup,
  getCreators,
  getAnnualSeries,
} from '@/lib/services/budget/budget';
import { monthKey, monthKeyFromDateString, currentMonthKey, occurrenceDate, dayOfMonth } from '@/lib/services/budget/keys';

const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  date: z.string().pipe(z.coerce.date()),
  isFixed: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  repeatType: z.enum(['forever', '3months', '4months', '6months', '12months', 'annual', 'until', 'once']).default('once'),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
});

const UNKNOWN_CATEGORY: Category = {
  id: '',
  name: 'Unknown',
  type: 'expense',
  color: '#6B7280',
  isCustom: false,
  userId: null,
  createdAt: undefined,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const viewer = await resolveViewer(session.user.id);
    if (!viewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const monthParam = parseInt(url.searchParams.get('month') ?? '');
    const yearParam = parseInt(url.searchParams.get('year') ?? '');
    const month = Number.isInteger(monthParam) && monthParam >= 0 && monthParam <= 11 ? monthParam : now.getMonth();
    const year = Number.isInteger(yearParam) && yearParam >= 1970 && yearParam <= 9999 ? yearParam : now.getFullYear();
    const isAnnualQuery = url.searchParams.get('annual') === 'true';

    const [lookup, creators] = await Promise.all([
      getCategoryLookup(viewer.userIds),
      getCreators(viewer.userIds),
    ]);

    const rows = isAnnualQuery
      ? (await getAnnualSeries(viewer)).map(row => ({
          ...row,
          amount: row.amount,
          source: 'actual' as const,
        }))
      : (await getEntries(viewer, monthKey(year, month), monthKey(year, month))).map(entry => ({
          ...entry,
          amount: entry.amount.toString(),
        }));

    const transactionsWithCategories = rows.map(row => ({
      ...row,
      categoryId: row.categoryId,
      createdBy: creators[row.createdBy] ?? null,
      category: lookup[row.categoryId] ?? { ...UNKNOWN_CATEGORY, id: row.categoryId },
    }));

    return NextResponse.json({ transactions: transactionsWithCategories });
  } catch (error) {
    console.error('Error fetching transactions:', error);
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
    const validatedData = createTransactionSchema.parse(body);

    // Validate category exists
    const isDefaultCategory = validatedData.categoryId.startsWith('default_');

    if (!isDefaultCategory) {
      // Custom category must belong to the user or their partner
      const [user] = await db.select({ partnerId: users.partnerId })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      const allowedOwners = user?.partnerId ? [session.user.id, user.partnerId] : [session.user.id];

      const customCategory = await db.select()
        .from(categories)
        .where(eq(categories.id, validatedData.categoryId))
        .limit(1);

      if (customCategory.length === 0 || !allowedOwners.includes(customCategory[0].userId)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    } else {
      // Check if default category exists
      const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.id === validatedData.categoryId);
      if (!defaultCategory) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    const requestedDate = validatedData.date.toISOString();
    // `repeatType` is the discriminator, not `isFixed` — the latter has no constraint and
    // legacy rows disagree with it.
    const isSeries = validatedData.repeatType !== 'once';
    const isAnnual = validatedData.repeatType === 'annual';

    // A monthly series backdated to last year would otherwise project into every month
    // since, rewriting months the user already reconciled. Annual keeps its date: the
    // renewal month is the whole point, and annuals never materialize.
    const requestedKey = monthKeyFromDateString(requestedDate);
    const startKey = isSeries && !isAnnual
      ? Math.max(requestedKey, currentMonthKey())
      : requestedKey;
    const date = startKey === requestedKey
      ? requestedDate
      : occurrenceDate(startKey, dayOfMonth(requestedDate));

    const endDate = validatedData.endDate ? validatedData.endDate.toISOString() : null;

    const [newTransaction] = await db.insert(transactions).values({
      id,
      userId: session.user.id,
      createdBy: session.user.id,
      categoryId: validatedData.categoryId,
      description: validatedData.description,
      amount: validatedData.amount.toString(),
      date,
      isFixed: isSeries,
      isPrivate: validatedData.isPrivate || false,
      repeatType: validatedData.repeatType,
      endDate,
      seriesId: isSeries ? id : null,
      endMonth: isSeries && endDate ? monthKeyFromDateString(endDate) : null,
    }).returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
