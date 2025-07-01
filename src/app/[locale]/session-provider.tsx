"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { isPending } = authClient.useSession();

  useEffect(() => {
    // Give some time for the session to load
    if (!isPending) {
      setIsLoading(false);
    }
  }, [isPending]);

  // Show loading spinner while checking session
  if (isLoading || isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}
