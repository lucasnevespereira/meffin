import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { I18nProviderClient } from "@/locales/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProviderClient locale={locale}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}