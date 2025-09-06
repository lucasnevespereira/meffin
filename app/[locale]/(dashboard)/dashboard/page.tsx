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
    <div className="space-y-8">
      {/* Page Title and Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos finances</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card rounded-xl p-1 border border-border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="hover:bg-accent rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-lg border-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="hover:bg-accent rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
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
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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