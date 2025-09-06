import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { users, categories, transactions } from '@/lib/schema';

// Database model types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

// Extended types with relations
export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type CategoryWithTransactions = Category & {
  transactions: Transaction[];
};

// Form types
export type TransactionFormData = {
  description: string;
  amount: number;
  categoryId: string;
  date: Date;
  isFixed: boolean;
};

export type CategoryFormData = {
  name: string;
  type: 'income' | 'expense';
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
