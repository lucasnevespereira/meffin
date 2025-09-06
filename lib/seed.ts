import { db } from './db';
import { users, categories } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDefaultCategories(userId: string) {
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'income' as const, color: '#10B981' },
    { name: 'Freelance', type: 'income' as const, color: '#3B82F6' },
    { name: 'Investment', type: 'income' as const, color: '#8B5CF6' },
    
    // Expense categories
    { name: 'Groceries', type: 'expense' as const, color: '#EF4444' },
    { name: 'Transportation', type: 'expense' as const, color: '#F59E0B' },
    { name: 'Housing', type: 'expense' as const, color: '#6366F1' },
    { name: 'Utilities', type: 'expense' as const, color: '#EC4899' },
    { name: 'Entertainment', type: 'expense' as const, color: '#14B8A6' },
    { name: 'Healthcare', type: 'expense' as const, color: '#F97316' },
    { name: 'Shopping', type: 'expense' as const, color: '#84CC16' },
  ];

  // Check if user already has categories
  const existingCategories = await db.select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existingCategories.length === 0) {
    // Insert default categories
    const categoriesToInsert = defaultCategories.map(cat => ({
      id: crypto.randomUUID(),
      userId,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isDefault: true,
    }));

    await db.insert(categories).values(categoriesToInsert);
  }
}