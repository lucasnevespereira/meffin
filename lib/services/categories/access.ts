import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { getDefaultCategoryById } from '@/lib/default-category-identity';

type CategoryAccessOptions = {
  categoryId: string;
  userIds: string[];
  includeArchived?: boolean;
  type?: 'income' | 'expense';
  database?: Pick<typeof db, 'select'>;
};

/**
 * Categories can be shared inside a household, but archived categories must not be
 * selected for new data. Existing records may keep their archived category while the
 * user edits unrelated fields, which is what `includeArchived` is for.
 */
export async function canUseCategory({
  categoryId,
  userIds,
  includeArchived = false,
  type,
  database = db,
}: CategoryAccessOptions): Promise<boolean> {
  const defaultCategory = getDefaultCategoryById(categoryId);
  if (defaultCategory) {
    return !type || defaultCategory.type === type;
  }

  const [category] = await database
    .select({ id: categories.id, type: categories.type })
    .from(categories)
    .where(and(
      eq(categories.id, categoryId),
      inArray(categories.userId, userIds),
      includeArchived ? undefined : isNull(categories.archivedAt)
    ))
    .limit(1);

  return Boolean(category && (!type || category.type === type));
}
