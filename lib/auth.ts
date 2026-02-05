import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { users, account, session, verification } from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: account,
      session: session,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  } : {},
  account: {
    accountLinking: {
      updateUserInfoOnLink: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Better-Auth should automatically handle profile image from Google OAuth
          return { data: user };
        },
      },
      update: {
        before: async (user) => {
          // Allow updates to user profile including image
          return { data: user };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Refresh session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes only to allow session refresh
    },
  },
  advanced: {
    cookiePrefix: "meffin",
    cookies: {
      session_token: {
        attributes: {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
        },
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://meffin.app',
    'https://www.meffin.app',
  ],
});

export type Session = typeof auth.$Infer.Session;
