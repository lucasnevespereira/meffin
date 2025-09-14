'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionWithCategory, TransactionFormData } from '@/types';
import { useI18n } from '@/locales/client';

// Helper function to extract user-friendly error messages
function getErrorMessage(error: Error, t: ReturnType<typeof useI18n>): string {
  // Handle structured error responses from our API
  if (error.message) {
    try {
      const errorData = JSON.parse(error.message);
      
      if (Array.isArray(errorData)) {
        // Handle Zod validation errors array
        const messages = errorData
          .filter(err => err.message) // Only include errors with messages
          .map(err => {
            const fieldName = err.path?.[err.path.length - 1];
            return fieldName ? `${fieldName}: ${err.message}` : err.message;
          })
          .join(', ');
        return messages || t('validation_error') || 'Validation failed';
      }
      
      if (typeof errorData === 'object' && errorData.error) {
        return errorData.error;
      }
      
      if (typeof errorData === 'string') {
        return errorData;
      }
    } catch {
      // Not JSON, treat as regular error message
      return error.message;
    }
  }
  
  // Ultimate fallback
  return t('transaction_update_error') || 'An unexpected error occurred';
}

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

async function fetchAnnualTransactions(): Promise<{ transactions: TransactionWithCategory[] }> {
  const response = await fetch('/api/transactions?annual=true', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch annual transactions');
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
      endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create transaction' }));
    throw new Error(errorData.error || 'Failed to create transaction');
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
      endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update transaction' }));
    throw new Error(errorData.error || 'Failed to update transaction');
  }

  return response.json();
}

async function deleteTransaction(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete transaction' }));
    throw new Error(errorData.error || 'Failed to delete transaction');
  }

  return response.json();
}

export function useTransactions(month?: number, year?: number) {
  return useQuery({
    queryKey: ['transactions', month, year],
    queryFn: () => fetchTransactions(month, year),
    staleTime: 0, // Reduced stale time for debugging
    gcTime: 30 * 1000, // 30 seconds garbage collection time
  }) as UseQueryResult<{ transactions: TransactionWithCategory[] }>;
}

export function useAnnualTransactions() {
  return useQuery({
    queryKey: ['transactions', 'annual'],
    queryFn: fetchAnnualTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as UseQueryResult<{ transactions: TransactionWithCategory[] }>;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('transaction_created_success'));
    },
    onError: (error: Error) => {
      console.error('Create transaction error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionFormData }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('transaction_updated_success'));
    },
    onError: (error: Error) => {
      console.error('Update transaction error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('transaction_deleted_success'));
    },
    onError: (error: Error) => {
      console.error('Delete transaction error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}
