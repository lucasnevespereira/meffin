'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useI18n } from '@/locales/client';
import { MonthlyBalance } from '@/types';
import { useFormatCurrency } from '@/lib/currency-utils';

interface BalanceCardsProps {
  balance: MonthlyBalance;
}

export function BalanceCards({ balance }: BalanceCardsProps) {
  const t = useI18n();
  const formatCurrency = useFormatCurrency();

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
      {/* Balance Card */}
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/20 dark:to-transparent" />
        <div className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700 transition-colors">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard_balance')}</span>
            </div>
          </div>
          <div className={`text-xl md:text-2xl font-bold tracking-tight ${
            balance.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(balance.balance)}
          </div>
          <div className="mt-2">
            <div className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium ${
              balance.balance >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
            }`}>
              {balance.balance >= 0 ? t('positive') : t('negative')}
            </div>
          </div>
        </div>
      </div>

      {/* Income Card */}
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/30 dark:to-transparent" />
        <div className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 dark:bg-emerald-950/50 dark:group-hover:bg-emerald-950/70 transition-colors">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard_income')}</span>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            +{formatCurrency(balance.income)}
          </div>
          <div className="mt-2">
            <div className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              {t('this_month')}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/30 dark:to-transparent" />
        <div className="relative p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-100 group-hover:bg-red-200 dark:bg-red-950/50 dark:group-hover:bg-red-950/70 transition-colors">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-700 dark:text-red-400" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground">{t('dashboard_expenses')}</span>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
            -{formatCurrency(balance.expenses)}
          </div>
          <div className="mt-2">
            <div className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {t('this_month')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
