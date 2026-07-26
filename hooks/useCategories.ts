'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
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

async function fetchCategories(includeArchived: boolean): Promise<{ categories: Category[] }> {
  const searchParams = includeArchived ? '?includeArchived=true' : '';
  const response = await fetch(`/api/categories${searchParams}`, {
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

type DeleteCategoryResult = {
  success: boolean;
  archived: boolean;
};

async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw await readMutationError(response, 'Failed to delete category');
  }

  return response.json();
}

async function restoreCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ archived: false }),
  });

  if (!response.ok) {
    throw await readMutationError(response, 'Failed to restore category');
  }

  const body = await response.json();
  return body.category;
}

function invalidateCategoryData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['categories'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['history'] });
}

export function useCategories({ includeArchived = false } = {}) {
  return useQuery({
    queryKey: ['categories', { includeArchived }],
    queryFn: () => fetchCategories(includeArchived),
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
      invalidateCategoryData(queryClient);
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreCategory,
    onSuccess: () => {
      invalidateCategoryData(queryClient);
    },
  });
}
