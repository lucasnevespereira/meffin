'use client';

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
import type {
  TransactionDeleteRequest,
  TransactionDeleteScope,
} from '@/hooks/useTransactions';
import { useI18n } from '@/locales/client';
import type { TransactionWithCategory } from '@/types';

type TransactionDeleteDialogProps = {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (request: TransactionDeleteRequest) => void;
  isDeleting?: boolean;
};

export function TransactionDeleteDialog({
  transaction,
  open,
  onOpenChange,
  onDelete,
  isDeleting = false,
}: TransactionDeleteDialogProps) {
  const t = useI18n();
  const isRecurring = Boolean(transaction?.seriesId);
  const canDeleteSingleOccurrence =
    isRecurring && transaction?.repeatType !== 'annual';

  const deleteTransaction = (scope?: TransactionDeleteScope) => {
    if (!transaction) return;

    onDelete({ id: transaction.id, scope });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRecurring
              ? t('transaction_delete_recurring_title')
              : t('transaction_delete_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRecurring
              ? t('transaction_delete_recurring_confirmation')
              : t('transaction_delete_confirmation')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            {t('common_cancel')}
          </AlertDialogCancel>

          {canDeleteSingleOccurrence && (
            <Button
              type="button"
              variant="outline"
              onClick={() => deleteTransaction('occurrence')}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {t('transaction_delete_occurrence')}
            </Button>
          )}

          <AlertDialogAction
            onClick={() => deleteTransaction(isRecurring ? 'future' : undefined)}
            disabled={isDeleting}
            className="cursor-pointer bg-destructive hover:bg-destructive/90 disabled:cursor-not-allowed"
          >
            {isDeleting
              ? t('transaction_deleting')
              : isRecurring
                ? t('transaction_delete_future')
                : t('common_delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
