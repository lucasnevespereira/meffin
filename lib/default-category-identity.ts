import en from '../locales/en';
import fr from '../locales/fr';
import { DEFAULT_CATEGORIES, DefaultCategory } from './default-categories';

type CategoryType = DefaultCategory['type'];
type TranslationCatalog = Record<string, string>;

const TRANSLATION_CATALOGS: TranslationCatalog[] = [en, fr];

/**
 * Category ids are domain identifiers. Labels are presentation and may change with the
 * viewer's locale, so translated labels must never become a second category identity.
 */
export function normalizeCategoryName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');
}

const defaultCategoryById = new Map(
  DEFAULT_CATEGORIES.map(category => [category.id, category])
);

const defaultCategoryByAlias = new Map<string, DefaultCategory>();

for (const category of DEFAULT_CATEGORIES) {
  const labels = [
    category.name,
    ...TRANSLATION_CATALOGS.map(catalog => catalog[category.name]),
  ];

  for (const label of labels) {
    if (!label) continue;
    defaultCategoryByAlias.set(
      `${category.type}:${normalizeCategoryName(label)}`,
      category
    );
  }
}

export function isDefaultCategoryId(categoryId: string): boolean {
  return defaultCategoryById.has(categoryId);
}

export function getDefaultCategoryById(
  categoryId: string
): DefaultCategory | undefined {
  return defaultCategoryById.get(categoryId);
}

export function getDefaultCategoryByLocalizedName(
  name: string,
  type: CategoryType
): DefaultCategory | undefined {
  return defaultCategoryByAlias.get(`${type}:${normalizeCategoryName(name)}`);
}
