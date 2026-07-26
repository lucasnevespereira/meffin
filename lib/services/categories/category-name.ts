import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import {
  getDefaultCategoryByLocalizedName,
  normalizeCategoryName,
} from '@/lib/default-category-identity';
import { resolveViewer } from '@/lib/services/budget/budget';
import type { CategoryType } from '@/types';

export type CategoryNameConflict =
  | {
      kind: 'default';
      categoryId: string;
      categoryNameKey: string;
    }
  | {
      kind: 'custom';
      categoryId: string;
    };

type FindCategoryNameConflictOptions = {
  userId: string;
  name: string;
  type: CategoryType;
  excludeCategoryId?: string;
};

/**
 * Custom categories are shared with a partner, so uniqueness is checked across the
 * household rather than only against the row owner.
 */
export async function findCategoryNameConflict({
  userId,
  name,
  type,
  excludeCategoryId,
}: FindCategoryNameConflictOptions): Promise<CategoryNameConflict | null> {
  const defaultCategory = getDefaultCategoryByLocalizedName(name, type);
  if (defaultCategory) {
    return {
      kind: 'default',
      categoryId: defaultCategory.id,
      categoryNameKey: defaultCategory.name,
    };
  }

  const viewer = await resolveViewer(userId);
  if (!viewer) return null;

  const householdCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
    })
    .from(categories)
    .where(inArray(categories.userId, viewer.userIds));

  const normalizedName = normalizeCategoryName(name);
  const duplicate = householdCategories.find(category =>
    category.id !== excludeCategoryId &&
    category.type === type &&
    normalizeCategoryName(category.name) === normalizedName
  );

  return duplicate
    ? { kind: 'custom', categoryId: duplicate.id }
    : null;
}
