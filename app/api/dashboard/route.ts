import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '@/lib/default-categories';
import { Category } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().getMonth().toString();
    const year = url.searchParams.get('year') || new Date().getFullYear().toString();

    const startDate = new Date(parseInt(year), parseInt(month), 1);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59);

    // Get user and partner ID
    const user = await db.select({
      id: users.id,
      partnerId: users.partnerId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get transactions from user and partner
    const userIds = user[0].partnerId ? [session.user.id, user[0].partnerId] : [session.user.id];

    // Get regular transactions for this month (EXCLUDING annual transactions)
    const monthlyTransactions = await db.select()
      .from(transactions)
      .where(and(
        or(...userIds.map(id => eq(transactions.userId, id))),
        gte(transactions.date, startDate.toISOString()),
        lte(transactions.date, endDate.toISOString()),
        // Exclude annual transactions from monthly query to prevent duplication
        or(
          eq(transactions.repeatType, 'once'),
          eq(transactions.repeatType, 'forever'), 
          eq(transactions.repeatType, '3months'),
          eq(transactions.repeatType, '4months'),
          eq(transactions.repeatType, '6months'),
          eq(transactions.repeatType, '12months'),
          eq(transactions.repeatType, 'until')
        )
      ));

    // Get annual transactions that should appear in this month
    const annualTransactions = await db.select()
      .from(transactions)
      .where(and(
        or(...userIds.map(id => eq(transactions.userId, id))),
        eq(transactions.repeatType, 'annual')
      ));

    // Filter annual transactions to only include ones that renew in current month
    const currentMonthAnnuals = annualTransactions.filter(annual => {
      const annualDate = new Date(annual.date);
      return annualDate.getMonth() === parseInt(month);
    });

    // Combine monthly and applicable annual transactions
    const userTransactions = [...monthlyTransactions, ...currentMonthAnnuals];

    // Get custom categories from user and partner
    const customCategories = await db.select()
      .from(categories)
      .where(or(...userIds.map(id => eq(categories.userId, id))));

    // Create category lookup with default categories
    const categoryLookup: Record<string, Category> = {};

    // Add default categories
    DEFAULT_CATEGORIES.forEach(cat => {
      categoryLookup[cat.id] = {
        id: cat.id,
        name: cat.name, // This is the i18n key
        type: cat.type,
        color: cat.color,
        isCustom: false,
        userId: null,
        createdAt: undefined,
      };
    });

    // Add custom categories
    customCategories.forEach(cat => {
      categoryLookup[cat.id] = {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isCustom: true,
        userId: cat.userId,
        createdAt: cat.createdAt,
      };
    });

    // Calculate balance and category breakdown
    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, { categoryId: string; category: Category; total: number; transactionCount: number }> = {};

    userTransactions.forEach(transaction => {
      // Filter out old generated transactions from previous cron logic
      if (transaction.description.includes('(Monthly Budget)') || 
          transaction.description.includes('(Annual Renewal)')) {
        return;
      }

      const amount = Number(transaction.amount);
      const category = categoryLookup[transaction.categoryId];

      if (!category) return;

      if (category.type === 'income') {
        income += amount;
      } else if (category.type === 'expense') {
        expenses += amount;
      }

      // Update category totals (only for actual transactions, not generated ones)
      if (!categoryTotals[transaction.categoryId]) {
        categoryTotals[transaction.categoryId] = {
          categoryId: transaction.categoryId,
          category: category,
          total: 0,
          transactionCount: 0,
        };
      }
      categoryTotals[transaction.categoryId].total += amount;
      categoryTotals[transaction.categoryId].transactionCount += 1;
    });

    const balance = income - expenses;
    const categoryData = Object.values(categoryTotals)
      .filter(cat => cat.category.type === 'expense') // Only show expenses in breakdown
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      balance: {
        balance,
        income,
        expenses,
      },
      categoryBreakdown: categoryData,
      month: parseInt(month),
      year: parseInt(year),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
