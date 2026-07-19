'use client';

import Link from 'next/link';
import { ArrowUpRight, Circle, TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '@/locales/client';
import { MonthlyBalance } from '@/types';
import { useFormatCurrency } from '@/lib/currency-utils';

interface BalanceCardsProps {
  balance: MonthlyBalance;
  monthLabel: string;
  trendsHref: string;
}

export function BalanceCards({ balance, monthLabel, trendsHref }: BalanceCardsProps) {
  const t = useI18n();
  const formatCurrency = useFormatCurrency();
  const positive = balance.balance >= 0;
  const spentPercentage = balance.income > 0
    ? Math.min((balance.expenses / balance.income) * 100, 100)
    : balance.expenses > 0
      ? 100
      : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex h-full min-h-[20rem] flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {t('dashboard_available_balance', { month: monthLabel })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                {t('dashboard_balance_description')}
              </p>
            </div>
            <Link
              href={trendsHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('nav_trends')}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-8">
            <p className={`font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${positive ? 'text-foreground' : 'text-rose-400'}`}>
              {formatCurrency(balance.balance)}
            </p>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-400'}`}>
              <Circle className="size-2 fill-current" />
              {positive ? t('dashboard_on_track') : t('dashboard_over_budget')}
            </div>
          </div>

          <div className="mt-auto pt-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span>{t('dashboard_spent_amount', { amount: formatCurrency(balance.expenses) })}</span>
              <span>{t('dashboard_income_context', { amount: formatCurrency(balance.income) })}</span>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t('dashboard_spending_progress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(spentPercentage)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${positive ? 'bg-primary' : 'bg-rose-400'}`}
                style={{ width: `${spentPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <section className="flex min-h-40 flex-col justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-500">{t('dashboard_income')}</p>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-emerald-500 sm:text-3xl">
            +{formatCurrency(balance.income)}
          </p>
        </section>

        <section className="flex min-h-40 flex-col justify-between rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-rose-400">{t('dashboard_expenses')}</p>
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <TrendingDown className="size-5" />
            </div>
          </div>
          <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-rose-400 sm:text-3xl">
            -{formatCurrency(balance.expenses)}
          </p>
        </section>
      </div>
    </div>
  );
}
