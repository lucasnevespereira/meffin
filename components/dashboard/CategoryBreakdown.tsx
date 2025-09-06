'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useI18n } from '@/locales/client';
import { getCategoryDisplayName } from '@/lib/category-utils';
import { useFormatCurrency } from '@/lib/currency-utils';
import { Category } from '@/types';

interface CategorySummary {
  categoryId: string;
  category: Category;
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
  const formatCurrency = useFormatCurrency();

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  };



  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getCategoryTransactions = (categoryId: string) => {
    return transactionsData?.transactions?.filter(t => t.categoryId === categoryId) || [];
  };

  const expenseCategories = categories.filter(cat => cat.category.type === 'expense');

  return (
    <div className="mt-8">
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
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: `${category.category.color}20` }}>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.category.color }}
                            />
                          </div>
                          <span className="font-semibold text-sm">{getCategoryDisplayName(category.category, t)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base text-destructive">
                          -{formatCurrency(category.total)}
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
                              <div className="text-sm font-semibold text-destructive">
                                -{formatCurrency(Number(transaction.amount))}
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
