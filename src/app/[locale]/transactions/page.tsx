"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TransactionForm from "@/components/transaction-form";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/server/transactions";
import { Pencil, Trash2, Plus } from "lucide-react";

// --- Types ---
export type Transaction = {
  id: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string; // ISO string
  categoryId?: string;
  isRecurring?: boolean;
  endDate?: string; // ISO string
  category?: { name: string; color?: string; icon?: string };
};

export type TransactionFormValues = {
  description: string;
  amount: string;
  type: "income" | "expense";
  day: number;
  categoryId?: string;
  isRecurring?: boolean;
  endDate?: string; // ISO date string (YYYY-MM-DD)
};

// Type for backend create/update input
type TransactionInput = {
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string;
  categoryId?: string;
  isRecurring?: boolean;
  endDate?: string;
};

// --- Helpers ---
function transactionToFormValues(tx: Transaction): TransactionFormValues {
  return {
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    day: tx.date ? new Date(tx.date).getDate() : 1,
    categoryId: tx.categoryId,
    isRecurring: tx.isRecurring,
    endDate: tx.endDate ? tx.endDate.slice(0, 10) : undefined,
  };
}

function formValuesToTransactionInput(
  values: TransactionFormValues,
  currentMonth: string
): TransactionInput {
  // Compose a date string for the current month and selected day
  const date = `${currentMonth}-${String(values.day).padStart(2, "0")}`;
  return {
    description: values.description,
    amount: values.amount,
    type: values.type,
    date,
    categoryId: values.categoryId,
    isRecurring: values.isRecurring,
    endDate: values.endDate,
  };
}

export default function Transactions() {
  const t = useTranslations("Navigation");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Fetch transactions
  const { data: transactionsRaw = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const txs = await getTransactions();
      return Array.isArray(txs)
        ? txs.map((tx) => ({
            ...tx,
            date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
            endDate:
              tx.endDate == null
                ? undefined
                : tx.endDate instanceof Date
                  ? tx.endDate.toISOString()
                  : tx.endDate,
            categoryId: tx.categoryId == null ? undefined : tx.categoryId,
          }))
        : [];
    },
  });
  const transactions: Transaction[] = Array.isArray(transactionsRaw)
    ? transactionsRaw
    : [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDialogOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransactionInput }) =>
      updateTransaction(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDialogOpen(false);
      setEditTx(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  // Group transactions
  const income = transactions.filter((tx: Transaction) => tx.type === "income");
  const expenses = transactions.filter(
    (tx: Transaction) => tx.type === "expense"
  );

  // Get current month in YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  function handleAdd() {
    setEditTx(null);
    setDialogOpen(true);
  }
  function handleEdit(tx: Transaction) {
    setEditTx(tx);
    setDialogOpen(true);
  }
  function handleDelete(id: string) {
    if (confirm("Delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  }
  function handleFormSubmit(values: TransactionFormValues) {
    if (editTx) {
      updateMutation.mutate({
        id: editTx.id,
        values: formValuesToTransactionInput(values, currentMonth),
      });
    } else {
      createMutation.mutate(formValuesToTransactionInput(values, currentMonth));
    }
  }

  // Helper: get day of month from ISO date
  function getDayOfMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d.getDate();
  }
  // Helper: get month name (localized)
  function getMonthName(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("fr-FR", { month: "long" });
  }

  // Responsive + theme-aware card
  function TransactionCard({
    tx,
    onEdit,
    onDelete,
  }: {
    tx: Transaction;
    onEdit: () => void;
    onDelete: () => void;
  }) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-white dark:bg-gray-900 shadow-sm px-4 py-3 transition hover:shadow-md min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center justify-center min-w-[48px]">
            <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {getDayOfMonth(tx.date)}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {getMonthName(tx.date)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {tx.category?.icon && <span>{tx.category.icon}</span>}
              <span className="font-medium truncate" title={tx.description}>
                {tx.description}
              </span>
              {tx.category?.name && (
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    background: tx.category?.color || "#e5e7eb",
                    color: "#111",
                  }}
                >
                  {tx.category.name}
                </span>
              )}
              {tx.isRecurring && (
                <span className="ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded text-xs font-semibold">
                  RÉCURRENT
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <span
            className={
              tx.type === "income"
                ? "text-green-600 dark:text-green-400 font-bold text-lg whitespace-nowrap"
                : "text-red-600 dark:text-red-400 font-bold text-lg whitespace-nowrap"
            }
            style={{ minWidth: 90, textAlign: "right" }}
          >
            {tx.type === "income" ? "+" : "-"}
            {parseFloat(tx.amount).toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}{" "}
            €
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-3xl mx-auto w-full px-2 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("transactions")}
          </h1>
          <div className="hidden sm:block">
            <Button onClick={handleAdd}>
              <Plus className="w-5 h-5 mr-2" /> Ajouter
            </Button>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogTitle>
              {editTx ? "Modifier la transaction" : "Ajouter une transaction"}
            </DialogTitle>
            <TransactionForm
              initialValues={
                editTx ? transactionToFormValues(editTx) : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setDialogOpen(false);
                setEditTx(null);
              }}
              categories={[] /* TODO: integrate categories */}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Mes entrées</h2>
            <div className="flex flex-col gap-3">
              {income.length === 0 && (
                <div className="text-gray-500">Aucune entrée.</div>
              )}
              {income.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  tx={tx}
                  onEdit={() => handleEdit(tx)}
                  onDelete={() => handleDelete(tx.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Mes dépenses</h2>
            <div className="flex flex-col gap-3">
              {expenses.length === 0 && (
                <div className="text-gray-500">Aucune dépense.</div>
              )}
              {expenses.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  tx={tx}
                  onEdit={() => handleEdit(tx)}
                  onDelete={() => handleDelete(tx.id)}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Floating add button for mobile */}
        <Button
          onClick={handleAdd}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg sm:hidden bg-primary text-primary-foreground w-14 h-14 p-0 flex items-center justify-center"
          aria-label="Ajouter une transaction"
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>
    </DashboardLayout>
  );
}
