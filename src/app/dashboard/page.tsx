"use client";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>📅</span>
            <span>Juin 2025</span>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Solde
            </h3>
            <p className="text-2xl font-bold text-red-600">-40.00 €</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Entrées
            </h3>
            <p className="text-2xl font-bold text-green-600">+ 1800.00 €</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Sorties
            </h3>
            <p className="text-2xl font-bold text-red-600">- 1840.00 €</p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            {/* Maison */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Maison
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>Électricité et Gaz - 120 €</div>
                  <div>Tel Perso - 25 €</div>
                  <div>Macif Assurance - 30 €</div>
                  <div>Loyer - 955 €</div>
                  <div>Free Internet/Tv - 30 €</div>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                1160 €
              </div>
            </div>

            {/* Banque */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Banque
                </h3>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                614 €
              </div>
            </div>

            {/* Abonnements */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Abonnements
                </h3>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                50 €
              </div>
            </div>

            {/* Tech */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tech
                </h3>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                16 €
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
