import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { listItems, lists, transactions, users } from '@/lib/db/schema';

const session = vi.hoisted(() => ({ userId: '' }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: async () => ({ user: { id: session.userId } }) } },
}));

describe.skipIf(!process.env.MEFFIN_INTEGRATION_DATABASE_URL)(
  'check item with PostgreSQL',
  () => {
    let database: typeof import('@/lib/db').db;
    let post: typeof import('./route').POST;
    const userId = crypto.randomUUID();
    const listId = crypto.randomUUID();
    const itemId = crypto.randomUUID();

    beforeAll(async () => {
      const integrationUrl = process.env.MEFFIN_INTEGRATION_DATABASE_URL;
      if (!integrationUrl || !['localhost', '127.0.0.1'].includes(new URL(integrationUrl).hostname)) {
        throw new Error('The integration test requires a local PostgreSQL URL');
      }
      process.env.DATABASE_URL = integrationUrl;
      database = (await import('@/lib/db')).db;
      post = (await import('./route')).POST;
      session.userId = userId;

      await database.insert(users).values({
        id: userId,
        name: 'API test user',
        email: `${userId}@example.invalid`,
      });
      await database.insert(lists).values({
        id: listId,
        userId,
        createdBy: userId,
        title: 'Groceries',
        categoryId: 'default_groceries',
      });
      await database.insert(listItems).values({
        id: itemId,
        listId,
        createdBy: userId,
        name: 'Milk',
        estimatedPrice: '2.50',
        categoryId: 'default_groceries',
      });
    });

    afterAll(async () => {
      if (database) await database.delete(users).where(eq(users.id, userId));
    });

    it('creates one linked expense for concurrent check requests', async () => {
      const call = () => post(
        new NextRequest(`http://localhost/api/lists/${listId}/items/${itemId}/check`, {
          method: 'POST',
          body: JSON.stringify({ isChecked: true }),
        }),
        { params: Promise.resolve({ id: listId, itemId }) },
      );

      const responses = await Promise.all(Array.from({ length: 8 }, call));
      expect(responses.map(response => response.status)).toEqual(Array(8).fill(200));

      const [item] = await database.select().from(listItems).where(eq(listItems.id, itemId));
      const expenses = await database.select().from(transactions)
        .where(eq(transactions.userId, userId));
      expect(expenses).toHaveLength(1);
      expect(item.transactionId).toBe(expenses[0].id);
    });
  },
);
