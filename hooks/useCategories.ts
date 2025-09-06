'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, CategoryFormData } from '@/types';

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
    throw new Error('Failed to create category');
  }

  return response.json();
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
    throw new Error('Failed to update category');
  }

  return response.json();
}

async function deleteCategory(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
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
    },
  });
}

