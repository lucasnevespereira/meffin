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
  currentUserId?: string;
}

export function CategoryBreakdown({ categories, month, year, currentUserId }: CategoryBreakdownProps) {
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
    <div className="mt-6 md:mt-8">
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          {expenseCategories.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {expenseCategories.map((category) => {
                const categoryTransactions = getCategoryTransactions(category.categoryId);
                const isExpanded = expandedCategory === category.categoryId;

                return (
                  <div key={category.categoryId} className="group">
                    <div
                      className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-border active:scale-[0.98] touch-manipulation"
                      onClick={() => toggleCategory(category.categoryId)}
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2 md:gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform shrink-0" />
                          )}
                          <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg shrink-0" style={{ backgroundColor: `${category.category.color}20` }}>
                            <div
                              className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                              style={{ backgroundColor: category.category.color }}
                            />
                          </div>
                          <span className="font-semibold text-sm md:text-base truncate">{getCategoryDisplayName(category.category, t)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-bold text-sm md:text-base text-destructive">
                          -{formatCurrency(category.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 md:mt-3 ml-8 md:ml-12 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {categoryTransactions.length > 0 ? (
                          categoryTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between py-2 md:py-3 px-3 md:px-4 rounded-lg bg-card border border-border/50 hover:shadow-subtle transition-shadow touch-manipulation"
                            >
                              <div className="flex flex-col gap-0.5 md:gap-1 min-w-0 flex-1">
                                {transaction.isPrivate && transaction.createdBy && transaction.createdBy.id !== currentUserId ? (
                                  <span className="text-sm font-medium truncate text-muted-foreground italic">
                                    🔒 {t('transaction_private_placeholder') || 'Private transaction'}
                                  </span>
                                ) : (
                                  <span className="text-sm font-medium truncate">{transaction.description}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-destructive shrink-0 ml-2">
                                -{formatCurrency(Number(transaction.amount))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 md:py-6 text-sm text-muted-foreground bg-muted/20 rounded-lg">
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
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">📊</span>
              </div>
              <p className="font-medium text-sm md:text-base">{t('dashboard_no_expenses_month')}</p>
              <p className="text-xs md:text-sm mt-1">{t('dashboard_expenses_will_appear')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
