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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Répartition par catégorie</span>
          <Badge variant="outline">
            {getMonthName(month)} {year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenseCategories.length > 0 ? (
            expenseCategories.map((category) => {
              const categoryTransactions = getCategoryTransactions(category.categoryId);
              const isExpanded = expandedCategory === category.categoryId;
              
              return (
                <div key={category.categoryId} className="border rounded-lg">
                  <div 
                    className="flex items-center justify-between py-3 px-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleCategory(category.categoryId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <span className="font-medium">{category.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatEuro(category.total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-border bg-accent/20">
                      {categoryTransactions.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {categoryTransactions.map((transaction) => (
                            <div 
                              key={transaction.id} 
                              className="flex items-center justify-between py-2 px-3 bg-background rounded border"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{transaction.description}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </span>
                              </div>
                              <div className="font-semibold text-sm">
                                {formatEuro(Number(transaction.amount))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}