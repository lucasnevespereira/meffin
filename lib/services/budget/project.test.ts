import { describe, it, expect } from 'vitest';
import { monthKey, clampDay, occurrenceDate, monthKeyFromDateString, dayOfMonth } from './keys';
import { projectSeries, missingMonths, occupiedKey, SeriesHead } from './project';
import {
  canonicalEndDate,
  fixedDurationEndDate,
  fixedDurationEndMonth,
  resolveEndMonth,
  resolveOccurrenceMonth,
} from './schedule';

const JUL_2026 = monthKey(2026, 6);

function head(overrides: Partial<SeriesHead> = {}): SeriesHead {
  const monthKey = overrides.monthKey ?? JUL_2026;
  return {
    seriesId: 'series-1',
    monthKey,
    // Defaults to the template's own month: a series whose newest row is also its head.
    lastOccupied: monthKey,
    endMonth: null,
    cadence: 'monthly',
    id: 'row-1',
    userId: 'user-1',
    createdBy: 'user-1',
    categoryId: 'default_housing',
    description: 'Rent',
    amount: 800,
    date: '2026-07-05T12:00:00.000Z',
    isPrivate: false,
    repeatType: 'forever',
    endDate: null,
    ...overrides,
  };
}

const occupy = (...keys: number[]) => new Set(keys.map(key => occupiedKey('series-1', key)));

describe('month keys', () => {
  it('reads the month from either timestamp format', () => {
    expect(monthKeyFromDateString('2026-07-15T12:00:00.000Z')).toBe(JUL_2026);
    expect(monthKeyFromDateString('2026-07-15 12:00:00')).toBe(JUL_2026);
  });

  it('rejects a date it cannot parse rather than guessing', () => {
    expect(() => monthKeyFromDateString('not-a-date')).toThrow();
  });

  it('keeps a day-31 transaction inside the month', () => {
    expect(clampDay(31, 2026, 1)).toBe(28); // February 2026
    expect(clampDay(31, 2028, 1)).toBe(29); // leap year
    expect(clampDay(31, 2026, 3)).toBe(30); // April
    expect(clampDay(15, 2026, 6)).toBe(15);
  });

  it('never rolls an occurrence into the following month', () => {
    // new Date(2026, 1, 31) silently becomes March 3rd — the bug that made the old cron
    // materialize into the wrong month and then duplicate.
    expect(occurrenceDate(monthKey(2026, 1), 31)).toBe('2026-02-28 12:00:00');
    expect(occurrenceDate(monthKey(2028, 1), 31)).toBe('2028-02-29 12:00:00');
  });

  it('round-trips the day of month', () => {
    expect(dayOfMonth(occurrenceDate(monthKey(2026, 8), 5))).toBe(5);
  });

  it('matches the shape Postgres returns, so entries sort consistently', () => {
    expect(occurrenceDate(monthKey(2026, 7), 5)).toBe('2026-08-05 12:00:00');
  });
});

describe('schedule contracts', () => {
  it('counts the starting month as the first fixed-duration occurrence', () => {
    expect(fixedDurationEndMonth(JUL_2026, '3months')).toBe(JUL_2026 + 2);
    expect(fixedDurationEndMonth(JUL_2026, '6months')).toBe(JUL_2026 + 5);
    expect(fixedDurationEndMonth(JUL_2026, '12months')).toBe(JUL_2026 + 11);
  });

  it('keeps a day-31 fixed duration inside its final month', () => {
    const end = fixedDurationEndDate(new Date(2026, 0, 31, 12), '4months');
    expect(end).not.toBeNull();
    expect(end?.getFullYear()).toBe(2026);
    expect(end?.getMonth()).toBe(3);
    expect(end?.getDate()).toBe(30);
  });

  it('lets an annual series move its renewal month', () => {
    const existing = {
      seriesId: 'annual-1',
      monthKey: monthKey(2026, 10),
      repeatType: 'annual',
      endMonth: null,
    };

    expect(
      resolveOccurrenceMonth(existing, monthKey(2026, 11), 'annual', JUL_2026)
    ).toBe(monthKey(2026, 11));
  });

  it('does not let a monthly occurrence collide with another month', () => {
    const existing = {
      seriesId: 'series-1',
      monthKey: JUL_2026,
      repeatType: 'forever',
      endMonth: null,
    };

    expect(
      resolveOccurrenceMonth(existing, JUL_2026 + 1, 'forever', JUL_2026)
    ).toBe(JUL_2026);
  });

  it('does not extend an unchanged bounded series during an edit', () => {
    const existing = {
      seriesId: 'series-1',
      monthKey: JUL_2026,
      repeatType: '6months',
      endMonth: JUL_2026 + 2,
    };

    expect(resolveEndMonth(existing, JUL_2026, '6months', null)).toBe(
      JUL_2026 + 2
    );
  });

  it('normalizes a fixed end date to the inclusive end month', () => {
    expect(
      canonicalEndDate(
        monthKey(2026, 8),
        '3months',
        '2026-07-30T12:00:00.000Z',
        '2026-10-30T12:00:00.000Z'
      )
    ).toBe('2026-09-30 12:00:00');
  });
});

