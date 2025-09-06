import { Category } from '@/types';
import { DEFAULT_CATEGORIES } from './default-categories';

/**
 * Get the display name for a category, handling translation for default categories
 * @param category The category object
 * @param t The translation function from useI18n
 * @returns The translated name for default categories or the actual name for custom categories
 */
export function getCategoryDisplayName(
  category: Category,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, ...args: any[]) => string
): string {
  if (!category.isCustom) {
    // For default categories, the name is an i18n key
    return t(category.name);
  }
  // For custom categories, use the name as-is
  return category.name;
}

/**
 * Check if a category ID is a default category
 * @param categoryId The category ID to check
 * @returns True if it's a default category
 */
export function isDefaultCategory(categoryId: string): boolean {
  return categoryId.startsWith('default_');
}

/**
 * Get a default category by ID
 * @param categoryId The default category ID
 * @returns The default category or undefined if not found
 */
export function getDefaultCategory(categoryId: string) {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Validate that a category ID exists (either in defaults or could be a custom category)
 * @param categoryId The category ID to validate
 * @param customCategoryIds Array of custom category IDs from the database
 * @returns True if the category ID is valid
 */
export function isValidCategoryId(categoryId: string, customCategoryIds: string[]): boolean {
  return isDefaultCategory(categoryId) || customCategoryIds.includes(categoryId);
}

/**
 * Sort categories by type and name
 * @param categories Array of categories to sort
 * @param t Translation function for sorting default categories
 * @returns Sorted categories array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sortCategories(categories: Category[], t: (key: string, ...args: any[]) => string): Category[] {
  return categories.sort((a, b) => {
    // First sort by type (income first, then expense)
    if (a.type !== b.type) {
      return a.type === 'income' ? -1 : 1;
    }

    // Then sort by name
    const aName = getCategoryDisplayName(a, t);
    const bName = getCategoryDisplayName(b, t);
    return aName.localeCompare(bName);
  });
}

/**
 * Filter categories by type
 * @param categories Array of categories to filter
 * @param type The type to filter by
 * @returns Filtered categories array
 */
export function filterCategoriesByType(categories: Category[], type: 'income' | 'expense'): Category[] {
  return categories.filter(cat => cat.type === type);
}
