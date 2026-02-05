'use client';

import { createAuthClient } from "better-auth/react";

// Using empty config = relative URLs, works in all contexts (web, PWA, any domain)
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
