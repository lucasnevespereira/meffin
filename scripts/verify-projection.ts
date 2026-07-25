/**
 * Reconciles the projection engine against the rows already in the database.
 *
 * Run it against a copy of production before and after the 0006 migration. Every past
 * month should come out identical to the cent; the only differences that are allowed to
 * survive are the two bugs the migration fixes, and each one gets looked at by hand.
 *
 *   pnpm exec tsx --env-file=.env.local scripts/verify-projection.ts
 *   pnpm exec tsx --env-file=.env.local scripts/verify-projection.ts --months 24
 */
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { eq, and, inArray, or } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { resolveViewer, getEntries } from '@/lib/services/budget/budget';
import { currentMonthKey, fromKey, MonthKey } from '@/lib/services/budget/keys';

type Totals = { income: number; expenses: number; count: number };

const monthsBack = (() => {
  const flag = process.argv.indexOf('--months');
  const value = flag === -1 ? NaN : parseInt(process.argv[flag + 1] ?? '');
  return Number.isInteger(value) && value > 0 ? value : 36;
})();

const cents = (value: number) => Math.round(value * 100);
const empty = (): Totals => ({ income: 0, expenses: 0, count: 0 });

async function categoryTypes(userIds: string[]): Promise<Record<string, string>> {
  const custom = await db.select().from(categories).where(inArray(categories.userId, userIds));
  const types: Record<string, string> = {};
  for (const cat of DEFAULT_CATEGORIES) types[cat.id] = cat.type;
  for (const cat of custom) types[cat.id] = cat.type;
  return types;
}

/**
 * Reproduces the pre-migration read path: rows dated inside the month, annual rows matched
 * on their renewal month regardless of year, and a partner's private rows left out.
 */
async function legacyTotals(
  viewerId: string,
  userIds: string[],
  types: Record<string, string>,
  from: MonthKey,
  to: MonthKey
): Promise<Map<MonthKey, Totals>> {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(inArray(transactions.userId, userIds), or(eq(transactions.voided, false), eq(transactions.voided, true))));

  const visible = rows.filter(row => !(row.isPrivate && row.createdBy !== viewerId));
  const buckets = new Map<MonthKey, Totals>();

  const add = (key: MonthKey, categoryId: string, amount: number) => {
    if (key < from || key > to) return;
    const bucket = buckets.get(key) ?? empty();
    const type = types[categoryId];
    if (type === 'income') bucket.income += amount;
    else if (type === 'expense') bucket.expenses += amount;
    bucket.count += 1;
    buckets.set(key, bucket);
  };

  for (const row of visible) {
    const amount = Number(row.amount);
    if (row.repeatType === 'annual') {
      const renewal = new Date(row.date);
      const firstKey = renewal.getUTCFullYear() * 12 + renewal.getUTCMonth();
      for (let key = from; key <= to; key++) {
        if (key % 12 === renewal.getUTCMonth() && key >= firstKey) add(key, row.categoryId, amount);
      }
    } else {
      add(row.monthKey, row.categoryId, amount);
    }
  }

  return buckets;
}

async function main() {
  const current = currentMonthKey();
  const from = current - (monthsBack - 1);
  const to = current;

  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  console.log(`Reconciling ${allUsers.length} users across months ${from}..${to} (${monthsBack} months)\n`);

  let mismatches = 0;
  let checked = 0;

  for (const user of allUsers) {
    const viewer = await resolveViewer(user.id);
    if (!viewer) continue;

    const types = await categoryTypes(viewer.userIds);
    const legacy = await legacyTotals(user.id, viewer.userIds, types, from, to);

    // readOnly: the verifier must never write rows of its own.
    const entries = await getEntries(viewer, from, to, { readOnly: true });
    const projected = new Map<MonthKey, Totals>();
    for (const entry of entries) {
      const bucket = projected.get(entry.monthKey) ?? empty();
      const type = types[entry.categoryId];
      if (type === 'income') bucket.income += entry.amount;
      else if (type === 'expense') bucket.expenses += entry.amount;
      bucket.count += 1;
      projected.set(entry.monthKey, bucket);
    }

    for (let key = from; key <= to; key++) {
      const before = legacy.get(key) ?? empty();
      const after = projected.get(key) ?? empty();
      checked += 1;

      if (cents(before.income) === cents(after.income) && cents(before.expenses) === cents(after.expenses)) {
        continue;
      }

      mismatches += 1;
      const { year, month } = fromKey(key);
      console.log(
        `MISMATCH ${user.email} ${year}-${String(month + 1).padStart(2, '0')}\n` +
        `  before: income ${before.income.toFixed(2)} expenses ${before.expenses.toFixed(2)} (${before.count} rows)\n` +
        `  after:  income ${after.income.toFixed(2)} expenses ${after.expenses.toFixed(2)} (${after.count} rows)`
      );
    }
  }

  console.log(`\n${checked} user-months checked, ${mismatches} mismatched.`);
  if (mismatches > 0) {
    console.log('Review each one. Expected causes: bounded series that never stopped, or an');
    console.log('annual transaction that used to show in years before it started.');
  }
  process.exit(mismatches > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
