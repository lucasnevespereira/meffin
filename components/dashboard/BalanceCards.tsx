'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export function BalanceCards({ balance, income, expenses }: BalanceCardsProps) {
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
          <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Solde</CardTitle>
          <div className="p-2 bg-blue-100 rounded-xl">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatEuro(balance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Solde actuel du mois</p>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
          <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Entrées</CardTitle>
          <div className="p-2 bg-emerald-100 rounded-xl">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-emerald-600">
            + {formatEuro(income)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Revenus du mois</p>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-50 to-white">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
          <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Sorties</CardTitle>
          <div className="p-2 bg-red-100 rounded-xl">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-red-500">
            - {formatEuro(expenses)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Dépenses du mois</p>
        </CardContent>
      </Card>
    </div>
  );
}