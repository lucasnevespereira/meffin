import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';

type MonthPoint = {
  month: number; // 0-11
  year: number;
  income: number;
  expenses: number;
  balance: number;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const monthsParam = parseInt(url.searchParams.get('months') ?? '');
    const months = Number.isInteger(monthsParam) && monthsParam >= 1 && monthsParam <= 24 ? monthsParam : 12;

    const now = new Date();
    // Oldest bucket starts at the 1st of (now - months + 1)
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [user] = await db
      .select({ id: users.id, partnerId: users.partnerId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userIds = user.partnerId ? [session.user.id, user.partnerId] : [session.user.id];
    // A partner's private transactions never count toward the other partner's view.
    const isVisible = (row: { isPrivate: boolean | null; createdBy: string }) =>
      !(row.isPrivate && row.createdBy !== session.user.id);

    // Non-annual transactions dated within the range
    const monthlyRows = (await db
      .select()
      .from(transactions)
      .where(and(
        or(...userIds.map(id => eq(transactions.userId, id))),
        gte(transactions.date, rangeStart.toISOString()),
        lte(transactions.date, rangeEnd.toISOString())
      ))).filter(row => row.repeatType !== 'annual' && isVisible(row));

    // Annual transactions apply to their renewal month in every year of the range
    const annualRows = (await db
      .select()
      .from(transactions)
      .where(and(
        or(...userIds.map(id => eq(transactions.userId, id))),
        eq(transactions.repeatType, 'annual')
      ))).filter(isVisible);

    // Category type lookup (income vs expense) from defaults + custom
    const customCategories = await db
      .select()
      .from(categories)
      .where(or(...userIds.map(id => eq(categories.userId, id))));

    const categoryType: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach(cat => { categoryType[cat.id] = cat.type; });
    customCategories.forEach(cat => { categoryType[cat.id] = cat.type; });

    // Seed one bucket per month in the range, oldest first
    const buckets: MonthPoint[] = [];
    const indexByKey: Record<string, number> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      buckets.push({ month: d.getMonth(), year: d.getFullYear(), income: 0, expenses: 0, balance: 0 });
      indexByKey[`${d.getFullYear()}-${d.getMonth()}`] = i;
    }

    const apply = (categoryId: string, amount: number, idx: number) => {
      const type = categoryType[categoryId];
      if (type === 'income') buckets[idx].income += amount;
      else if (type === 'expense') buckets[idx].expenses += amount;
    };

    for (const row of monthlyRows) {
      const d = new Date(row.date);
      const idx = indexByKey[`${d.getFullYear()}-${d.getMonth()}`];
      if (idx !== undefined) apply(row.categoryId, Number(row.amount), idx);
    }

    // An annual transaction counts in its renewal month for every year shown,
    // starting from the transaction's original year/month.
    for (const row of annualRows) {
      const renewalDate = new Date(row.date);
      const renewalMonth = renewalDate.getMonth();
      const firstRenewalKey = renewalDate.getFullYear() * 12 + renewalMonth;
      buckets.forEach((bucket, idx) => {
        const bucketKey = bucket.year * 12 + bucket.month;
        if (bucket.month === renewalMonth && bucketKey >= firstRenewalKey) {
          apply(row.categoryId, Number(row.amount), idx);
        }
      });
    }

    buckets.forEach(b => { b.balance = b.income - b.expenses; });

    return NextResponse.json({ history: buckets });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
