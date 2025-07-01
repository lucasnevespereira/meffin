"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "./session-provider";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}
