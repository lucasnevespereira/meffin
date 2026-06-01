'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';

export type HistoryPoint = {
  month: number; // 0-11
  year: number;
  income: number;
  expenses: number;
  balance: number;
};

async function fetchHistory(months: number): Promise<{ history: HistoryPoint[] }> {
  const response = await fetch(`/api/history?months=${months}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

export function useHistory(months: number) {
  return useQuery({
    queryKey: ['history', months],
    queryFn: () => fetchHistory(months),
    staleTime: 5 * 60 * 1000,
  }) as UseQueryResult<{ history: HistoryPoint[] }>;
}
