import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fixture = vi.hoisted(() => {
  const item = {
    id: 'item-1',
    listId: 'list-1',
    name: 'Groceries',
    categoryId: 'default_groceries',
    estimatedPrice: '20.00',
    isChecked: false,
    checkedAt: null as string | null,
    transactionId: null as string | null,
    updatedAt: '',
  };
  const list = { id: 'list-1', userId: 'user-1', isShared: false };
  const expenses: string[] = [];
  let lockCalls = 0;
  let gate = Promise.resolve();

  const operations = {
    select(fields: Record<string, unknown>) {
      const query = {
        from() { return query; },
        innerJoin() { return query; },
        where() { return query; },
        for() { lockCalls++; return query; },
        limit() { return query; },
        then(resolve: (rows: unknown[]) => unknown, reject?: (error: unknown) => unknown) {
          const rows = 'item' in fields
            ? [{ item: { ...item }, list: { ...list } }]
            : [{ id: 'user-1', partnerId: null }];
          return Promise.resolve(rows).then(resolve, reject);
        },
      };
      return query;
    },
    insert() {
      const query = {
        values() { return query; },
        async returning() {
          const id = `expense-${expenses.length + 1}`;
          expenses.push(id);
          return [{ id }];
        },
      };
      return query;
    },
    update(table: unknown) {
      const query = {
        set(values: Record<string, unknown>) {
          if ('isChecked' in values) Object.assign(item, values);
          return query;
        },
        where() { return query; },
        async returning() { return [{ ...item }]; },
      };
      void table;
      return query;
    },
    delete() {
      const query = { where() { return query; } };
      return query;
    },
  };
  const database = {
    ...operations,
    async transaction<T>(callback: (tx: typeof operations) => Promise<T>): Promise<T> {
      const previous = gate;
      let release!: () => void;
      gate = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try { return await callback(operations); }
      finally { release(); }
    },
  };

  return {
    database,
    item,
    expenses,
    get lockCalls() { return lockCalls; },
    reset() {
      item.isChecked = false;
      item.checkedAt = null;
      item.transactionId = null;
      item.categoryId = 'default_groceries';
      item.updatedAt = '';
      expenses.length = 0;
      lockCalls = 0;
      gate = Promise.resolve();
    },
  };
});

vi.mock('@/lib/db', () => ({ db: fixture.database }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: async () => ({ user: { id: 'user-1' } }) } },
}));

import { POST } from './route';

describe('checking a shopping-list item', () => {
  beforeEach(() => fixture.reset());

  it('creates one expense when two requests check the same item concurrently', async () => {
    const call = () => POST(
      new NextRequest('http://localhost/api/lists/list-1/items/item-1/check', {
        method: 'POST',
        body: JSON.stringify({ isChecked: true }),
      }),
      { params: Promise.resolve({ id: 'list-1', itemId: 'item-1' }) },
    );

    const responses = await Promise.all([call(), call()]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(fixture.expenses).toHaveLength(1);
    expect(fixture.item.transactionId).toBe(fixture.expenses[0]);
    expect(fixture.lockCalls).toBe(2);
  });

  it('does not turn a list item with an income category into income', async () => {
    fixture.item.categoryId = 'default_salary';
    const response = await POST(
      new NextRequest('http://localhost/api/lists/list-1/items/item-1/check', {
        method: 'POST',
        body: JSON.stringify({ isChecked: true }),
      }),
      { params: Promise.resolve({ id: 'list-1', itemId: 'item-1' }) },
    );

    expect(response.status).toBe(400);
    expect(fixture.expenses).toHaveLength(0);
    expect(fixture.item.isChecked).toBe(false);
  });
});
