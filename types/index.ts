import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { users, categories, transactions } from '@/lib/db/schema';

// Database model types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Unified Category type that combines database categories and default categories
export type Category = {
  id: string;
  name: string; // For default categories, this is the i18n key; for custom, it's the actual name
  type: string;
  color: string;
  isCustom: boolean;
  userId?: string | null;
  createdAt?: Date;
};

export type DatabaseCategory = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

// Extended types with relations
export type TransactionWithCategory = Transaction & {
  category: Category;
  createdBy?: {
    id: string;
    name: string;
  };
};

export type CategoryWithTransactions = Category & {
  transactions: Transaction[];
};

// Repeat type definitions
export type RepeatType = 'forever' | '3months' | '4months' | '6months' | '12months' | 'until' | 'once';
export type TimeLimitedRepeatType = '3months' | '4months' | '6months' | '12months';

// Type guards
export const isTimeLimitedRepeat = (repeatType: RepeatType): repeatType is TimeLimitedRepeatType => {
  return ['3months', '4months', '6months', '12months'].includes(repeatType);
};

// Form types
export type TransactionFormData = {
  description: string;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  repeatType: RepeatType;
  customEndDate?: Date;
  isPrivate?: boolean;
  // Legacy fields for submission compatibility
  date?: Date;
  endDate?: Date | null;
  isFixed?: boolean;
};

export type CategoryType = 'income' | 'expense';

export type CategoryFormData = {
  name: string;
  type: CategoryType;
  color: string;
};

// Dashboard types
export type MonthlyBalance = {
  balance: number;
  income: number;
  expenses: number;
};

export type CategorySummary = {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  transactionCount: number;
};
