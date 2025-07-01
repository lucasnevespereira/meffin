import { Transaction } from "@/app/[locale]/transactions/page";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { getDayOfMonth, getMonthName } from "@/lib/date";

export default function TransactionCard({
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
        <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit">
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
