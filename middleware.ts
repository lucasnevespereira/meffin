import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
const DEFAULT_LOCALE = "en";

// Session cookie names used by better-auth
const SESSION_COOKIE_NAME = "better-auth.session_token";
const SECURE_SESSION_COOKIE_NAME = "__Secure-better-auth.session_token";

function detectUserLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, quality = "1"] = lang.trim().split(";q=");
      return { locale: locale.toLowerCase(), quality: parseFloat(quality) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { locale } of languages) {
    // Exact match
    if (SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number])) {
      return locale;
    }
    // Language prefix match (fr-FR -> fr)
    const lang = locale.split("-")[0];
    if (SUPPORTED_LOCALES.includes(lang as typeof SUPPORTED_LOCALES[number])) {
      return lang;
    }
  }

  return DEFAULT_LOCALE;
}

function hasSessionCookie(request: NextRequest): boolean {
  const secureCookie = request.cookies.get(SECURE_SESSION_COOKIE_NAME);
  const normalCookie = request.cookies.get(SESSION_COOKIE_NAME);
  return Boolean(secureCookie?.value || normalCookie?.value);
}

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  return match ? match[1] : null;
}

const I18nMiddleware = createI18nMiddleware({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Extract locale from path
  const pathLocale = getLocaleFromPath(pathname);

  // Redirect unsupported locales to default
  if (pathLocale && !SUPPORTED_LOCALES.includes(pathLocale as typeof SUPPORTED_LOCALES[number])) {
    const restOfPath = pathname.slice(3) || "/"; // Remove /xx
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${restOfPath}`, request.url));
  }

  // Detect user locale for redirects
  const detectedLocale = detectUserLocale(request);
  const currentLocale = pathLocale || detectedLocale;

  // Redirect root to detected locale
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${detectedLocale}`, request.url));
  }

  // Process i18n
  const response = I18nMiddleware(request);

  // Protect /dashboard routes
  if (pathname.includes("/dashboard")) {
    if (!hasSessionCookie(request)) {
      return NextResponse.redirect(new URL(`/${currentLocale}/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|static|_next|manifest.json|favicon.ico|robots.txt|sw.js|apple-touch-icon.png|android-chrome-.*\\.png|images|logo|icons|sitemap.xml|ads.txt).*)",
  ],
};
