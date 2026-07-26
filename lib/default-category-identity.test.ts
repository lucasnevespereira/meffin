import { describe, expect, it } from 'vitest';
import en from '../locales/en';
import fr from '../locales/fr';
import { DEFAULT_CATEGORIES } from './default-categories';
import {
  getDefaultCategoryByLocalizedName,
  isDefaultCategoryId,
  normalizeCategoryName,
} from './default-category-identity';

describe('default category identity', () => {
  it('resolves English and French labels to the same stable id', () => {
    for (const category of DEFAULT_CATEGORIES) {
      const key = category.name as keyof typeof en;
      expect(
        getDefaultCategoryByLocalizedName(en[key], category.type)?.id
      ).toBe(category.id);
      expect(
        getDefaultCategoryByLocalizedName(fr[key], category.type)?.id
      ).toBe(category.id);
    }
  });

  it('normalizes case, whitespace, and accents', () => {
    expect(normalizeCategoryName('  ÉDUCATION  ')).toBe('education');
    expect(
      getDefaultCategoryByLocalizedName('santé', 'expense')?.id
    ).toBe('default_healthcare');
  });

  it('keeps category type part of the identity lookup', () => {
    expect(
      getDefaultCategoryByLocalizedName('Salary', 'expense')
    ).toBeUndefined();
  });

  it('accepts only registered default ids', () => {
    expect(isDefaultCategoryId('default_subscriptions')).toBe(true);
    expect(isDefaultCategoryId('default_not_a_category')).toBe(false);
  });
});
