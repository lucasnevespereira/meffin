"use client";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function Categories() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
        </div>
      </div>
    </DashboardLayout>
  );
}
