export interface CategoryOption {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface TransactionFormValues {
  description: string;
  amount: string;
  type: "income" | "expense";
  day: number; // day of month
  categoryId?: string;
  isRecurring?: boolean;
  endDate?: string; // ISO date string (YYYY-MM-DD)
}

export type TransactionInput = {
  description: string;
  amount: string | number;
  type: "income" | "expense";
  date: string | Date;
  isRecurring?: boolean;
  endDate?: string | Date | null;
  categoryId?: string | null;
};

export type TransactionRecord = {
  id: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  date: Date;
  isRecurring: boolean;
  endDate: Date | null;
  categoryId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