describe('projectSeries — monthly', () => {
  it('fills every month after the head', () => {
    const entries = projectSeries([head()], JUL_2026, JUL_2026 + 3, occupy(JUL_2026));

    expect(entries.map(e => e.monthKey)).toEqual([JUL_2026 + 1, JUL_2026 + 2, JUL_2026 + 3]);
    expect(entries.every(e => e.source === 'projected')).toBe(true);
    expect(entries.every(e => e.amount === 800)).toBe(true);
  });

  it('never emits where a stored row already sits', () => {
    const withRows = head({ lastOccupied: JUL_2026 });
    const entries = projectSeries([withRows], JUL_2026, JUL_2026 + 2, occupy(JUL_2026, JUL_2026 + 1));

    expect(entries.map(e => e.monthKey)).toEqual([JUL_2026 + 2]);
  });

  it('treats a voided occurrence as occupied, so a deletion stays deleted', () => {
    // Voided rows are excluded from totals but still hold their slot.
    const entries = projectSeries([head()], JUL_2026, JUL_2026 + 2, occupy(JUL_2026, JUL_2026 + 2));

    expect(entries.map(e => e.monthKey)).toEqual([JUL_2026 + 1]);
  });

  it('emits nothing when the newest row is also the last one', () => {
    // Deleting the only occurrence leaves no live row, so the caller passes no head at
    // all and the series is over.
    expect(projectSeries([], JUL_2026, JUL_2026 + 6, occupy(JUL_2026))).toEqual([]);
  });

  it('stops at endMonth, inclusive', () => {
    const bounded = head({ endMonth: JUL_2026 + 2 });
    const entries = projectSeries([bounded], JUL_2026, JUL_2026 + 6, occupy(JUL_2026));

    expect(entries.map(e => e.monthKey)).toEqual([JUL_2026 + 1, JUL_2026 + 2]);
  });

  it('emits nothing once the series has ended', () => {
    const ended = head({ endMonth: JUL_2026 - 1 });
    expect(projectSeries([ended], JUL_2026, JUL_2026 + 6, new Set())).toEqual([]);
  });

  it('never emits before the series started', () => {
    const entries = projectSeries([head()], JUL_2026 - 6, JUL_2026, new Set());

    expect(entries).toEqual([]);
  });

  it('resumes after the last month with a row, not after the template', () => {
    // Gym ran Feb, Mar, then July — and July was deleted. The template is March's row
    // (the newest live one), but April through July must stay empty.
    const gappy = head({ monthKey: JUL_2026 - 4, lastOccupied: JUL_2026 });
    const entries = projectSeries([gappy], JUL_2026 - 5, JUL_2026 + 2, occupy(JUL_2026 - 5, JUL_2026 - 4, JUL_2026));

    expect(entries.map(e => e.monthKey)).toEqual([JUL_2026 + 1, JUL_2026 + 2]);
  });

  it('does not resume a stopped series after its final occurrence was voided', () => {
    // Regression: deleting July used to void only July. The live March row then became
    // the template again and recreated the salary in every forecast from August onward.
    const stopped = head({
      monthKey: JUL_2026 - 4,
      lastOccupied: JUL_2026,
      endMonth: JUL_2026 - 1,
      repeatType: 'until',
      endDate: '2026-06-05 12:00:00',
    });

    const entries = projectSeries(
      [stopped],
      JUL_2026 + 1,
      JUL_2026 + 6,
      occupy(JUL_2026 - 4, JUL_2026)
    );

    expect(entries).toEqual([]);
  });

  it('clamps the day when projecting into a short month', () => {
    const endOfMonth = head({ monthKey: monthKey(2026, 0), date: '2026-01-31T12:00:00.000Z' });
    const entries = projectSeries([endOfMonth], monthKey(2026, 1), monthKey(2026, 1), new Set());

    expect(entries[0].date).toBe('2026-02-28 12:00:00');
  });

  it('gives projected months a synthetic id that survives a URL', () => {
    const [entry] = projectSeries([head()], JUL_2026 + 1, JUL_2026 + 1, new Set());

    expect(entry.id).toBe(`p_series-1_${JUL_2026 + 1}`);
    expect(entry.id).not.toContain(':');
  });
});

