'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction
} from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { TransactionFormData, TransactionWithCategory } from '@/types';
import { useI18n } from '@/locales/client';

export default function TransactionsPage() {
  const t = useI18n();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);

  const { data: transactionsData, isLoading: isLoadingTransactions, error } = useTransactions(selectedMonth, selectedYear);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const getMonthName = (monthIndex: number) => {
    const months = [
      t('month_january'), t('month_february'), t('month_march'), t('month_april'),
      t('month_may'), t('month_june'), t('month_july'), t('month_august'),
      t('month_september'), t('month_october'), t('month_november'), t('month_december')
    ];
    return months[monthIndex];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const handleCreateTransaction = (data: TransactionFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateTransaction = (data: TransactionFormData) => {
    if (editingTransaction) {
      updateMutation.mutate(
        { id: editingTransaction.id, data },
        {
          onSuccess: () => {
            setEditingTransaction(null);
          },
        }
      );
    }
  };

  const handleEditTransaction = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteMutation.mutate(id);
  };

  const closeEditForm = () => {
    setEditingTransaction(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{t('transactions_loading_error')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('transactions_login_required')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transactions = transactionsData?.transactions || [];
  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('transactions_title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('transactions_subtitle')}</p>
        </div>

        {/* Mobile-optimized month navigation */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-10 w-10 p-0 touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg min-w-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm sm:text-base whitespace-nowrap">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-10 w-10 p-0 touch-manipulation"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="h-11 px-6 text-sm font-medium touch-manipulation w-full sm:w-auto"
          disabled={isLoadingCategories || categories.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('transactions_add_button')}
        </Button>
      </div>

      {/* Transaction Lists */}
      {isLoadingTransactions ? (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 rounded-lg border border-border/40 bg-card/20 mb-2">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <TransactionList
            transactions={transactions}
            type="income"
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isDeleting={deleteMutation.isPending}
          />

          <TransactionList
            transactions={transactions}
            type="expense"
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isDeleting={deleteMutation.isPending}
          />
        </div>
      )}

      {/* Transaction Form Modals */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTransaction}
        categories={categories}
        mode="create"
        isSubmitting={createMutation.isPending}
      />

      {editingTransaction && (
        <TransactionForm
          isOpen={true}
          onClose={closeEditForm}
          onSubmit={handleUpdateTransaction}
          categories={categories}
          initialData={{
            description: editingTransaction.description,
            amount: Number(editingTransaction.amount),
            categoryId: editingTransaction.categoryId,
            date: new Date(editingTransaction.date),
            isFixed: editingTransaction.isFixed,
          }}
          mode="edit"
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}
