'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';

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
        <h2 className="text-lg font-medium">Répartition par catégorie</h2>
        <span className="text-sm text-muted-foreground">
          {getMonthName(month)} {year}
        </span>
      </div>
      <div className="space-y-2">
        <div className="space-y-3">
          {expenseCategories.length > 0 ? (
            expenseCategories.map((category) => {
              const categoryTransactions = getCategoryTransactions(category.categoryId);
              const isExpanded = expandedCategory === category.categoryId;
              
              return (
                <div key={category.categoryId}>
                  <div 
                    className="flex items-center justify-between py-4 px-4 rounded-lg border border-border/40 bg-card/20 cursor-pointer hover:bg-card/40 transition-colors"
                    onClick={() => toggleCategory(category.categoryId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-sm">{category.categoryName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatEuro(category.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-2 ml-8 space-y-1">
                      {categoryTransactions.length > 0 ? (
                        categoryTransactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between py-2 px-3 rounded bg-muted/30"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm">{transaction.description}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {formatEuro(Number(transaction.amount))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Aucune transaction pour cette catégorie
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune dépense pour ce mois
            </div>
          )}
        </div>
      </div>
    </div>
  );
}