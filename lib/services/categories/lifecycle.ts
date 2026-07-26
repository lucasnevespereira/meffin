export type CategoryReferences = {
  transactions: boolean;
  lists: boolean;
  listItems: boolean;
};

/**
 * Referenced categories are archived so historical records keep their identity.
 * Categories that were never used can be removed permanently.
 */
export function shouldArchiveCategory(references: CategoryReferences): boolean {
  return references.transactions || references.lists || references.listItems;
}
