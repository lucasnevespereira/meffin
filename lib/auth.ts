import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { eq } from "drizzle-orm";
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

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    } : {}),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
        appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER || "app.meffin.mobile",
        // Apple only includes email on the first authorization. Existing
        // accounts are matched by the stable Apple subject on later sign-ins.
        mapProfileToUser: (profile: { email?: string | null; sub: string }) => ({
          email: profile.email ?? `${profile.sub}@apple.invalid`,
        }),
      },
    } : {}),
  },

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

  user: {
    deleteUser: {
      enabled: true,
      // partnerId is a plain text column with no FK, so unlink the partner
      // before the cascade wipes this user's rows.
      beforeDelete: async (user) => {
        await db.update(users).set({ partnerId: null }).where(eq(users.partnerId, user.id));
      },
    },
  },

  // Allows native Expo clients to forward their app origin and keeps OAuth
  // callbacks compatible with the meffin:// deep-link scheme.
  plugins: [expo()],

  trustedOrigins: [
    "https://meffin.app",
    "https://www.meffin.app",
    "https://appleid.apple.com",
    "meffin://",
    "meffin://*",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    // Expo dev clients report their Metro origin (exp://<lan-ip>:8081). Trusted
    // everywhere so the app can be tested against production from `expo start`.
    // exp:// isn't a browser-reachable origin, so this doesn't open a CSRF hole.
    "exp://",
    "exp://**",
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
