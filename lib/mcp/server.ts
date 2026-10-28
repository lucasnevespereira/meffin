import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listItems, lists, mcpActionReceipts, users } from '@/lib/db/schema';
import { getCategoryLookup, getEntries, getMonth, getRange, resolveViewer } from '@/lib/services/budget/budget';
import { currentMonthKey, fromKey, monthKey } from '@/lib/services/budget/keys';

const monthInput = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
const money = z.number().finite().nonnegative().max(99_999_999.99).multipleOf(0.01);
const itemInput = z.object({
  name: z.string().trim().min(1).max(255),
  estimatedPrice: money.optional().describe('Estimated total price of this line in the user’s currency'),
});

function selectedMonth(value?: string) {
  if (!value) return fromKey(currentMonthKey());
  const [year, oneBasedMonth] = value.split('-').map(Number);
  return { year, month: oneBasedMonth - 1 };
}

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], structuredContent: value as Record<string, unknown> };
}

function categoryName(id: string, name?: string) {
  return id.startsWith('default_') ? id.slice('default_'.length).replaceAll('_', ' ') : name || id;
}

export function createMeffinMcpServer(userId: string, clientId: string, scopes: ReadonlySet<string>, origin: string) {
  const server = new McpServer({ name: 'Meffin', version: '1.0.0' });

  server.registerTool('get_budget_month', {
    title: 'Get monthly budget',
    description: 'Read income, expenses, balance, and spending by category for one calendar month. Recurring entries in future months are forecasts.',
    inputSchema: z.object({ month: monthInput.optional().describe('Calendar month YYYY-MM; defaults to the current month') }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ month }) => {
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    const { year, month: index } = selectedMonth(month);
    const [view, [user]] = await Promise.all([
      getMonth(viewer, year, index, { readOnly: true }),
      db.select({ currency: users.currency }).from(users).where(eq(users.id, userId)).limit(1),
    ]);
    return result({ month: `${year}-${String(index + 1).padStart(2, '0')}`, currency: user?.currency || 'EUR',
      ...view.balance,
      categories: view.categoryBreakdown.map(({ categoryId, category, total, transactionCount }) => ({
        categoryId, categoryName: categoryName(categoryId, category.name), type: category.type, total, transactionCount,
      })),
      note: 'Future recurring entries are estimates, not completed spending.',
    });
  });

  server.registerTool('get_budget_trend', {
    title: 'Get budget trend',
    description: 'Read monthly income, expenses and balance for the last 3 to 12 calendar months, ending in the selected month.',
    inputSchema: z.object({ months: z.number().int().min(3).max(12).default(6), throughMonth: monthInput.optional() }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ months, throughMonth }) => {
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    const { year, month } = selectedMonth(throughMonth);
    const end = monthKey(year, month);
    const [points, [user]] = await Promise.all([
      getRange(viewer, end - months + 1, end, { readOnly: true }),
      db.select({ currency: users.currency }).from(users).where(eq(users.id, userId)).limit(1),
    ]);
    return result({ currency: user?.currency || 'EUR', note: 'Future recurring entries are estimates, not completed spending.', months: points.map((point) => ({
      month: `${point.year}-${String(point.month + 1).padStart(2, '0')}`,
      income: point.income, expenses: point.expenses, balance: point.balance,
    })) });
  });

  server.registerTool('get_transactions', {
    title: 'Get transactions',
    description: 'Read up to 50 visible transactions for a calendar month. Partner transactions marked private are excluded. Future recurring entries are labeled projected.',
    inputSchema: z.object({ month: monthInput.optional(), limit: z.number().int().min(1).max(50).default(30) }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ month, limit }) => {
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    const { year, month: index } = selectedMonth(month);
    const [entries, lookup] = await Promise.all([
      getEntries(viewer, monthKey(year, index), monthKey(year, index), { readOnly: true }),
      getCategoryLookup(viewer.userIds),
    ]);
    return result({ month: `${year}-${String(index + 1).padStart(2, '0')}`, total: entries.length,
      transactions: entries.slice(0, limit).map(({ id, description, amount, date, categoryId, source, isPrivate }) => ({
        id, description, amount, date, categoryId, categoryName: categoryName(categoryId, lookup[categoryId]?.name),
        type: lookup[categoryId]?.type || 'unknown', source, isPrivate,
      })),
    });
  });

  server.registerTool('list_shopping_lists', {
    title: 'List shopping lists',
    description: 'See your lists and shopping plans, including shared lists from your budget partner.',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async () => {
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    const visible = or(eq(lists.userId, userId), and(inArray(lists.userId, viewer.userIds), eq(lists.isShared, true)));
    const rows = await db.select({ id: lists.id, title: lists.title, description: lists.description,
      categoryId: lists.categoryId, budgetAmount: lists.budgetAmount, isShared: lists.isShared,
      itemCount: sql<number>`count(${listItems.id})::integer`,
      estimatedTotal: sql<string>`coalesce(sum(${listItems.estimatedPrice}), 0)`,
    }).from(lists).leftJoin(listItems, eq(listItems.listId, lists.id))
      .where(visible).groupBy(lists.id).orderBy(desc(lists.updatedAt)).limit(50);
    return result({ lists: rows.map(({ budgetAmount, estimatedTotal, ...row }) => ({
      ...row, budgetAmount: budgetAmount === null ? null : Number(budgetAmount), estimatedTotal: Number(estimatedTotal),
      url: `${origin}/lists/${row.id}`,
    })) });
  });

  server.registerTool('get_shopping_list', {
    title: 'Get shopping list',
    description: 'Read a shopping list and its items by ID. Only your own lists or a partner’s shared lists are visible.',
    inputSchema: z.object({ listId: z.uuid() }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ listId }) => {
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    const [list] = await db.select().from(lists).where(and(eq(lists.id, listId),
      or(eq(lists.userId, userId), and(inArray(lists.userId, viewer.userIds), eq(lists.isShared, true))))).limit(1);
    if (!list) return result({ error: 'List not found' });
    const items = await db.select({ id: listItems.id, name: listItems.name, estimatedPrice: listItems.estimatedPrice,
      isChecked: listItems.isChecked, categoryId: listItems.categoryId }).from(listItems).where(eq(listItems.listId, list.id));
    return result({ id: list.id, title: list.title, description: list.description,
      budgetAmount: list.budgetAmount === null ? null : Number(list.budgetAmount),
      isShared: list.isShared, items: items.map((item) => ({ ...item,
        estimatedPrice: item.estimatedPrice === null ? null : Number(item.estimatedPrice),
      })), url: `${origin}/lists/${list.id}` });
  });

  server.registerTool('create_shopping_list', {
    title: 'Create shopping plan',
    description: 'Save a new grocery or shopping list in Meffin with optional target budget and estimated item prices. Ask the user to review the plan before calling this tool. Prices are estimates; this does not create transactions or spend money. Reuse requestId on retries.',
    inputSchema: z.object({
      requestId: z.uuid().describe('A unique UUID for this action; reuse it if retrying the same action'),
      title: z.string().trim().min(1).max(255),
      description: z.string().trim().max(1000).optional(),
      budgetAmount: money.optional().describe('Target maximum for this list in the user’s currency'),
      items: z.array(itemInput).min(1).max(50),
      isShared: z.boolean().default(false).describe('Share with the user’s linked budget partner; defaults to private'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ requestId, title, description, budgetAmount, items, isShared }) => {
    if (!scopes.has('meffin:write')) return result({ error: 'This connection needs meffin:write permission to save a list.' });
    const viewer = await resolveViewer(userId);
    if (!viewer) return result({ error: 'Account no longer exists' });
    if (isShared && viewer.userIds.length === 1) return result({ error: 'No budget partner is linked to this account.' });
    const [existing] = await db.select({ listId: mcpActionReceipts.listId })
      .from(mcpActionReceipts).where(and(eq(mcpActionReceipts.userId, userId),
        eq(mcpActionReceipts.clientId, clientId), eq(mcpActionReceipts.requestId, requestId))).limit(1);
    if (existing) return result({ id: existing.listId, url: `${origin}/lists/${existing.listId}`, alreadyCreated: true });

    const listId = crypto.randomUUID();
    try {
      await db.transaction(async (tx) => {
        await tx.insert(lists).values({ id: listId, userId, createdBy: userId, title,
          description: description || null, categoryId: 'default_groceries', color: '#EF4444',
          budgetAmount: budgetAmount === undefined ? null : budgetAmount.toFixed(2), isShared });
        await tx.insert(listItems).values(items.map((item) => ({ id: crypto.randomUUID(), listId,
          createdBy: userId, name: item.name, categoryId: 'default_groceries',
          estimatedPrice: item.estimatedPrice === undefined ? null : item.estimatedPrice.toFixed(2),
        })));
        await tx.insert(mcpActionReceipts).values({ id: crypto.randomUUID(), userId, clientId, requestId, listId });
      });
    } catch (error) {
      const [retry] = await db.select({ listId: mcpActionReceipts.listId })
        .from(mcpActionReceipts).where(and(eq(mcpActionReceipts.userId, userId),
          eq(mcpActionReceipts.clientId, clientId), eq(mcpActionReceipts.requestId, requestId))).limit(1);
      if (retry) return result({ id: retry.listId, url: `${origin}/lists/${retry.listId}`, alreadyCreated: true });
      throw error;
    }
    return result({ id: listId, url: `${origin}/lists/${listId}`, title, budgetAmount: budgetAmount ?? null,
      estimatedTotal: items.reduce((sum, item) => sum + Math.round((item.estimatedPrice || 0) * 100), 0) / 100,
      itemCount: items.length, isShared, alreadyCreated: false });
  });

  return server;
}
