import {
  MonthKey,
  clampDay,
  currentMonthKey,
  dayOfMonth,
  fromKey,
  monthKey,
  monthKeyFromDateString,
  occurrenceDate,
} from './keys';

export type RepeatType =
  | 'once'
  | 'forever'
  | '3months'
  | '4months'
  | '6months'
  | '12months'
  | 'until'
  | 'annual';

/** Converts legacy database values into the supported recurrence model. */
export function repeatTypeOf(value: string | null | undefined): RepeatType {
  switch (value) {
    case 'once':
    case 'forever':
    case '3months':
    case '4months':
    case '6months':
    case '12months':
    case 'until':
    case 'annual':
      return value;
    default:
      return 'forever';
  }
}

const FIXED_DURATION_MONTHS: Partial<Record<RepeatType, number>> = {
  '3months': 3,
  '4months': 4,
  '6months': 6,
  '12months': 12,
};

export function fixedDurationMonths(repeatType: RepeatType): number | null {
  return FIXED_DURATION_MONTHS[repeatType] ?? null;
}

/**
 * Fixed durations count occurrences, including the starting month.
 *
 * A three-month series beginning in July therefore ends in September:
 * July (1), August (2), September (3).
 */
export function fixedDurationEndMonth(
  startMonth: MonthKey,
  repeatType: RepeatType
): MonthKey | null {
  const duration = fixedDurationMonths(repeatType);
  return duration === null ? null : startMonth + duration - 1;
}

/** Form helper that keeps day 31 inside the final month. */
export function fixedDurationEndDate(start: Date, repeatType: RepeatType): Date | null {
  const endMonth = fixedDurationEndMonth(
    monthKey(start.getFullYear(), start.getMonth()),
    repeatType
  );
  if (endMonth === null) return null;

  const { year, month } = fromKey(endMonth);
  return new Date(
    year,
    month,
    clampDay(start.getDate(), year, month),
    12,
    0,
    0,
    0
  );
}

type ExistingSchedule = {
  seriesId: string | null;
  monthKey: MonthKey;
  repeatType: string | null;
  endMonth: MonthKey | null;
};

/**
 * Resolves the occurrence month accepted by the update API.
 *
 * Monthly occurrences cannot move between months because another occurrence may already
 * occupy the target month. Annual rows are different: one row represents the entire
 * series, so moving its renewal month is both safe and expected.
 */
export function resolveOccurrenceMonth(
  existing: ExistingSchedule | null,
  submittedMonth: MonthKey,
  nextRepeatType: RepeatType,
  currentMonth: MonthKey = currentMonthKey()
): MonthKey {
  if (existing?.seriesId) {
    const remainsAnnual =
      existing.repeatType === 'annual' && nextRepeatType === 'annual';
    return remainsAnnual ? submittedMonth : existing.monthKey;
  }

  return nextRepeatType === 'once' || nextRepeatType === 'annual'
    ? submittedMonth
    : Math.max(submittedMonth, currentMonth);
}

/**
 * Resolves the inclusive final month for a create or edit.
 *
 * Editing an unchanged fixed-duration series keeps its existing bound. Otherwise a simple
 * amount edit in the current month would restart "for 6 months" and extend it repeatedly.
 */
export function resolveEndMonth(
  existing: ExistingSchedule | null,
  occurrenceMonth: MonthKey,
  nextRepeatType: RepeatType,
  submittedEndDate: string | null
): MonthKey | null {
  if (nextRepeatType === 'once') {
    return existing?.seriesId ? existing.monthKey : null;
  }

  if (nextRepeatType === 'forever' || nextRepeatType === 'annual') {
    return null;
  }

  const fixedEnd = fixedDurationEndMonth(occurrenceMonth, nextRepeatType);
  if (fixedEnd !== null) {
    if (
      existing?.seriesId &&
      existing.repeatType === nextRepeatType &&
      existing.endMonth !== null
    ) {
      return existing.endMonth;
    }
    return fixedEnd;
  }

  return submittedEndDate ? monthKeyFromDateString(submittedEndDate) : null;
}

/** Normalizes the stored end date to the authoritative end month. */
export function canonicalEndDate(
  endMonth: MonthKey | null,
  repeatType: RepeatType,
  occurrence: string,
  submittedEndDate: string | null
): string | null {
  if (endMonth === null || repeatType === 'once') return null;

  const preferredDay =
    repeatType === 'until' && submittedEndDate
      ? dayOfMonth(submittedEndDate)
      : dayOfMonth(occurrence);

  return occurrenceDate(endMonth, preferredDay);
}
