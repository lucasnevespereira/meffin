'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useI18n } from '@/locales/client';

interface BalanceCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export function BalanceCards({ balance, income, expenses }: BalanceCardsProps) {
  const t = useI18n();
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard_balance')}</span>
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${
            balance >= 0 ? 'text-emerald-700' : 'text-red-600'
          }`}>
            {formatEuro(balance)}
          </div>
          <div className="mt-2">
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {balance >= 0 ? 'Positif' : 'Négatif'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard_income')}</span>
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-700">
            +{formatEuro(income)}
          </div>
          <div className="mt-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              {t('dashboard_income_month')}
            </div>
          </div>
        </div>
      </div>
      
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard_expenses')}</span>
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-red-700">
            -{formatEuro(expenses)}
          </div>
          <div className="mt-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
              {t('dashboard_expenses_month')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}