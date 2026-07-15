import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
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

  // Allows native Expo clients to forward their app origin and keeps OAuth
  // callbacks compatible with the meffin:// deep-link scheme.
  plugins: [expo()],

  trustedOrigins: [
    "https://meffin.app",
    "https://www.meffin.app",
    "meffin://",
    "meffin://*",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
