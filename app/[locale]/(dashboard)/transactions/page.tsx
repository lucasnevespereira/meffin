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
    <div className="space-y-8">
      {/* Page Title and Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('transactions_title')}</h1>
          <p className="text-muted-foreground">{t('transactions_subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 bg-card rounded-xl p-1 border border-border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="hover:bg-accent rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-lg border-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="hover:bg-accent rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-start">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
          disabled={isLoadingCategories || categories.length === 0}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('transactions_add_button')}
        </Button>
      </div>

      {/* Transaction Lists */}
      {isLoadingTransactions ? (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-lg mb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
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
