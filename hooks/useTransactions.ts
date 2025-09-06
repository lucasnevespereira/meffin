'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionWithCategory, TransactionFormData } from '@/types';

async function fetchTransactions(month?: number, year?: number): Promise<{ transactions: TransactionWithCategory[] }> {
  const params = new URLSearchParams();
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());

  const response = await fetch(`/api/transactions?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

async function createTransaction(data: TransactionFormData): Promise<{transaction: TransactionWithCategory}> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create transaction');
  }

  return response.json();
}

async function updateTransaction(id: string, data: TransactionFormData): Promise<{transaction: TransactionWithCategory}> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update transaction');
  }

  return response.json();
}

async function deleteTransaction(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete transaction');
  }

  return response.json();
}

export function useTransactions(month?: number, year?: number) {
  return useQuery({
    queryKey: ['transactions', month, year],
    queryFn: () => fetchTransactions(month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionFormData }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
