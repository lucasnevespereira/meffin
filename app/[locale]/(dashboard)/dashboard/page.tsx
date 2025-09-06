'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { useDashboard } from '@/hooks/useDashboard';
import { useI18n } from '@/locales/client';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const t = useI18n();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Erreur lors du chargement des données</p>
            <p className="text-sm text-muted-foreground mt-2">
              Veuillez vous connecter pour accéder au tableau de bord
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t('dashboard_title')}</h1>
          <p className="text-muted-foreground mt-2">{t('dashboard_subtitle')}</p>
        </div>
      </div>

      {/* Balance Cards */}
      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-card animate-pulse">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-muted/60 rounded-lg" />
                  <div className="h-4 bg-muted/60 rounded w-16" />
                </div>
                <div className="h-8 bg-muted/60 rounded w-24 mb-2" />
                <div className="h-6 bg-muted/60 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <BalanceCards
          balance={data.balance.balance}
          income={data.balance.income}
          expenses={data.balance.expenses}
        />
      ) : null}

      {/* Category Breakdown */}
      {isLoading ? (
        <div className="mt-8">
          <div className="h-5 bg-muted/60 rounded w-48 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border/40 bg-card/20 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted/60 rounded-full" />
                    <div className="h-4 w-20 bg-muted/60 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <CategoryBreakdown
          categories={data.categoryBreakdown}
          month={data.month}
          year={data.year}
        />
      ) : null}
    </div>
  );
}