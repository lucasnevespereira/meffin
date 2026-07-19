'use client';

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useI18n } from '@/locales/client';
import { MonthlyBalance } from '@/types';
import { useFormatCurrency } from '@/lib/currency-utils';

interface BalanceCardsProps {
  balance: MonthlyBalance;
}

export function BalanceCards({ balance }: BalanceCardsProps) {
  const t = useI18n();
  const formatCurrency = useFormatCurrency();
  const positive = balance.balance >= 0;

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
      {/* Balance */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard_balance')}</span>
        </div>
        <div className={`font-display text-2xl md:text-3xl font-semibold tracking-tight ${positive ? 'text-emerald-500' : 'text-rose-400'}`}>
          {formatCurrency(balance.balance)}
        </div>
        <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-400'}`}>
          {positive ? t('positive') : t('negative')}
        </div>
      </div>

      {/* Income */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard_income')}</span>
        </div>
        <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-emerald-500">
          +{formatCurrency(balance.income)}
        </div>
        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500">
          {t('this_month')}
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/15 text-rose-400">
            <TrendingDown className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t('dashboard_expenses')}</span>
        </div>
        <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-rose-400">
          -{formatCurrency(balance.expenses)}
        </div>
        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400">
          {t('this_month')}
        </div>
      </div>
    </div>
  );
}
