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

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Refresh session daily when active
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache to reduce DB lookups
    },
  },

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  trustedOrigins: [
    "https://meffin.app",
    "https://www.meffin.app",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
