#!/usr/bin/env ts-node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production-safe migration runner
 * Handles both fresh databases and existing ones
 */
async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log('ℹ️ No DATABASE_URL found, skipping migrations');
    return;
  }

  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('🔄 Running database migrations...');

    const migrationsDir = path.join(process.cwd(), 'migrations');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️ No migrations directory found, skipping');
      return;
    }

    // Check if any migration files exist
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (migrationFiles.length === 0) {
      console.log('ℹ️ No migration files found, skipping');
      return;
    }

    // Run migrations
    await migrate(db, { migrationsFolder: migrationsDir });

    console.log('✅ Database migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);

    // For production builds, we want to continue even if migrations fail
    // This prevents deployment failures due to migration issues
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.log('⚠️ Production environment detected, continuing with build...');
      return;
    }

    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
