'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ListWithItems, ListItemWithCategory } from '@/types';
import { useI18n } from '@/locales/client';

// Helper function to extract user-friendly error messages
function getErrorMessage(error: Error, t: ReturnType<typeof useI18n>): string {
  if (error.message) {
    try {
      const errorData = JSON.parse(error.message);

      if (Array.isArray(errorData)) {
        const messages = errorData
          .filter(err => err.message)
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
      return error.message;
    }
  }

  return 'An unexpected error occurred';
}

// Fetch all lists
async function fetchLists(): Promise<{ lists: ListWithItems[] }> {
  const response = await fetch('/api/lists', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch lists');
  }

  return response.json();
}

// Fetch single list with items
async function fetchList(id: string): Promise<{ list: ListWithItems }> {
  const response = await fetch(`/api/lists/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch list');
  }

  return response.json();
}

// Create new list
async function createList(data: {
  title: string;
  description?: string;
  color?: string;
  isShared?: boolean;
}): Promise<{ list: ListWithItems }> {
  const response = await fetch('/api/lists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create list' }));
    throw new Error(errorData.error || 'Failed to create list');
  }

  return response.json();
}

// Update list
async function updateList(id: string, data: {
  title?: string;
  description?: string;
  color?: string;
  isShared?: boolean;
}): Promise<{ list: ListWithItems }> {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update list' }));
    throw new Error(errorData.error || 'Failed to update list');
  }

  return response.json();
}

// Delete list
async function deleteList(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete list' }));
    throw new Error(errorData.error || 'Failed to delete list');
  }

  return response.json();
}

// Create list item
async function createListItem(listId: string, data: {
  name: string;
  estimatedPrice?: string;
  categoryId?: string;
  notes?: string;
}): Promise<{ item: ListItemWithCategory }> {
  const response = await fetch(`/api/lists/${listId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create item' }));
    throw new Error(errorData.error || 'Failed to create item');
  }

  return response.json();
}

// Update list item
async function updateListItem(listId: string, itemId: string, data: {
  name?: string;
  estimatedPrice?: string;
  categoryId?: string;
  notes?: string;
}): Promise<{ item: ListItemWithCategory }> {
  const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update item' }));
    throw new Error(errorData.error || 'Failed to update item');
  }

  return response.json();
}

// Delete list item
async function deleteListItem(listId: string, itemId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete item' }));
    throw new Error(errorData.error || 'Failed to delete item');
  }

  return response.json();
}

// Check/uncheck list item
async function toggleListItem(listId: string, itemId: string, data: {
  isChecked: boolean;
  actualPrice?: number;
}): Promise<{
  item: ListItemWithCategory;
  transactionCreated?: boolean;
  transactionDeleted?: boolean;
}> {
  const response = await fetch(`/api/lists/${listId}/items/${itemId}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to toggle item' }));
    throw new Error(errorData.error || 'Failed to toggle item');
  }

  return response.json();
}

// Query hooks
export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as UseQueryResult<{ lists: ListWithItems[] }>;
}

export function useList(id: string) {
  return useQuery({
    queryKey: ['lists', id],
    queryFn: () => fetchList(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  }) as UseQueryResult<{ list: ListWithItems }>;
}

// Mutation hooks
export function useCreateList() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('List created successfully!');
    },
    onError: (error: Error) => {
      console.error('Create list error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateList(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', variables.id] });
      toast.success('List updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update list error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('List deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Delete list error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useCreateListItem() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: any }) => createListItem(listId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', variables.listId] });
      toast.success('Item added successfully!');
    },
    onError: (error: Error) => {
      console.error('Create item error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useUpdateListItem() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ listId, itemId, data }: { listId: string; itemId: string; data: any }) =>
      updateListItem(listId, itemId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', variables.listId] });
      toast.success('Item updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Update item error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useDeleteListItem() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      deleteListItem(listId, itemId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', variables.listId] });
      toast.success('Item deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Delete item error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}

export function useToggleListItem() {
  const queryClient = useQueryClient();
  const t = useI18n();

  return useMutation({
    mutationFn: ({ listId, itemId, data }: { listId: string; itemId: string; data: any }) =>
      toggleListItem(listId, itemId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      if (result.transactionCreated) {
        toast.success(t('lists_item_checked_transaction_created') || 'Item checked and transaction created!');
      } else if (result.transactionDeleted) {
        toast.success(t('lists_item_unchecked_transaction_deleted') || 'Item unchecked and transaction removed!');
      } else {
        toast.success(t('lists_item_updated_successfully') || 'Item updated successfully!');
      }
    },
    onError: (error: Error) => {
      console.error('Toggle item error:', error);
      const friendlyMessage = getErrorMessage(error, t);
      toast.error(friendlyMessage);
    },
  });
}