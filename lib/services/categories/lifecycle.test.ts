import { describe, expect, it } from 'vitest';
import { shouldArchiveCategory } from './lifecycle';

describe('shouldArchiveCategory', () => {
  it('allows an unused category to be deleted permanently', () => {
    expect(shouldArchiveCategory({
      transactions: false,
      lists: false,
      listItems: false,
    })).toBe(false);
  });

  it.each([
    ['transaction', { transactions: true, lists: false, listItems: false }],
    ['list', { transactions: false, lists: true, listItems: false }],
    ['list item', { transactions: false, lists: false, listItems: true }],
  ])('archives a category referenced by a %s', (_reference, references) => {
    expect(shouldArchiveCategory(references)).toBe(true);
  });
});
