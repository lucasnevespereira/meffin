import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { I18nProviderClient } from "@/locales/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Meffin - Simple Monthly Budget Tracking",
  description: "Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meffin",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Meffin",
    title: "Meffin - Simple Monthly Budget Tracking",
    description: "Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting.",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Meffin Budget Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meffin - Simple Monthly Budget Tracking", 
    description: "Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting.",
    images: ["/icons/icon-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Meffin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meffin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0f172a" />

        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-128x128.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon-512x512.png" color="#0f172a" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://meffin.app" />
        <meta name="twitter:title" content="Meffin - Simple Monthly Budget Tracking" />
        <meta name="twitter:description" content="Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting." />
        <meta name="twitter:image" content="https://meffin.app/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@meffin" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Meffin - Simple Monthly Budget Tracking" />
        <meta property="og:description" content="Simple, lightweight monthly budget tracking. Built for simplicity and self-hosting." />
        <meta property="og:site_name" content="Meffin" />
        <meta property="og:url" content="https://meffin.app" />
        <meta property="og:image" content="https://meffin.app/icons/icon-512x512.png" />
      </head>
      <body className={`${inter.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProviderClient locale={locale}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </I18nProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
