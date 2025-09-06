import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

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

    // Get monthly balance
    const balanceQuery = await db.select({
      type: categories.type,
      total: sql<number>`SUM(${transactions.amount}::numeric)`.as('total'),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, session.user.id),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    ))
    .groupBy(categories.type);

    let income = 0;
    let expenses = 0;
    
    for (const row of balanceQuery) {
      if (row.type === 'income') {
        income = Number(row.total) || 0;
      } else if (row.type === 'expense') {
        expenses = Number(row.total) || 0;
      }
    }

    const balance = income - expenses;

    // Get category breakdown
    const categorySummary = await db.select({
      categoryId: categories.id,
      categoryName: categories.name,
      color: categories.color,
      type: categories.type,
      total: sql<number>`SUM(${transactions.amount}::numeric)`.as('total'),
      transactionCount: sql<number>`COUNT(${transactions.id})`.as('count'),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, session.user.id),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    ))
    .groupBy(categories.id, categories.name, categories.color, categories.type)
    .orderBy(sql`SUM(${transactions.amount}::numeric) DESC`);

    const categoryData = categorySummary.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      color: row.color,
      type: row.type,
      total: Number(row.total) || 0,
      transactionCount: Number(row.transactionCount) || 0,
    }));

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