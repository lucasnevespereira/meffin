import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the next-intl middleware function
const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Step 1: Handle i18n routing first
  const response = handleI18nRouting(request);

  // Get session cookie - this is recommended by better-auth for middleware
  const sessionCookie = getSessionCookie(request);
  const hasSession = !!sessionCookie;

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/transactions", "/categories"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.replace(/^\/[^\/]+/, "").startsWith(route),
  );

  // Define auth routes (login, signup, etc.)
  const authRoutes = ["/login", "/signup"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.replace(/^\/[^\/]+/, "").startsWith(route),
  );

  // Extract locale from URL (if present)
  const locale =
    request.nextUrl.pathname.match(/^\/([^\/]+)/)?.[1] || routing.defaultLocale;

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // If accessing auth pages with a session, redirect to dashboard
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Return the response from the i18n middleware
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
