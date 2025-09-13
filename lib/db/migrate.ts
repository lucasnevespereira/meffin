// src/migrate.ts

import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const isLocal = process.env.NODE_ENV === 'development' || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('postgres:5432');

const main = async () => {
  try {
    if (isLocal) {
      // Local PostgreSQL
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const { migrate } = await import('drizzle-orm/postgres-js/migrator');
      const postgres = (await import('postgres')).default;

      const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
      const db = drizzle(sql);

      await migrate(db, { migrationsFolder: 'lib/db/migrations' });
      console.log('Migration completed (PostgreSQL)');
      await sql.end();
    } else {
      // Production Neon
      const { drizzle } = await import('drizzle-orm/neon-http');
      const { neon } = await import('@neondatabase/serverless');
      const { migrate } = await import('drizzle-orm/neon-http/migrator');

      const sql = neon(process.env.DATABASE_URL!);
      const db = drizzle(sql);

      await migrate(db, { migrationsFolder: 'lib/db/migrations' });
      console.log('Migration completed (Neon)');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

main();
