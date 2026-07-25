import { MonthKey, fromKey, occurrenceDate, dayOfMonth, monthKeyFromDateString } from './keys';
import { canonicalEndDate, repeatTypeOf } from './schedule';

/**
 * Pure projection. No database, no session, no clock — everything it needs is an
 * argument, which is what makes the awkward parts (day 31 in February, inclusive end
 * bounds, annual renewals) cheap to test.
 */

export type Cadence = 'monthly' | 'annual';

/**
 * The most recent *live* occurrence of a series. It defines what the future looks like.
 *
 * `monthKey` is the template row's own month. `lastOccupied` is the newest month the
 * series has a row for at all, voided ones included — projection resumes after that, so
 * deleting an occurrence leaves a permanent gap instead of being refilled, and gaps left
 * behind by earlier deletions are never retroactively populated.
 */
export type SeriesHead = {
  seriesId: string;
  monthKey: MonthKey;
  lastOccupied: MonthKey;
  endMonth: MonthKey | null;
  cadence: Cadence;
  id: string;
  userId: string;
  createdBy: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  isPrivate: boolean;
  repeatType: string | null;
  endDate: string | null;
};

export type Entry = {
  id: string;
  source: 'actual' | 'projected';
  seriesId: string | null;
  monthKey: MonthKey;
  userId: string;
  createdBy: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  isFixed: boolean;
  isPrivate: boolean;
  repeatType: string | null;
  endDate: string | null;
};

export const occupiedKey = (seriesId: string, key: MonthKey) => `${seriesId}:${key}`;

/** Ids for months with no row behind them. Underscores, not colons: expo-router
 *  gives `:` special meaning inside path templates. */
export const projectedId = (seriesId: string, key: MonthKey) => `p_${seriesId}_${key}`;

export function isProjectedId(id: string): boolean {
  return id.startsWith('p_');
}

export function isActive(head: SeriesHead, key: MonthKey): boolean {
  if (key < head.monthKey) return false;
  if (head.endMonth !== null && key > head.endMonth) return false;
  if (head.cadence === 'annual') {
    return fromKey(key).month === fromKey(head.monthKey).month;
  }
  return true;
}

/**
 * Fills the months a series covers but has no row for.
 *
 * `occupied` holds every `(seriesId, monthKey)` that already exists as a real row —
 * including voided ones, so deleting an occurrence keeps it deleted instead of having it
 * quietly reappear on the next read.
 *
 * Annual series are the exception: they were never materialized, so a single row has
 * always stood in for every renewal. Their occurrences keep the real row's id and count
 * as actual, which is exactly how they behave today and keeps them editable in any year.
 */
export function projectSeries(
  heads: SeriesHead[],
  from: MonthKey,
  to: MonthKey,
  occupied: Set<string>
): Entry[] {
  const entries: Entry[] = [];

  for (const head of heads) {
    // An annual series is a single row standing in for every renewal, so it projects from
    // its own month. A monthly one resumes after the last month it already has a row for.
    const start = head.cadence === 'annual'
      ? Math.max(from, head.monthKey)
      : Math.max(from, head.lastOccupied + 1);
    const last = head.endMonth === null ? to : Math.min(to, head.endMonth);

    for (let key = start; key <= last; key++) {
      if (!isActive(head, key)) continue;

      const isAnnual = head.cadence === 'annual';
      // Annual series never materialize, so their one row is the occurrence for every
      // renewal — including its own month. Honouring `occupied` there would hide it.
      if (!isAnnual && occupied.has(occupiedKey(head.seriesId, key))) continue;

      entries.push({
        id: isAnnual ? head.id : projectedId(head.seriesId, key),
        source: isAnnual ? 'actual' : 'projected',
        seriesId: head.seriesId,
        monthKey: key,
        userId: head.userId,
        createdBy: head.createdBy,
        categoryId: head.categoryId,
        description: head.description,
        amount: head.amount,
        date: isAnnual ? head.date : occurrenceDate(key, dayOfMonth(head.date)),
        isFixed: true,
        isPrivate: head.isPrivate,
        repeatType: head.repeatType,
        endDate: head.endDate,
      });
    }
  }

  return entries;
}

/**
 * Months a monthly series still owes real rows for, up to and including `through`.
 * Annual series never materialize, so they produce nothing here.
 */
export function missingMonths(head: SeriesHead, through: MonthKey, occupied: Set<string>): MonthKey[] {
  if (head.cadence === 'annual') return [];

  const last = head.endMonth === null ? through : Math.min(through, head.endMonth);
  const months: MonthKey[] = [];
  for (let key = head.lastOccupied + 1; key <= last; key++) {
    if (!occupied.has(occupiedKey(head.seriesId, key))) months.push(key);
  }
  return months;
}

export function cadenceOf(repeatType: string | null): Cadence {
  return repeatType === 'annual' ? 'annual' : 'monthly';
}

/** Rows are only recurring if they carry a series. `isFixed` is not a reliable
 *  discriminator: it has no constraint and legacy rows disagree with it. */
export function toSeriesHead(row: {
  id: string;
  userId: string;
  createdBy: string;
  categoryId: string;
  description: string;
  amount: string | number;
  date: string;
  isPrivate: boolean | null;
  repeatType: string | null;
  endDate: string | null;
  monthKey: number;
  seriesId: string | null;
  endMonth: number | null;
}, lastOccupied?: number): SeriesHead | null {
  if (!row.seriesId) return null;
  const monthKey = row.monthKey ?? monthKeyFromDateString(row.date);
  const repeatType = repeatTypeOf(row.repeatType);
  return {
    seriesId: row.seriesId,
    monthKey,
    lastOccupied: lastOccupied ?? monthKey,
    endMonth: row.endMonth,
    cadence: cadenceOf(row.repeatType),
    id: row.id,
    userId: row.userId,
    createdBy: row.createdBy,
    categoryId: row.categoryId,
    description: row.description,
    amount: Number(row.amount),
    date: row.date,
    isPrivate: row.isPrivate ?? false,
    repeatType: row.repeatType,
    endDate: canonicalEndDate(
      row.endMonth,
      repeatType,
      row.date,
      row.endDate
    ),
  };
}
