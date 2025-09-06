export type DefaultCategory = {
  id: string;
  name: string; // i18n key
  type: 'income' | 'expense';
  color: string;
  isCustom: false;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Income categories
  {
    id: 'default_salary',
    name: 'category_salary',
    type: 'income',
    color: '#10B981',
    isCustom: false,
  },
  {
    id: 'default_freelance',
    name: 'category_freelance',
    type: 'income',
    color: '#3B82F6',
    isCustom: false,
  },
  {
    id: 'default_investment',
    name: 'category_investment',
    type: 'income',
    color: '#8B5CF6',
    isCustom: false,
  },
  {
    id: 'default_business',
    name: 'category_business',
    type: 'income',
    color: '#06B6D4',
    isCustom: false,
  },

  // Expense categories
  {
    id: 'default_groceries',
    name: 'category_groceries',
    type: 'expense',
    color: '#EF4444',
    isCustom: false,
  },
  {
    id: 'default_transportation',
    name: 'category_transportation',
    type: 'expense',
    color: '#F59E0B',
    isCustom: false,
  },
  {
    id: 'default_housing',
    name: 'category_housing',
    type: 'expense',
    color: '#6366F1',
    isCustom: false,
  },
  {
    id: 'default_utilities',
    name: 'category_utilities',
    type: 'expense',
    color: '#EC4899',
    isCustom: false,
  },
  {
    id: 'default_entertainment',
    name: 'category_entertainment',
    type: 'expense',
    color: '#14B8A6',
    isCustom: false,
  },
  {
    id: 'default_healthcare',
    name: 'category_healthcare',
    type: 'expense',
    color: '#F97316',
    isCustom: false,
  },
  {
    id: 'default_shopping',
    name: 'category_shopping',
    type: 'expense',
    color: '#84CC16',
    isCustom: false,
  },
  {
    id: 'default_education',
    name: 'category_education',
    type: 'expense',
    color: '#8B5CF6',
    isCustom: false,
  },
  {
    id: 'default_insurance',
    name: 'category_insurance',
    type: 'expense',
    color: '#6B7280',
    isCustom: false,
  },
  {
    id: 'default_dining',
    name: 'category_dining',
    type: 'expense',
    color: '#F59E0B',
    isCustom: false,
  },
];

export const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.reduce((acc, cat) => {
  const key = cat.id.replace('default_', '');
  acc[key] = cat.id;
  return acc;
}, {} as Record<string, string>);
