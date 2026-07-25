/**
 * A month key is `year * 12 + month` with a zero-indexed month.
 *
 * All month arithmetic goes through these integers rather than Date objects. A Date
 * carries a timezone and a day, and both have bitten this codebase before: the web form
 * pins times to noon to stop ISO conversion shifting the day, while the mobile picker
 * sends local midnight, which lands in the previous month for anyone east of UTC.
 * Integers have neither problem.
 */
export type MonthKey = number;

export function monthKey(year: number, month: number): MonthKey {
  return year * 12 + month;
}

export function fromKey(key: MonthKey): { year: number; month: number } {
  return { year: Math.floor(key / 12), month: key % 12 };
}

/**
 * Reads the month out of a stored timestamp without parsing it. Postgres hands back
 * `2026-07-15 12:00:00` while `toISOString()` produces `2026-07-15T12:00:00.000Z`; the
 * leading `YYYY-MM` is identical either way, so the separator never matters.
 */
export function monthKeyFromDateString(date: string): MonthKey {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Unparseable transaction date: ${date}`);
  }
  return monthKey(year, month - 1);
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKey(now.getUTCFullYear(), now.getUTCMonth());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * A transaction on the 31st still has to land in February. Without this, `new Date(2026,
 * 1, 31)` rolls over to March 3rd — which is how the old cron managed to materialize a
 * day-31 transaction into the wrong month and then duplicate it.
 */
export function clampDay(day: number, year: number, month: number): number {
  return Math.min(Math.max(day, 1), daysInMonth(year, month));
}

/**
 * Noon, so nothing downstream can shift the date across a day boundary.
 *
 * Formatted the way Postgres hands timestamps back (`2026-08-05 12:00:00`) rather than as
 * an ISO string, so a projected occurrence and a stored one are byte-identical in shape.
 * Clients compare and slice these strings; two formats in one response would sort wrong.
 */
export function occurrenceDate(key: MonthKey, day: number): string {
  const { year, month } = fromKey(key);
  const safeDay = clampDay(day, year, month);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(safeDay)} 12:00:00`;
}

export function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10)) || 1;
}
