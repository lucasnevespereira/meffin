import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { I18nProviderClient } from "@/locales/client";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={`${inter.variable} antialiased font-sans`}>
        <I18nProviderClient locale={locale}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}