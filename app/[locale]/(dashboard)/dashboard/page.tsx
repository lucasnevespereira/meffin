'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data, isLoading, error } = useDashboard(selectedMonth, selectedYear);

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Erreur lors du chargement des données</p>
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
          <h1 className="text-2xl font-medium font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de vos finances</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-1 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-lg border border-border/40 bg-card/30 animate-pulse">
              <div className="h-4 bg-muted rounded mb-4" />
              <div className="h-6 bg-muted rounded" />
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
          <div className="h-5 bg-muted rounded w-48 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border/40 bg-card/20 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <CategoryBreakdown
          categories={data.categoryBreakdown}
          month={selectedMonth}
          year={selectedYear}
        />
      ) : null}
    </div>
  );
}