"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useTranslations } from "next-intl";

export default function Transactions() {
  const t = useTranslations("Navigation");
  const common = useTranslations("Common");

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("transactions")}
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400">
            {common("comingSoon")}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
