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
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight mb-4">{sectionTitle}</h2>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">{type === 'income' ? '💰' : '💳'}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">{sectionTitle}</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
              type === 'income'
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="group flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border transition-all duration-200 touch-manipulation"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${transaction.category.color}20` }}>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{transaction.description}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{getCategoryDisplayName(transaction.category, t)}</span>
                      {transaction.isFixed && (
                        <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                          {t('transaction_fixed_badge')}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(transaction.date), 'dd/MM', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`font-bold text-base ${
                    type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  }`}>
                    {type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(transaction)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(transaction.id)}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
