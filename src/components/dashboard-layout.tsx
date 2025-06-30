"use client";

import { Sidebar } from "@/components/sidebar";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden p-5">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
