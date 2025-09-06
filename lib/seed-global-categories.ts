import { db } from './db';
import { categories } from './schema';
import { eq } from 'drizzle-orm';

export async function seedGlobalCategories() {
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'income' as const, color: '#10B981' },
    { name: 'Freelance', type: 'income' as const, color: '#3B82F6' },
    { name: 'Investment', type: 'income' as const, color: '#8B5CF6' },
    { name: 'Business', type: 'income' as const, color: '#06B6D4' },
    
    // Expense categories
    { name: 'Groceries', type: 'expense' as const, color: '#EF4444' },
    { name: 'Transportation', type: 'expense' as const, color: '#F59E0B' },
    { name: 'Housing', type: 'expense' as const, color: '#6366F1' },
    { name: 'Utilities', type: 'expense' as const, color: '#EC4899' },
    { name: 'Entertainment', type: 'expense' as const, color: '#14B8A6' },
    { name: 'Healthcare', type: 'expense' as const, color: '#F97316' },
    { name: 'Shopping', type: 'expense' as const, color: '#84CC16' },
    { name: 'Education', type: 'expense' as const, color: '#8B5CF6' },
    { name: 'Insurance', type: 'expense' as const, color: '#6B7280' },
    { name: 'Dining Out', type: 'expense' as const, color: '#F59E0B' },
  ];

  // Check if global categories already exist
  const existingGlobalCategories = await db.select()
    .from(categories)
    .where(eq(categories.isCustom, false))
    .limit(1);

  if (existingGlobalCategories.length === 0) {
    console.log('Seeding global default categories...');
    
    const categoriesToInsert = defaultCategories.map(cat => ({
      id: crypto.randomUUID(),
      userId: null, // Global categories have no userId
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isCustom: false, // These are global default categories
    }));

    await db.insert(categories).values(categoriesToInsert);
    console.log(`Inserted ${categoriesToInsert.length} global categories`);
  } else {
    console.log('Global categories already exist, skipping...');
  }
}