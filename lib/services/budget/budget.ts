import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, inArray, isNotNull } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';
import { MonthKey, monthKey, currentMonthKey, occurrenceDate, dayOfMonth } from './keys';
import {
  Entry,
  SeriesHead,
  projectSeries,
  missingMonths,
  occupiedKey,
  toSeriesHead,
} from './project';
import { canonicalEndDate, repeatTypeOf } from './schedule';

/**
 * The only place that reads transaction rows for display.
 *
 * Everything that used to be duplicated across the dashboard, history and transactions
 * routes lives here now — partner resolution, the private-transaction filter, the
 * category lookup, and the choice between a stored row and a projected one. Routes get
 * finished entries and never touch the table.
 */

export type MonthPoint = {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
};

export type CategorySummary = {
  categoryId: string;
  category: Category;
  total: number;
  transactionCount: number;
};

export type MonthView = {
  balance: { balance: number; income: number; expenses: number };
  categoryBreakdown: CategorySummary[];
  month: number;
  year: number;
};

export type Viewer = {
  userId: string;
  userIds: string[];
};

export async function resolveViewer(viewerId: string): Promise<Viewer | null> {
  const [user] = await db
    .select({ id: users.id, partnerId: users.partnerId })
    .from(users)
    .where(eq(users.id, viewerId))
    .limit(1);

  if (!user) return null;
  return {
    userId: viewerId,
    userIds: user.partnerId ? [viewerId, user.partnerId] : [viewerId],
  };
}

/**
 * A partner's private transactions are excluded outright, not masked. The amount is the
 * sensitive part of a budget entry, so each partner's totals legitimately differ.
 */
const isVisibleTo = (viewerId: string) => (row: { isPrivate: boolean | null; createdBy: string }) =>
  !(row.isPrivate && row.createdBy !== viewerId);

/**
 * Rows an older version of the cron generated with a marker in the description. The
 * dashboard has always left them out of its totals while the transaction list still
 * shows them; keeping that split avoids a surprise jump in anyone's balance.
 */
const isLegacyGenerated = (description: string) =>
  description.includes('(Monthly Budget)') || description.includes('(Annual Renewal)');

export async function getCategoryLookup(userIds: string[]): Promise<Record<string, Category>> {
  const custom = await db
    .select()
    .from(categories)
    .where(inArray(categories.userId, userIds));

  const lookup: Record<string, Category> = {};

  for (const cat of DEFAULT_CATEGORIES) {
    lookup[cat.id] = {
      id: cat.id,
      name: cat.name, // i18n key
      type: cat.type,
      color: cat.color,
      isCustom: false,
      userId: null,
      createdAt: undefined,
      archivedAt: null,
    };
  }

  for (const cat of custom) {
    lookup[cat.id] = {
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isCustom: true,
      userId: cat.userId,
      createdAt: cat.createdAt,
      archivedAt: cat.archivedAt,
    };
  }

  return lookup;
}

/** Routes render `createdBy` as `{ id, name }`; the column only holds the id. */
export async function getCreators(userIds: string[]): Promise<Record<string, { id: string; name: string }>> {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));

  return Object.fromEntries(rows.map(row => [row.id, row]));
}

/**
 * Annual transactions, one row each. They were never materialized, so a single row has
 * always represented every renewal — which is why the annual tab can keep showing real,
 * editable ids with no month context.
 */
export async function getAnnualSeries(viewer: Viewer) {
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        inArray(transactions.userId, viewer.userIds),
        eq(transactions.repeatType, 'annual'),
        eq(transactions.voided, false)
      )
    )
    .orderBy(desc(transactions.date));

  return rows.filter(isVisibleTo(viewer.userId));
}

async function loadHeads(
  userIds: string[],
  lastOccupied: Map<string, number>
): Promise<SeriesHead[]> {
  // One row per series: the latest occurrence that hasn't been deleted. Its amount,
  // description and day are what carry into future months, so editing this month's rent
  // updates the forecast while past months keep the amounts actually charged.
  //
  // Voided rows are excluded here on purpose. Delete every occurrence of a series and it
  // has no live row left, so nothing projects — which is how deleting a recurring
  // transaction outright, or an annual one, ends it.
  const rows = await db
    .selectDistinctOn([transactions.seriesId])
    .from(transactions)
    .where(and(
      inArray(transactions.userId, userIds),
      isNotNull(transactions.seriesId),
      eq(transactions.voided, false)
    ))
    .orderBy(transactions.seriesId, desc(transactions.monthKey));

  return rows
    .map(row => toSeriesHead(row, lastOccupied.get(row.seriesId as string)))
    .filter((head): head is SeriesHead => head !== null);
}

/**
 * Writes the rows a series owes for months that have already happened.
 *
 * This replaces the monthly cron. Running it on read means a missed schedule can't leave
 * a permanent hole, and it keeps every month up to today backed by a real row — which
 * matters because already-shipped mobile builds can reach the current month and need a
 * real id to edit or delete.
 *
 * Idempotent: the partial unique index on (series_id, month_key) turns a concurrent
 * double-write into a no-op.
 */
