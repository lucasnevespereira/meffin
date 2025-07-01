export type CategoryInput = {
  name: string;
  color?: string;
  icon?: string;
  type: "income" | "expense";
  locale: string;
  userId?: string;
  isDefault?: boolean;
};

export type CategoryRecord = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  type: "income" | "expense";
  locale: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};
