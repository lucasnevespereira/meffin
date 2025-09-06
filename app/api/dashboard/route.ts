import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { DEFAULT_CATEGORY_IDS } from '@/lib/default-categories';

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

    // Default categories lookup
    const defaultCategories = {
      [DEFAULT_CATEGORY_IDS.salary]: { id: DEFAULT_CATEGORY_IDS.salary, name: 'Salary', type: 'income', color: '#10B981' },
      [DEFAULT_CATEGORY_IDS.freelance]: { id: DEFAULT_CATEGORY_IDS.freelance, name: 'Freelance', type: 'income', color: '#3B82F6' },
      [DEFAULT_CATEGORY_IDS.investment]: { id: DEFAULT_CATEGORY_IDS.investment, name: 'Investment', type: 'income', color: '#8B5CF6' },
      [DEFAULT_CATEGORY_IDS.business]: { id: DEFAULT_CATEGORY_IDS.business, name: 'Business', type: 'income', color: '#06B6D4' },
      [DEFAULT_CATEGORY_IDS.groceries]: { id: DEFAULT_CATEGORY_IDS.groceries, name: 'Groceries', type: 'expense', color: '#EF4444' },
      [DEFAULT_CATEGORY_IDS.transportation]: { id: DEFAULT_CATEGORY_IDS.transportation, name: 'Transportation', type: 'expense', color: '#F59E0B' },
      [DEFAULT_CATEGORY_IDS.housing]: { id: DEFAULT_CATEGORY_IDS.housing, name: 'Housing', type: 'expense', color: '#6366F1' },
      [DEFAULT_CATEGORY_IDS.utilities]: { id: DEFAULT_CATEGORY_IDS.utilities, name: 'Utilities', type: 'expense', color: '#EC4899' },
      [DEFAULT_CATEGORY_IDS.entertainment]: { id: DEFAULT_CATEGORY_IDS.entertainment, name: 'Entertainment', type: 'expense', color: '#14B8A6' },
      [DEFAULT_CATEGORY_IDS.healthcare]: { id: DEFAULT_CATEGORY_IDS.healthcare, name: 'Healthcare', type: 'expense', color: '#F97316' },
      [DEFAULT_CATEGORY_IDS.shopping]: { id: DEFAULT_CATEGORY_IDS.shopping, name: 'Shopping', type: 'expense', color: '#84CC16' },
      [DEFAULT_CATEGORY_IDS.education]: { id: DEFAULT_CATEGORY_IDS.education, name: 'Education', type: 'expense', color: '#8B5CF6' },
      [DEFAULT_CATEGORY_IDS.insurance]: { id: DEFAULT_CATEGORY_IDS.insurance, name: 'Insurance', type: 'expense', color: '#6B7280' },
      [DEFAULT_CATEGORY_IDS.dining]: { id: DEFAULT_CATEGORY_IDS.dining, name: 'Dining Out', type: 'expense', color: '#F59E0B' },
    };

    // Create category lookup
    const categoryLookup = { ...defaultCategories };
    customCategories.forEach(cat => {
      categoryLookup[cat.id] = cat;
    });

    // Calculate balance and category breakdown
    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, { categoryId: string; categoryName: string; color: string; type: string; total: number; transactionCount: number }> = {};

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
          categoryName: category.name,
          color: category.color,
          type: category.type,
          total: 0,
          transactionCount: 0,
        };
      }
      categoryTotals[transaction.categoryId].total += amount;
      categoryTotals[transaction.categoryId].transactionCount += 1;
    });

    const balance = income - expenses;
    const categoryData = Object.values(categoryTotals)
      .filter(cat => cat.type === 'expense') // Only show expenses in breakdown
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