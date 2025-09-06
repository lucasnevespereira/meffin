'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name: string;
  currency: string;
}

async function fetchProfile(): Promise<{ user: ProfileData }> {
  const response = await fetch('/api/profile', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

async function updateProfile(data: UpdateProfileData): Promise<{ user: ProfileData }> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Optionally update the cache directly for immediate UI update
      queryClient.setQueryData(['profile'], data);
      
      // Invalidate session data if it exists
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
    },
  });
}