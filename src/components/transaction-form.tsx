import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type {
  TransactionFormValues,
  CategoryOption,
} from "@/types/transaction";

interface TransactionFormProps {
  initialValues?: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
  categories: CategoryOption[];
  isLoading?: boolean;
}

export default function TransactionForm({
  initialValues,
  onSubmit,
  onCancel,
  categories,
  isLoading,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(
    initialValues || {
      description: "",
      amount: "",
      type: "expense",
      day: 1,
      categoryId: undefined,
      isRecurring: false,
      endDate: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setValues((prev: TransactionFormValues) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === "day") {
      setValues((prev: TransactionFormValues) => ({
        ...prev,
        day: Math.max(1, Math.min(31, Number(value))),
      }));
    } else {
      setValues((prev: TransactionFormValues) => ({ ...prev, [name]: value }));
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!values.description) errs.description = "Description is required.";
    if (!values.amount || isNaN(Number(values.amount)))
      errs.amount = "Valid amount required.";
    if (!values.day || values.day < 1 || values.day > 31)
      errs.day = "Day must be between 1 and 31.";
    if (
      values.isRecurring &&
      values.endDate &&
      isNaN(Date.parse(values.endDate))
    ) {
      errs.endDate = "End date must be a valid date.";
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const submitValues = { ...values };
      if (!values.isRecurring) {
        const now = new Date();
        submitValues.endDate = getLastDayOfMonth(
          now.getFullYear(),
          now.getMonth()
        );
      }
      onSubmit(submitValues);
    }
  }

  function getLastDayOfMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).toISOString().slice(0, 10);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="e.g. Rent, Salary, Groceries"
          required
        />
        {errors.description && (
          <div className="text-red-500 text-xs">{errors.description}</div>
        )}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={values.amount}
            onChange={handleChange}
            placeholder="0,00"
            required
          />
          {errors.amount && (
            <div className="text-red-500 text-xs">{errors.amount}</div>
          )}
        </div>
        <div className="flex-1">
          <Label htmlFor="day">Day of the month</Label>
          <Input
            id="day"
            name="day"
            type="number"
            min={1}
            max={31}
            value={values.day}
            onChange={handleChange}
            required
          />
          {errors.day && (
            <div className="text-red-500 text-xs">{errors.day}</div>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            value={values.type}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            value={values.categoryId || ""}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ""}
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="border-t pt-4 mt-2 space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isRecurring"
            name="isRecurring"
            checked={!!values.isRecurring}
            onCheckedChange={(checked) =>
              setValues((v: TransactionFormValues) => ({
                ...v,
                isRecurring: !!checked,
              }))
            }
          />
          <Label htmlFor="isRecurring">Recurring</Label>
          <span className="text-xs text-gray-500">
            (This transaction repeats every month)
          </span>
        </div>
        {values.isRecurring && (
          <div>
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={values.endDate || ""}
              onChange={handleChange}
              className="w-full"
            />
            <span className="text-xs text-gray-500 block mt-1">
              Leave empty to repeat forever, or pick a date for limited
              recurring payments.
            </span>
            {errors.endDate && (
              <div className="text-red-500 text-xs">{errors.endDate}</div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialValues ? "Update" : "Add"}{" "}
          Transaction
        </Button>
      </div>
    </form>
  );
}
