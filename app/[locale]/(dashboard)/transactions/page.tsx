'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AnalyticsUpIcon, Calendar01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AnnualTransactionList } from '@/components/transactions/AnnualTransactionList';
import {
  useTransactions,
  useAnnualTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction
} from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { usePartnerInfo } from '@/hooks/usePartner';
import { TransactionFormData, TransactionWithCategory, RepeatType } from '@/types';
import { useCurrentLocale, useI18n } from '@/locales/client';
import { useSession } from '@/lib/auth-client';
import { useUserCurrency } from '@/lib/currency-utils';
import { getCategoryDisplayName } from '@/lib/category-utils';
import { downloadMonthExcel, type ExcelRow } from '@/lib/excel-export';
import { PageHeader } from '@/components/shared/PageHeader';

export default function TransactionsPage() {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = currentLocale === 'fr' ? 'fr' : 'en';
  const currency = useUserCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [activeTab, setActiveTab] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const { data: session } = useSession();
  const { data: transactionsData, isLoading: isLoadingTransactions, error } = useTransactions();
  const { data: annualTransactionsData, isLoading: isLoadingAnnualTransactions } = useAnnualTransactions();
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const { data: partnerInfo } = usePartnerInfo();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

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

  // Helper function to determine repeat type from transaction data
  const getRepeatTypeFromTransaction = (transaction: TransactionWithCategory): RepeatType => {
    // Use the stored repeatType if available
    if (transaction.repeatType) {
      return transaction.repeatType as RepeatType;
    }

    // Legacy fallback for transactions without repeatType
    if (!transaction.isFixed) return 'once' as const;

    if (!transaction.endDate) return 'forever' as const;

    const startDate = new Date(transaction.date);
    const endDate = new Date(transaction.endDate);
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    // Check common repeat patterns
    if (diffMonths === 3) return '3months' as const;
    if (diffMonths === 4) return '4months' as const;
    if (diffMonths === 6) return '6months' as const;
    if (diffMonths === 12) return '12months' as const;

    // Default to 'until' for custom end dates
    return 'until' as const;
  };

  const handleDeleteTransaction = (id: string) => {
    deleteMutation.mutate(id);
  };

  const closeEditForm = () => {
    setEditingTransaction(null);
  };

  const handleExport = async () => {
    const txns = transactionsData?.transactions ?? [];
    const rows: ExcelRow[] = txns
      .filter((tx) => tx.category.type === 'income' || tx.category.type === 'expense')
      .map((tx) => ({
        date: new Date(tx.date),
        description: tx.description,
        category: getCategoryDisplayName(tx.category, t),
        type: tx.category.type as 'income' | 'expense',
        amount: Number(tx.amount),
        createdBy: tx.createdBy?.name,
      }));

    if (rows.length === 0) return;

    setIsExporting(true);
    try {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      await downloadMonthExcel({
        filename: `meffin-${now.getFullYear()}-${mm}.xlsx`,
        sheetName: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(now),
        rows,
        currencyCode: currency,
        includeCreatedBy: !!partnerInfo?.partner,
        labels: {
          date: t('transaction_date'),
          description: t('transaction_description'),
          category: t('transaction_category'),
          type: t('export_type_label'),
          amount: t('transaction_amount'),
          createdBy: t('transaction_created_by'),
          income: t('export_type_income'),
          expense: t('export_type_expense'),
          totalIncome: t('export_total_income'),
          totalExpenses: t('export_total_expenses'),
          balance: t('trends_balance'),
        },
      });
    } finally {
      setIsExporting(false);
    }
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

  const allTransactions = transactionsData?.transactions ?? [];
  const allAnnualTransactions = annualTransactionsData?.transactions ?? [];
  const categories = categoriesData?.categories ?? [];

  // Filter transactions based on type
  const monthlyTransactions = allTransactions.filter(transaction =>
    transaction.repeatType !== 'annual'
  );

  // Use dedicated annual transactions data for annual tab
  const annualTransactions = allAnnualTransactions;

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('transactions_title')}
        description={t('transactions_subtitle')}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || isLoadingTransactions || (transactionsData?.transactions?.length ?? 0) === 0}
              className="w-full cursor-pointer sm:w-auto"
            >
              <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" />
              {t('export_button')}
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="w-full cursor-pointer shadow-card hover:shadow-lg sm:w-auto"
              disabled={isLoadingCategories || categories.length === 0}
            >
              <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
              {t('transactions_add_button')}
            </Button>
          </div>
        }
      />

      {/* Discrete view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HugeiconsIcon icon={AnalyticsUpIcon} className="h-3.5 w-3.5 inline mr-1.5" />
            {t('transactions_monthly') || 'Monthly'}
          </button>
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'annual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 inline mr-1.5" />
            {t('transactions_annual') || 'Annual'}
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* Monthly Transactions Tab */}
        <TabsContent value="monthly" className="mt-0 space-y-6 md:space-y-8">
          {isLoadingTransactions ? (
            <div className="space-y-6 md:space-y-8">
              {[1, 2].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card shadow-card animate-pulse">
                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div className="h-5 md:h-6 bg-muted rounded w-28 md:w-32" />
                      <div className="h-5 md:h-6 bg-muted rounded-full w-16 md:w-20" />
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-muted rounded-lg" />
                            <div>
                              <div className="h-3 md:h-4 bg-muted rounded w-20 md:w-24 mb-1 md:mb-2" />
                              <div className="h-2 md:h-3 bg-muted rounded w-12 md:w-16" />
                            </div>
                          </div>
                          <div className="h-4 md:h-6 bg-muted rounded w-12 md:w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              <TransactionList
                transactions={monthlyTransactions}
                type="income"
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                isDeleting={deleteMutation.isPending}
                hasPartner={!!partnerInfo?.partner}
                currentUserId={session?.user?.id}
              />

              <TransactionList
                transactions={monthlyTransactions}
                type="expense"
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                isDeleting={deleteMutation.isPending}
                hasPartner={!!partnerInfo?.partner}
                currentUserId={session?.user?.id}
              />
            </div>
          )}
        </TabsContent>

        {/* Annual Transactions Tab */}
        <TabsContent value="annual" className="mt-0 space-y-6 md:space-y-8">
          {isLoadingAnnualTransactions ? (
            <div className="space-y-6 md:space-y-8">
              <div className="rounded-xl border border-border bg-card shadow-card animate-pulse">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="h-5 md:h-6 bg-muted rounded w-28 md:w-32" />
                    <div className="h-5 md:h-6 bg-muted rounded-full w-16 md:w-20" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {[1, 2].map(j => (
                      <div key={j} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-muted rounded-lg" />
                          <div>
                            <div className="h-3 md:h-4 bg-muted rounded w-20 md:w-24 mb-1 md:mb-2" />
                            <div className="h-2 md:h-3 bg-muted rounded w-12 md:w-16" />
                          </div>
                        </div>
                        <div className="h-4 md:h-6 bg-muted rounded w-12 md:w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AnnualTransactionList
              transactions={annualTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              isDeleting={deleteMutation.isPending}
              hasPartner={!!partnerInfo?.partner}
              currentUserId={session?.user?.id}
            />
          )}
        </TabsContent>
      </Tabs>

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
            isPrivate: editingTransaction.isPrivate || false,
            dayOfMonth: new Date(editingTransaction.date).getDate(),
            repeatType: getRepeatTypeFromTransaction(editingTransaction),
            customEndDate: editingTransaction.endDate ? new Date(editingTransaction.endDate) : undefined,
            endDate: editingTransaction.endDate ? new Date(editingTransaction.endDate) : null,
          }}
          mode="edit"
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}
