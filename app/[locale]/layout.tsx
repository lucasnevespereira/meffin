import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { I18nProviderClient } from "@/locales/client";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Meffin - Budget Tracking App",
  description: "Modern budget tracking application built with Next.js",
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
    <html lang={locale}>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <I18nProviderClient locale={locale}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}