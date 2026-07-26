'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, CategoryFormData } from '@/types';

export class CategoryMutationError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly categoryId?: string
  ) {
    super(message);
    this.name = 'CategoryMutationError';
  }
}

async function readMutationError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return new CategoryMutationError(
    body?.error || fallback,
    body?.code,
    body?.categoryId
  );
}

async function fetchCategories(): Promise<{ categories: Category[] }> {
  const response = await fetch('/api/categories', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

async function createCategory(data: CategoryFormData): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await readMutationError(response, 'Failed to create category');
  }

  const body = await response.json();
  return body.category;
}

async function updateCategory(id: string, data: CategoryFormData): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await readMutationError(response, 'Failed to update category');
  }

  const body = await response.json();
  return body.category;
}

async function deleteCategory(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
    throw new Error(errorData.error || 'Failed to delete category');
  }

  return response.json();

}


export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