export async function materializeThrough(
  heads: SeriesHead[],
  occupied: Set<string>,
  through: MonthKey
): Promise<number> {
  const pending = heads.flatMap(head =>
    missingMonths(head, through, occupied).map(key => ({
      key,
      seriesKey: occupiedKey(head.seriesId, key),
      row: {
      id: crypto.randomUUID(),
      userId: head.userId,
      createdBy: head.createdBy,
      categoryId: head.categoryId,
      description: head.description,
      amount: head.amount.toString(),
      date: occurrenceDate(key, dayOfMonth(head.date)),
      isFixed: true,
      isPrivate: head.isPrivate,
      repeatType: head.repeatType ?? 'forever',
      endDate: head.endDate,
      seriesId: head.seriesId,
      endMonth: head.endMonth,
      voided: false,
      },
    }))
  );

  if (pending.length === 0) return 0;

  await db.insert(transactions).values(pending.map(p => p.row)).onConflictDoNothing();

  for (const item of pending) occupied.add(item.seriesKey);
  return pending.length;
}

type EntryOptions = {
  /** Skips the materialization write. Used by read-only tooling like the verifier. */
  readOnly?: boolean;
};

/**
 * Every entry visible to `viewer` between two months, stored and projected.
 *
 * Two queries regardless of how wide the range is, so a two-year trends chart costs the
 * same as a single month.
 */
export async function getEntries(
  viewer: Viewer,
  from: MonthKey,
  to: MonthKey,
  options: EntryOptions = {}
): Promise<Entry[]> {
  const current = currentMonthKey();

  // Series rows outside the requested window still matter: they tell us which months are
  // already spoken for, so materialization and projection don't duplicate them.
  const seriesRows = await db
    .select({
      seriesId: transactions.seriesId,
      monthKey: transactions.monthKey,
    })
    .from(transactions)
    .where(and(inArray(transactions.userId, viewer.userIds), isNotNull(transactions.seriesId)));

  const occupied = new Set<string>();
  const lastOccupied = new Map<string, number>();
  for (const row of seriesRows) {
    const seriesId = row.seriesId as string;
    occupied.add(occupiedKey(seriesId, row.monthKey));
    lastOccupied.set(seriesId, Math.max(lastOccupied.get(seriesId) ?? row.monthKey, row.monthKey));
  }

  const heads = await loadHeads(viewer.userIds, lastOccupied);

  if (!options.readOnly) {
    const catchUpTo = Math.min(to, current);
    if (catchUpTo > from - 1) {
      await materializeThrough(heads, occupied, catchUpTo);
    }
  }

  const stored = await db
    .select()
    .from(transactions)
    .where(
      and(
        inArray(transactions.userId, viewer.userIds),
        gte(transactions.monthKey, from),
        lte(transactions.monthKey, to),
        eq(transactions.voided, false)
      )
    );

  const visible = isVisibleTo(viewer.userId);

  const actual: Entry[] = stored
    // Annual rows render in their renewal month every year, so the projector emits them
    // instead — otherwise the origin year would get the row twice.
    .filter(row => !(row.repeatType === 'annual' && row.seriesId))
    .filter(visible)
    .map(row => ({
      id: row.id,
      source: 'actual' as const,
      seriesId: row.seriesId,
      monthKey: row.monthKey,
      userId: row.userId,
      createdBy: row.createdBy,
      categoryId: row.categoryId,
      description: row.description,
      amount: Number(row.amount),
      date: row.date,
      isFixed: row.isFixed,
      isPrivate: row.isPrivate ?? false,
      repeatType: row.repeatType,
      endDate: canonicalEndDate(
        row.endMonth,
        repeatTypeOf(row.repeatType),
        row.date,
        row.endDate
      ),
    }));

  const projected = projectSeries(heads, from, to, occupied).filter(visible);

  return [...actual, ...projected].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getRange(viewer: Viewer, from: MonthKey, to: MonthKey): Promise<MonthPoint[]> {
  const [entries, lookup] = await Promise.all([
    getEntries(viewer, from, to),
    getCategoryLookup(viewer.userIds),
  ]);

  const buckets: MonthPoint[] = [];
  const indexByKey = new Map<MonthKey, number>();
  for (let key = from; key <= to; key++) {
    const year = Math.floor(key / 12);
    buckets.push({ month: key % 12, year, income: 0, expenses: 0, balance: 0 });
    indexByKey.set(key, buckets.length - 1);
  }

  for (const entry of entries) {
    const index = indexByKey.get(entry.monthKey);
    if (index === undefined) continue;
    const type = lookup[entry.categoryId]?.type;
    if (type === 'income') buckets[index].income += entry.amount;
    else if (type === 'expense') buckets[index].expenses += entry.amount;
  }

  for (const bucket of buckets) bucket.balance = bucket.income - bucket.expenses;
  return buckets;
}

export async function getMonth(viewer: Viewer, year: number, month: number): Promise<MonthView> {
  const key = monthKey(year, month);
  const [entries, lookup] = await Promise.all([
    getEntries(viewer, key, key),
    getCategoryLookup(viewer.userIds),
  ]);

  let income = 0;
  let expenses = 0;
  const totals = new Map<string, CategorySummary>();

  for (const entry of entries) {
    if (isLegacyGenerated(entry.description)) continue;
    const category = lookup[entry.categoryId];
    if (!category) continue;

    if (category.type === 'income') income += entry.amount;
    else if (category.type === 'expense') expenses += entry.amount;

    const summary = totals.get(entry.categoryId) ?? {
      categoryId: entry.categoryId,
      category,
      total: 0,
      transactionCount: 0,
    };
    summary.total += entry.amount;
    summary.transactionCount += 1;
    totals.set(entry.categoryId, summary);
  }

  const categoryBreakdown = Array.from(totals.values())
    .filter(summary => summary.category.type === 'expense')
    .sort((a, b) => b.total - a.total);

  return {
    balance: { balance: income - expenses, income, expenses },
    categoryBreakdown,
    month,
    year,
  };
}
