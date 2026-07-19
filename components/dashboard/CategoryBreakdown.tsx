'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  transactionsHref: string;
}

export function CategoryBreakdown({
  categories,
  month,
  year,
  currentUserId,
  transactionsHref,
}: CategoryBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { data: transactionsData } = useTransactions(month, year);
  const t = useI18n();
  const formatCurrency = useFormatCurrency();
  const expenseCategories = categories.filter((item) => item.category.type === 'expense');

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  };

  const getCategoryTransactions = (categoryId: string) => (
    transactionsData?.transactions?.filter((transaction) => transaction.categoryId === categoryId) || []
  );

  return (
    <section className="mt-8 md:mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          {t('dashboard_where_money_went')}
        </h2>
        <Link
          href={transactionsHref}
          className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('dashboard_view_all')}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          {expenseCategories.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {expenseCategories.map((item) => {
                const categoryTransactions = getCategoryTransactions(item.categoryId);
                const isExpanded = expandedCategory === item.categoryId;

                return (
                  <div key={item.categoryId} className="group">
                    <button
                      type="button"
                      className="flex w-full touch-manipulation items-center justify-between rounded-lg border border-transparent bg-muted/30 p-3 text-left transition-all duration-200 hover:border-border hover:bg-muted/50 active:scale-[0.98] md:p-4"
                      onClick={() => setExpandedCategory(isExpanded ? null : item.categoryId)}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          {isExpanded ? (
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <div
                            className="flex size-6 shrink-0 items-center justify-center rounded-lg md:size-8"
                            style={{ backgroundColor: `${item.category.color}20` }}
                          >
                            <div
                              className="size-2 rounded-full md:size-3"
                              style={{ backgroundColor: item.category.color }}
                            />
                          </div>
                          <span className="truncate text-sm font-semibold md:text-base">
                            {getCategoryDisplayName(item.category, t)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <p className="text-sm font-bold text-destructive md:text-base">
                          -{formatCurrency(item.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard_transaction_count', { count: item.transactionCount })}
                        </p>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="ml-8 mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200 md:ml-12 md:mt-3">
                        {categoryTransactions.length > 0 ? (
                          categoryTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex touch-manipulation items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 transition-shadow hover:shadow-subtle md:px-4 md:py-3"
                            >
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
                                {transaction.isPrivate && transaction.createdBy && transaction.createdBy.id !== currentUserId ? (
                                  <span className="truncate text-sm font-medium italic text-muted-foreground">
                                    🔒 {t('transaction_private_placeholder')}
                                  </span>
                                ) : (
                                  <span className="truncate text-sm font-medium">{transaction.description}</span>
                                )}
                                <span className="text-xs text-muted-foreground">{formatDate(transaction.date)}</span>
                              </div>
                              <span className="ml-2 shrink-0 text-sm font-semibold text-destructive">
                                -{formatCurrency(Number(transaction.amount))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg bg-muted/20 py-4 text-center text-sm text-muted-foreground md:py-6">
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
            <div className="py-8 text-center text-muted-foreground md:py-12">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted/50 md:mb-4 md:size-16">
                <span className="text-xl md:text-2xl">📊</span>
              </div>
              <p className="text-sm font-medium md:text-base">{t('dashboard_no_expenses_month')}</p>
              <p className="mt-1 text-xs md:text-sm">{t('dashboard_expenses_will_appear')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
