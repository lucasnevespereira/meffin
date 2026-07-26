import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { isDefaultCategoryId } from '@/lib/default-category-identity';

type CategoryAccessOptions = {
  categoryId: string;
  userIds: string[];
  includeArchived?: boolean;
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
}: CategoryAccessOptions): Promise<boolean> {
  if (isDefaultCategoryId(categoryId)) {
    return true;
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(
      eq(categories.id, categoryId),
      inArray(categories.userId, userIds),
      includeArchived ? undefined : isNull(categories.archivedAt)
    ))
    .limit(1);

  return Boolean(category);
}
