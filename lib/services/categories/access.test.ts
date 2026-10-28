import { describe, expect, it, vi } from 'vitest';

const customCategory = vi.hoisted(() => ({ value: { id: 'custom-1', type: 'income' } }));

vi.mock('@/lib/db', () => ({
  db: {
    select: () => {
      const query = {
        from() { return query; },
        where() { return query; },
        async limit() { return [customCategory.value]; },
      };
      return query;
    },
  },
}));

import { canUseCategory } from './access';

describe('shopping-list category access', () => {
  it('rejects income defaults for expense-only callers', async () => {
    expect(await canUseCategory({
      categoryId: 'default_salary', userIds: ['user-1'], type: 'expense',
    })).toBe(false);
    expect(await canUseCategory({
      categoryId: 'default_groceries', userIds: ['user-1'], type: 'expense',
    })).toBe(true);
  });

  it('rejects custom income categories for expense-only callers', async () => {
    expect(await canUseCategory({
      categoryId: 'custom-1', userIds: ['user-1'], type: 'expense',
    })).toBe(false);
  });
});
