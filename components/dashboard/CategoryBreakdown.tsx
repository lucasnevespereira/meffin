'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';
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
  const totalExpenses = expenseCategories.reduce((total, item) => total + item.total, 0);

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
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t('dashboard_where_money_went')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {t('dashboard_spending_breakdown_subtitle')}
          </p>
        </div>
        <Link
          href={transactionsHref}
          className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('dashboard_view_all')}
        </Link>
      </div>

      {expenseCategories.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {expenseCategories.map((item) => {
            const categoryTransactions = getCategoryTransactions(item.categoryId);
            const isExpanded = expandedCategory === item.categoryId;
            const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;

            return (
              <article
                key={item.categoryId}
                className={`rounded-2xl border bg-card shadow-card transition-colors ${isExpanded ? 'border-primary/35' : 'border-border'}`}
              >
                <button
                  type="button"
                  className="w-full rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5"
                  onClick={() => setExpandedCategory(isExpanded ? null : item.categoryId)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {isExpanded ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl sm:size-12"
                      style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
                    >
                      <Tag className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-semibold">
                          {getCategoryDisplayName(item.category, t)}
                        </p>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-base font-semibold text-rose-400 sm:text-lg">
                            -{formatCurrency(item.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('dashboard_transaction_count', { count: item.transactionCount })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: item.category.color }}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mx-4 border-t border-border pb-4 pt-3 sm:mx-5 sm:pb-5">
                    {categoryTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {categoryTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              {transaction.isPrivate && transaction.createdBy && transaction.createdBy.id !== currentUserId ? (
                                <p className="truncate text-sm italic text-muted-foreground">
                                  🔒 {t('transaction_private_placeholder')}
                                </p>
                              ) : (
                                <p className="truncate text-sm font-medium">{transaction.description}</p>
                              )}
                              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-rose-400">
                              -{formatCurrency(Number(transaction.amount))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        {t('dashboard_no_transactions_category')}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tag className="size-5" />
          </div>
          <p className="mt-4 font-semibold">{t('dashboard_no_expenses_month')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('dashboard_expenses_will_appear')}</p>
        </div>
      )}
    </section>
  );
}
