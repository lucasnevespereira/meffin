'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * The selected month, held in the URL as `?m=2026-10`.
 *
 * It lives in the URL so the choice survives moving between Dashboard and Transactions,
 * a refresh, and the back button. Keeping it in component state meant looking at October
 * on one page and landing back on today when you opened the other.
 */
export function useMonthCursor() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = new Date();
  const raw = searchParams.get('m');

  const { month, year } = useMemo(() => {
    const match = /^(\d{4})-(\d{2})$/.exec(raw ?? '');
    if (match) {
      const parsedYear = Number(match[1]);
      const parsedMonth = Number(match[2]) - 1;
      if (parsedMonth >= 0 && parsedMonth <= 11 && parsedYear >= 1970 && parsedYear <= 9999) {
        return { month: parsedMonth, year: parsedYear };
      }
    }
    return { month: now.getMonth(), year: now.getFullYear() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const setCursor = useCallback(
    (nextMonth: number, nextYear: number) => {
      const params = new URLSearchParams(searchParams.toString());
      const isCurrent =
        nextMonth === new Date().getMonth() && nextYear === new Date().getFullYear();

      // Today is the default, so it doesn't need to clutter the URL.
      if (isCurrent) params.delete('m');
      else params.set('m', `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const currentKey = now.getFullYear() * 12 + now.getMonth();
  const selectedKey = year * 12 + month;

  return {
    month,
    year,
    setCursor,
    isPlanned: selectedKey > currentKey,
    isCurrent: selectedKey === currentKey,
  };
}
