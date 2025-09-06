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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <div className="p-4 sm:p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm touch-manipulation">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-sm text-muted-foreground">Solde</span>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-xl sm:text-2xl font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatEuro(balance)}
        </div>
      </div>
      
      <div className="p-4 sm:p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm touch-manipulation">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-sm text-muted-foreground">Entrées</span>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-emerald-600">
          +{formatEuro(income)}
        </div>
      </div>
      
      <div className="p-4 sm:p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm touch-manipulation">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-sm text-muted-foreground">Sorties</span>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-red-500">
          -{formatEuro(expenses)}
        </div>
      </div>
    </div>
  );
}