'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { useDashboard } from '@/hooks/useDashboard';
import { useCurrentLocale, useI18n } from '@/locales/client';
import { useSession } from '@/lib/auth-client';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { data: session } = useSession();
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = currentLocale === 'fr' ? 'fr' : 'en';
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || t('dashboard_default_name');
  const dashboardDate = data ? new Date(data.year, data.month, 1) : new Date();
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long' }).format(dashboardDate);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{t('dashboard_loading_error')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('dashboard_login_required')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {t('dashboard_greeting', { name: firstName })} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {t('dashboard_month_overview', { month: monthLabel })}
          </p>
        </div>
      </div>

      {/* Balance Cards */}
      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
          <div className="min-h-[20rem] animate-pulse rounded-2xl border border-border bg-card p-6">
            <div className="h-4 w-40 rounded bg-muted/60" />
            <div className="mt-10 h-12 w-56 rounded bg-muted/60" />
            <div className="mt-4 h-7 w-32 rounded-full bg-muted/60" />
            <div className="mt-20 h-3 rounded-full bg-muted/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {[1, 2].map((i) => (
              <div key={i} className="min-h-40 animate-pulse rounded-2xl border border-border bg-card p-6">
                <div className="h-4 w-20 rounded bg-muted/60" />
                <div className="mt-12 h-8 w-36 rounded bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <BalanceCards
          balance={data.balance}
          monthLabel={monthLabel}
          trendsHref={`/${locale}/trends`}
        />
      ) : null}

      {/* Category Breakdown */}
      {isLoading ? (
        <div className="mt-10">
          <div className="mb-4 h-7 w-64 rounded bg-muted/60" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-muted/60" />
                  <div className="flex-1">
                    <div className="h-4 w-28 rounded bg-muted/60" />
                    <div className="mt-4 h-2 rounded-full bg-muted/60" />
                  </div>
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
          currentUserId={session?.user?.id}
          transactionsHref={`/${locale}/transactions`}
        />
      ) : null}
    </div>
  );
}
