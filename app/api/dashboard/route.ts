import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
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

    // Get all user transactions for the month
    const userTransactions = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, session.user.id),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      ));

    // Get custom categories
    const customCategories = await db.select()
      .from(categories)
      .where(eq(categories.userId, session.user.id));

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
      const amount = Number(transaction.amount);
      const category = categoryLookup[transaction.categoryId];

      if (!category) return;

      if (category.type === 'income') {
        income += amount;
      } else if (category.type === 'expense') {
        expenses += amount;
      }

      // Update category totals
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
