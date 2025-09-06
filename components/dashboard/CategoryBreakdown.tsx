'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useI18n } from '@/locales/client';

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string;
  type: 'income' | 'expense';
  total: number;
  transactionCount: number;
}

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  month: number;
  year: number;
}

export function CategoryBreakdown({ categories, month, year }: CategoryBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { data: transactionsData } = useTransactions(month, year);
  const t = useI18n();

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex];
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getCategoryTransactions = (categoryId: string) => {
    return transactionsData?.transactions?.filter(t => t.categoryId === categoryId) || [];
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard_category_breakdown')}</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
          <span className="text-sm font-medium text-muted-foreground">
            {getMonthName(month)} {year}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-6">
          {expenseCategories.length > 0 ? (
            <div className="space-y-4">
              {expenseCategories.map((category) => {
                const categoryTransactions = getCategoryTransactions(category.categoryId);
                const isExpanded = expandedCategory === category.categoryId;
                
                return (
                  <div key={category.categoryId} className="group">
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-border"
                      onClick={() => toggleCategory(category.categoryId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                          )}
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <span className="font-semibold text-sm">{category.categoryName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-red-700">
                          -{formatEuro(category.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 ml-12 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {categoryTransactions.length > 0 ? (
                          categoryTransactions.map((transaction) => (
                            <div 
                              key={transaction.id} 
                              className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border/50 hover:shadow-subtle transition-shadow"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{transaction.description}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-red-600">
                                -{formatEuro(Number(transaction.amount))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-lg">
                            {t('dashboard_no_transactions_category')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-medium">{t('dashboard_no_expenses_month')}</p>
              <p className="text-sm mt-1">{t('dashboard_expenses_will_appear')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}