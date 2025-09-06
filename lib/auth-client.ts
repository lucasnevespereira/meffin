'use client';

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Add fetchOptions to handle cookies
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
