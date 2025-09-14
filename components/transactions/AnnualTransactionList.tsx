'use client';

import { useState } from 'react';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TransactionWithCategory } from '@/types';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { getCategoryDisplayName } from '@/lib/category-utils';
import { useFormatCurrency } from '@/lib/currency-utils';

interface AnnualTransactionListProps {
  transactions: TransactionWithCategory[];
  onEdit: (transaction: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  hasPartner?: boolean;
  currentUserId?: string;
}

export function AnnualTransactionList({
  transactions,
  onEdit,
  onDelete,
  isDeleting = false,
  hasPartner = false,
  currentUserId,
}: AnnualTransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const formatCurrency = useFormatCurrency();

  const getTranslatedMonthName = (date: Date): string => {
    const month = date.getMonth();
    const monthKeys = [
      'month_january', 'month_february', 'month_march', 'month_april',
      'month_may', 'month_june', 'month_july', 'month_august',
      'month_september', 'month_october', 'month_november', 'month_december'
    ] as const;

    const monthKey = monthKeys[month];
    const translatedMonth = t(monthKey);

    // If translation exists and is not the key itself, use it
    if (translatedMonth && translatedMonth !== monthKey) {
      return translatedMonth;
    }

    // Fallback to native date formatting
    return date.toLocaleDateString(currentLocale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold tracking-tight mb-3 md:mb-4">
            {hasPartner ? t('transactions_our_annual') : t('transactions_my_annual')}
          </h2>
          <div className="text-center py-6 md:py-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              {hasPartner ? t('transactions_no_shared_annual') : t('transactions_no_annual')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-lg md:text-xl font-bold tracking-tight min-w-0 flex-1">
              {hasPartner ? t('transactions_our_annual') : t('transactions_my_annual')}
            </h2>
            <div className="px-2 md:px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap shrink-0">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {transactions.map((transaction) => {
              const renewalMonth = getTranslatedMonthName(new Date(transaction.date));
              const isIncome = transaction.category.type === 'income';

              return (
                <div
                  key={transaction.id}
                  className="group flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border transition-all duration-200 touch-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg shrink-0" style={{ backgroundColor: `${transaction.category.color}20` }}>
                      <div
                        className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                        style={{ backgroundColor: transaction.category.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm md:text-base truncate">
                        {transaction.description}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="truncate">{getCategoryDisplayName(transaction.category, t)}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {t('transaction_renews_in') || 'Renews in'} {renewalMonth}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <div className={`font-bold text-sm md:text-base ${
                      isIncome ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </div>

                    {/* Only show edit/delete buttons for transactions created by current user */}
                    {(!currentUserId || !transaction.createdBy || transaction.createdBy.id === currentUserId) && (
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(transaction)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10 hover:text-primary cursor-pointer"
                        >
                          <Edit className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(transaction.id)}
                          disabled={isDeleting}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transaction_delete_title') || 'Delete Transaction'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transaction_delete_confirmation') || 'Are you sure you want to delete this transaction? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t('common_cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer disabled:cursor-not-allowed"
            >
              {isDeleting ? (t('transaction_deleting') || 'Deleting...') : (t('common_delete') || 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
