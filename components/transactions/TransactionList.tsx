'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Clock01Icon, Delete02Icon, Edit01Icon, RepeatIcon, UserIcon } from "@hugeicons/core-free-icons";
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { TransactionWithCategory } from '@/types';
import { useI18n } from '@/locales/client';
import type { TransactionDeleteRequest } from '@/hooks/useTransactions';

import { getCategoryDisplayName } from '@/lib/category-utils';
import { useFormatCurrency } from '@/lib/currency-utils';
import { TransactionDeleteDialog } from './TransactionDeleteDialog';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  type: 'income' | 'expense';
  onEdit: (transaction: TransactionWithCategory) => void;
  onDelete: (request: TransactionDeleteRequest) => void;
  isDeleting?: boolean;
  hasPartner?: boolean;
  currentUserId?: string;
  /** Viewing a month that hasn't happened yet. */
  isPlanned?: boolean;
  /** Name of the month being viewed, for the empty state. */
  monthLabel?: string;
}

export function TransactionList({
  transactions,
  type,
  onEdit,
  onDelete,
  isDeleting = false,
  hasPartner = false,
  currentUserId,
  isPlanned = false,
  monthLabel,
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<TransactionWithCategory | null>(null);
  const t = useI18n();

  const formatCurrency = useFormatCurrency();

  // Function to get recurring info display
  const getRecurringInfo = (transaction: TransactionWithCategory) => {
    // Handle annual transactions - show subtle badge for all annual transactions
    if (transaction.repeatType === 'annual') {
      return { 
        type: 'annual', 
        text: t('transaction_recurring_annual') || 'Annual', 
        icon: Calendar01Icon,
        color: 'text-muted-foreground/70' 
      };
    }

    // Handle one-time transactions (including generated ones from cron)
    if (transaction.repeatType === 'once' && !transaction.isFixed) {
      return null;
    }
    
    const now = new Date();
    const endDate = transaction.endDate ? new Date(transaction.endDate) : null;
    
    // Calculate remaining months for limited recurring transactions
    if (endDate) {
      const diffMonths = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
      if (diffMonths <= 0) {
        return { type: 'ended', text: t('transaction_recurring_ended') || 'Ended', icon: Clock01Icon, color: 'text-muted-foreground' };
      } else if (diffMonths <= 12) {
        const remainingText = diffMonths === 1 
          ? t('transaction_recurring_last_month') || '1 month left'
          : `${diffMonths} ${t('months') || 'months'} ${t('transaction_recurring_left') || 'left'}`;
        return { type: 'limited', text: remainingText, icon: Clock01Icon, color: 'text-orange-600 dark:text-orange-400' };
      }
    }
    
    // Forever recurring
    return { type: 'forever', text: t('transaction_recurring_monthly') || 'Monthly', icon: RepeatIcon, color: 'text-blue-600 dark:text-blue-400' };
  };

  const filteredTransactions = transactions.filter(
    transaction => transaction.category.type === type
  );

  const handleDeleteClick = (transaction: TransactionWithCategory) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setTransactionToDelete(null);
    }
  };

  const sectionTitle = type === 'income' 
    ? (hasPartner ? t('transactions_our_income') : t('transactions_my_income'))
    : (hasPartner ? t('transactions_our_expenses') : t('transactions_my_expenses'));
  const emptyMessage = type === 'income' 
    ? (hasPartner ? t('transactions_no_shared_income') : t('transactions_no_income'))
    : (hasPartner ? t('transactions_no_shared_expenses') : t('transactions_no_expenses'));

  if (filteredTransactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold tracking-tight mb-3 md:mb-4">{sectionTitle}</h2>
          <div className="text-center py-6 md:py-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <span className="text-lg md:text-xl">{type === 'income' ? '💰' : '💳'}</span>
            </div>
            {isPlanned ? (
              <>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {t('month_nothing_planned', { month: monthLabel ?? '' })}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground/80">
                  {t('month_nothing_planned_hint', { month: monthLabel ?? '' })}
                </p>
              </>
            ) : (
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{emptyMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{sectionTitle}</h2>
            <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium border ${
              type === 'income'
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {filteredTransactions.length === 1
                ? t('transactions_count_single', { count: filteredTransactions.length })
                : t('transactions_count_plural', { count: filteredTransactions.length })}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`group flex items-center justify-between p-3 md:p-4 rounded-lg border transition-all duration-200 touch-manipulation ${
                  transaction.source === 'projected'
                    ? 'border-dashed border-border/70 bg-transparent'
                    : 'bg-muted/20 hover:bg-muted/40 border-transparent hover:border-border active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg shrink-0" style={{ backgroundColor: `${transaction.category.color}20` }}>
                    <div
                      className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {transaction.isPrivate && transaction.createdBy && transaction.createdBy.id !== currentUserId ? (
                      <>
                        <div className="font-semibold text-sm md:text-base truncate text-muted-foreground italic">
                          🔒 {t('transaction_private_placeholder') || 'Private transaction'}
                        </div>
                        <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="truncate italic">{t('transaction_private_category') || 'Private category'}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <HugeiconsIcon icon={Calendar01Icon} className="h-3 w-3" />
                              <span>{format(new Date(transaction.date), 'dd/MM', { locale: fr })}</span>
                            </div>
                          </div>
                          {transaction.createdBy && hasPartner && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <HugeiconsIcon icon={UserIcon} className="h-3 w-3" />
                              <span className="font-medium">{t('transaction_created_by')} {transaction.createdBy.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`font-semibold text-sm md:text-base truncate ${
                            transaction.source === 'projected' ? 'text-muted-foreground' : ''
                          }`}>
                            {transaction.description}
                          </div>
                          {transaction.source === 'projected' && (
                            <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('month_planned')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="truncate">{getCategoryDisplayName(transaction.category, t)}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <HugeiconsIcon icon={Calendar01Icon} className="h-3 w-3" />
                              <span>{format(new Date(transaction.date), 'dd/MM', { locale: fr })}</span>
                            </div>
                          </div>
                          {transaction.createdBy && hasPartner && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <HugeiconsIcon icon={UserIcon} className="h-3 w-3" />
                              <span className="font-medium">{t('transaction_created_by')} {transaction.createdBy.name}</span>
                            </div>
                          )}
                          {(() => {
                            const recurringInfo = getRecurringInfo(transaction);
                            if (!recurringInfo) return null;
                            
                            return (
                              <div className={`flex items-center gap-1 ${recurringInfo.color}`}>
                                <HugeiconsIcon icon={recurringInfo.icon} className="h-3 w-3" />
                                <span className="font-medium">{recurringInfo.text}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className={`font-bold text-sm md:text-base ${
                    type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  }`}>
                    {type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </div>

                  {/* Planned rows have no stored transaction behind them, so there is
                      nothing to edit here. The list explains where to do it instead. */}
                  {transaction.source !== 'projected' &&
                    (!currentUserId || !transaction.createdBy || transaction.createdBy.id === currentUserId) && (
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(transaction)}
                        className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10 hover:text-primary cursor-pointer"
                      >
                        <HugeiconsIcon icon={Edit01Icon} className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(transaction)}
                        disabled={isDeleting}
                        className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TransactionDeleteDialog
        transaction={transactionToDelete}
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
