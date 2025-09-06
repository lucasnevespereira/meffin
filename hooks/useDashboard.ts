'use client';

import { useQuery } from '@tanstack/react-query';

interface MonthlyBalance {
  balance: number;
  income: number;
  expenses: number;
}

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string;
  type: 'income' | 'expense';
  total: number;
  transactionCount: number;
  isCustom?: boolean;
}

interface DashboardData {
  balance: MonthlyBalance;
  categoryBreakdown: CategorySummary[];
  month: number;
  year: number;
}

async function fetchDashboardData(month?: number, year?: number): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());
  
  const response = await fetch(`/api/dashboard?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}

export function useDashboard(month?: number, year?: number) {
  return useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: () => fetchDashboardData(month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}