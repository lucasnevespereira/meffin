/**
 * Fills a local account with a year of plausible budget data.
 *
 * Sign in (or sign up) first so the account exists, then:
 *
 *   npm run seed:demo                    # the only account, or the oldest one
 *   npm run seed:demo -- you@example.com # a specific account
 *
 * Replaces that account's transactions — never run it against production.
 */
import { db } from '@/lib/db';
import { transactions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { occurrenceDate, currentMonthKey, fromKey } from '@/lib/services/budget/keys';

const HISTORY_MONTHS = 9;

type SeriesSpec = {
  description: string;
  categoryId: string;
  /** Amount per month, oldest first. A change part-way through shows up as a real
   *  historical amount that later months don't rewrite. */
  amounts: number[];
  day: number;
  repeatType: string;
  /** Months from now the series stops, inclusive. Omitted means it runs forever. */
  endsInMonths?: number;
};

const SERIES: SeriesSpec[] = [
  {
    description: 'Salary',
    categoryId: 'default_salary',
    amounts: Array(HISTORY_MONTHS).fill(3200),
    day: 28,
    repeatType: 'forever',
  },
  {
    description: 'Rent',
    categoryId: 'default_housing',
    // Went up three months ago. Older months keep what was actually paid.
    amounts: [...Array(HISTORY_MONTHS - 3).fill(900), 950, 950, 950],
    day: 5,
    repeatType: 'forever',
  },
  {
    description: 'Internet',
    categoryId: 'default_utilities',
    amounts: Array(HISTORY_MONTHS).fill(29.99),
    day: 15,
    repeatType: 'forever',
  },
  {
    description: 'Netflix',
    categoryId: 'default_subscriptions',
    amounts: Array(HISTORY_MONTHS).fill(13.49),
    day: 20,
    repeatType: 'forever',
  },
  {
    description: 'Gym',
    categoryId: 'default_healthcare',
    // Signed up four months ago for six months, so it stops two months out — the
    // month where a bounded series visibly drops off the forecast.
    amounts: Array(5).fill(39),
    day: 2,
    repeatType: '6months',
    endsInMonths: 2,
  },
];

/** Everyday spending. Deliberately absent from future months: no rule, no projection. */
const VARIABLE: { description: string; categoryId: string; amount: number; day: number }[][] = [
  [
    { description: 'Weekly shop', categoryId: 'default_groceries', amount: 82.4, day: 3 },
    { description: 'Weekly shop', categoryId: 'default_groceries', amount: 61.15, day: 11 },
    { description: 'Dinner out', categoryId: 'default_dining', amount: 46.0, day: 14 },
    { description: 'Metro pass', categoryId: 'default_transportation', amount: 75.0, day: 6 },
  ],
  [
    { description: 'Weekly shop', categoryId: 'default_groceries', amount: 94.2, day: 4 },
    { description: 'Coffee run', categoryId: 'default_dining', amount: 12.8, day: 9 },
    { description: 'Metro pass', categoryId: 'default_transportation', amount: 75.0, day: 6 },
    { description: 'New headphones', categoryId: 'default_shopping', amount: 129.0, day: 22 },
  ],
  [
    { description: 'Weekly shop', categoryId: 'default_groceries', amount: 71.6, day: 5 },
    { description: 'Weekly shop', categoryId: 'default_groceries', amount: 88.35, day: 18 },
    { description: 'Metro pass', categoryId: 'default_transportation', amount: 75.0, day: 6 },
    { description: 'Cinema', categoryId: 'default_entertainment', amount: 24.0, day: 16 },
  ],
];

async function main() {
  const email = process.argv[2];

  const [user] = email
    ? await db.select().from(users).where(eq(users.email, email)).limit(1)
    : await db.select().from(users).orderBy(users.createdAt).limit(1);

  if (!user) {
    console.error(
      email
        ? `No account found for ${email}. Sign up in the app first.`
        : 'No accounts found. Sign up in the app first, then run this again.'
    );
    process.exit(1);
  }

  console.log(`Seeding ${user.email}\n`);

  await db.delete(transactions).where(eq(transactions.userId, user.id));

  const current = currentMonthKey();
  const firstMonth = current - (HISTORY_MONTHS - 1);
  const rows: (typeof transactions.$inferInsert)[] = [];

  const base = (description: string, categoryId: string, amount: number, key: number, day: number) => ({
    id: crypto.randomUUID(),
    userId: user.id,
    createdBy: user.id,
    categoryId,
    description,
    amount: amount.toFixed(2),
    date: occurrenceDate(key, day),
    isPrivate: false,
  });

  // Recurring series: one real row per month, exactly as the app materializes them.
  for (const spec of SERIES) {
    const seriesId = crypto.randomUUID();
    const startsAt = current - (spec.amounts.length - 1);
    const endMonth = spec.endsInMonths === undefined ? null : current + spec.endsInMonths;

    spec.amounts.forEach((amount, index) => {
      const key = startsAt + index;
      rows.push({
        ...base(spec.description, spec.categoryId, amount, key, spec.day),
        id: index === 0 ? seriesId : crypto.randomUUID(),
        isFixed: true,
        repeatType: spec.repeatType,
        endDate: endMonth === null ? null : occurrenceDate(endMonth, spec.day),
        seriesId,
        endMonth,
      });
    });
  }

  // Annual: a single row standing in for every renewal, two months out.
  const renewal = current + 2;
  const annualId = crypto.randomUUID();
  rows.push({
    ...base('Home insurance', 'default_insurance', 420, renewal, 3),
    id: annualId,
    isFixed: true,
    repeatType: 'annual',
    seriesId: annualId,
  });

  // Everyday spending across past months only.
  for (let key = firstMonth; key <= current; key++) {
    for (const item of VARIABLE[(key - firstMonth) % VARIABLE.length]) {
      rows.push({
        ...base(item.description, item.categoryId, item.amount, key, item.day),
        isFixed: false,
        repeatType: 'once',
      });
    }
  }

  // The point of the feature: bills you already know about, dated ahead.
  rows.push({
    ...base('Water bill', 'default_utilities', 118.4, current + 3, 14),
    isFixed: false,
    repeatType: 'once',
  });
  rows.push({
    ...base('Flights to Lisbon', 'default_transportation', 214.0, current + 2, 9),
    isFixed: false,
    repeatType: 'once',
  });

  await db.insert(transactions).values(rows);

  const label = (key: number) => {
    const { year, month } = fromKey(key);
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  console.log(`  ${rows.length} transactions`);
  console.log(`  history      ${label(firstMonth)} → ${label(current)}`);
  console.log(`  planned      ${label(current + 2)} flights, ${label(current + 3)} water bill`);
  console.log(`  annual       renews ${label(renewal)}`);
  console.log(`  gym ends     ${label(current + 2)}`);
  console.log('\nOpen the dashboard and step forward with the month switcher.');
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
