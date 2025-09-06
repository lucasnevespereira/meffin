'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useI18n } from '@/locales/client';

import { getCategoryDisplayName } from '@/lib/category-utils';
import { useFormatCurrency } from '@/lib/currency-utils';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  type: 'income' | 'expense';
  onEdit: (transaction: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function TransactionList({
  transactions,
  type,
  onEdit,
  onDelete,
  isDeleting = false,
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const t = useI18n();

  const formatCurrency = useFormatCurrency();

  const filteredTransactions = transactions.filter(
    transaction => transaction.category.type === type
  );

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

  const sectionTitle = type === 'income' ? t('transactions_my_income') : t('transactions_my_expenses');
  const emptyMessage = type === 'income' ? t('transactions_no_income') : t('transactions_no_expenses');

  if (filteredTransactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold tracking-tight mb-3 md:mb-4">{sectionTitle}</h2>
          <div className="text-center py-6 md:py-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
              <span className="text-lg md:text-xl">{type === 'income' ? '💰' : '💳'}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{emptyMessage}</p>
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
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {filteredTransactions.map((transaction) => (
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
                    <div className="font-semibold text-sm md:text-base truncate">{transaction.description}</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="truncate">{getCategoryDisplayName(transaction.category, t)}</span>
                      <div className="flex items-center gap-2">
                        {transaction.isFixed && (
                          <Badge variant="outline" className="text-xs py-0.5 px-1.5 shrink-0">
                            {t('transaction_fixed_badge')}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(transaction.date), 'dd/MM', { locale: fr })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className={`font-bold text-sm md:text-base ${
                    type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  }`}>
                    {type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(transaction)}
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(transaction.id)}
                      disabled={isDeleting}
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
