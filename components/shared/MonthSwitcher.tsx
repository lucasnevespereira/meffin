'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useCurrentLocale, useI18n } from '@/locales/client';

/** How far ahead the forecast is worth trusting. Recurring amounts drift, and a
 *  three-year projection reads as precision the data doesn't have. */
const MAX_MONTHS_AHEAD = 24;

type MonthSwitcherProps = {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
};

export function MonthSwitcher({ month, year, onChange }: MonthSwitcherProps) {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = currentLocale === 'fr' ? 'fr' : 'en';

  const now = new Date();
  const currentKey = now.getFullYear() * 12 + now.getMonth();
  const selectedKey = year * 12 + month;

  const isCurrent = selectedKey === currentKey;
  const isPlanned = selectedKey > currentKey;
  const atLimit = selectedKey >= currentKey + MAX_MONTHS_AHEAD;

  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    onChange(next.getMonth(), next.getFullYear());
  };

  const label = new Intl.DateTimeFormat(locale, {
    month: 'short',
    ...(year !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(new Date(year, month, 1));

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => shift(-1)}
        aria-label={t('month_previous')}
        className="h-7 w-7 rounded-full p-0 cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
      </Button>

      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onChange(now.getMonth(), now.getFullYear())}
        aria-label={t('month_back_to_current')}
        className={`min-w-[4.5rem] text-center text-sm font-semibold capitalize transition-colors ${
          isCurrent ? 'text-foreground' : 'cursor-pointer text-primary hover:text-primary/80'
        }`}
      >
        {label}
      </button>

      <Button
        size="sm"
        variant="ghost"
        disabled={atLimit}
        onClick={() => shift(1)}
        aria-label={t('month_next')}
        className="h-7 w-7 rounded-full p-0 cursor-pointer disabled:opacity-30"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
      </Button>

      {isPlanned && (
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {t('month_planned')}
        </span>
      )}
    </div>
  );
}
