import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // Get session cookie - this is recommended by better-auth for middleware
  const sessionCookie = getSessionCookie(request);
  const hasSession = !!sessionCookie;

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/transactions", "/categories"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // Define auth routes (login, signup, etc.)
  const authRoutes = ["/login", "/signup"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing auth pages with a session, redirect to dashboard
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/login",
    "/signup",
  ],
};
