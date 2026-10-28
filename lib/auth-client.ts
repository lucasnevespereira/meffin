'use client';

import { createAuthClient } from "better-auth/react";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

// Using empty config = relative URLs, works in all contexts (web, PWA, any domain)
export const authClient = createAuthClient({ plugins: [oauthProviderClient()] });

export const { signIn, signUp, signOut, useSession } = authClient;