describe('projectSeries — annual', () => {
  const annual = () =>
    head({
      cadence: 'annual',
      repeatType: 'annual',
      monthKey: monthKey(2026, 10), // November 2026
      date: '2026-11-03T12:00:00.000Z',
      description: 'Insurance',
    });

  it('lands only in its renewal month, every year', () => {
    const entries = projectSeries([annual()], monthKey(2026, 0), monthKey(2028, 11), new Set());

    expect(entries.map(e => e.monthKey)).toEqual([
      monthKey(2026, 10),
      monthKey(2027, 10),
      monthKey(2028, 10),
    ]);
  });

  it('does not appear in years before it started', () => {
    // The dashboard used to match on month while ignoring the year, so an annual bill
    // showed up in Novembers that predated it.
    const entries = projectSeries([annual()], monthKey(2024, 0), monthKey(2026, 9), new Set());

    expect(entries).toEqual([]);
  });

  it('keeps the real row id so it stays editable in any year', () => {
    const entries = projectSeries([annual()], monthKey(2027, 10), monthKey(2027, 10), new Set());

    expect(entries[0].id).toBe('row-1');
    expect(entries[0].source).toBe('actual');
  });

  it('ignores occupancy — one row stands in for every renewal', () => {
    const entries = projectSeries([annual()], monthKey(2026, 10), monthKey(2026, 10), occupy(monthKey(2026, 10)));

    expect(entries).toHaveLength(1);
  });
});

describe('missingMonths', () => {
  it('lists the months a series still owes rows for', () => {
    expect(missingMonths(head(), JUL_2026 + 3, occupy(JUL_2026))).toEqual([
      JUL_2026 + 1,
      JUL_2026 + 2,
      JUL_2026 + 3,
    ]);
  });

  it('skips months that already have a row', () => {
    expect(missingMonths(head(), JUL_2026 + 3, occupy(JUL_2026, JUL_2026 + 2))).toEqual([
      JUL_2026 + 1,
      JUL_2026 + 3,
    ]);
  });

  it('never backfills a gap left by a deleted occurrence', () => {
    const gappy = head({ monthKey: JUL_2026 - 4, lastOccupied: JUL_2026 });
    expect(missingMonths(gappy, JUL_2026 + 2, occupy(JUL_2026 - 4, JUL_2026))).toEqual([
      JUL_2026 + 1,
      JUL_2026 + 2,
    ]);
  });

  it('stops at endMonth', () => {
    const bounded = head({ endMonth: JUL_2026 + 1 });
    expect(missingMonths(bounded, JUL_2026 + 5, occupy(JUL_2026))).toEqual([JUL_2026 + 1]);
  });

  it('never materializes an annual series', () => {
    expect(missingMonths(head({ cadence: 'annual' }), JUL_2026 + 12, new Set())).toEqual([]);
  });

  it('returns nothing when the series is already current', () => {
    expect(missingMonths(head(), JUL_2026, occupy(JUL_2026))).toEqual([]);
  });
});

describe('projectSeries — nothing to do', () => {
  it('handles an empty series list', () => {
    expect(projectSeries([], JUL_2026, JUL_2026 + 6, new Set())).toEqual([]);
  });

  it('handles an inverted range', () => {
    expect(projectSeries([head()], JUL_2026 + 3, JUL_2026, new Set())).toEqual([]);
  });
});
