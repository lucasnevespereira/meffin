import { useI18n } from '@/locales/client';
import { Category } from '@/types';

export type DefaultCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
};

export const DEFAULT_CATEGORY_IDS = {
  // Income
  salary: 'default_salary',
  freelance: 'default_freelance', 
  investment: 'default_investment',
  business: 'default_business',
  
  // Expense
  groceries: 'default_groceries',
  transportation: 'default_transportation',
  housing: 'default_housing',
  utilities: 'default_utilities',
  entertainment: 'default_entertainment',
  healthcare: 'default_healthcare',
  shopping: 'default_shopping',
  education: 'default_education',
  insurance: 'default_insurance',
  dining: 'default_dining',
} as const;

export function useDefaultCategories(): DefaultCategory[] {
  const t = useI18n();
  
  return [
    // Income categories
    {
      id: DEFAULT_CATEGORY_IDS.salary,
      name: t('category_salary'),
      type: 'income',
      color: '#10B981',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.freelance,
      name: t('category_freelance'),
      type: 'income', 
      color: '#3B82F6',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.investment,
      name: t('category_investment'),
      type: 'income',
      color: '#8B5CF6',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.business,
      name: t('category_business'),
      type: 'income',
      color: '#06B6D4', 
      isDefault: true,
    },
    
    // Expense categories
    {
      id: DEFAULT_CATEGORY_IDS.groceries,
      name: t('category_groceries'),
      type: 'expense',
      color: '#EF4444',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.transportation,
      name: t('category_transportation'),
      type: 'expense',
      color: '#F59E0B',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.housing,
      name: t('category_housing'),
      type: 'expense',
      color: '#6366F1',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.utilities,
      name: t('category_utilities'),
      type: 'expense',
      color: '#EC4899',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.entertainment,
      name: t('category_entertainment'),
      type: 'expense',
      color: '#14B8A6',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.healthcare,
      name: t('category_healthcare'),
      type: 'expense',
      color: '#F97316',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.shopping,
      name: t('category_shopping'),
      type: 'expense',
      color: '#84CC16',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.education,
      name: t('category_education'),
      type: 'expense',
      color: '#8B5CF6',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.insurance,
      name: t('category_insurance'),
      type: 'expense',
      color: '#6B7280',
      isDefault: true,
    },
    {
      id: DEFAULT_CATEGORY_IDS.dining,
      name: t('category_dining'),
      type: 'expense',
      color: '#F59E0B',
      isDefault: true,
    },
  ];
}

// Helper function to get display name for a category
export function getCategoryDisplayName(category: Category, t: (key: string) => string): string {
  // If it's a default category (stored with translation key), translate it
  if (!category.isCustom && category.name.startsWith('category_')) {
    return t(category.name as any);
  }
  // Otherwise, use the stored name directly
  return category.name;
}