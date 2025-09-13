import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// In development, disable connection pooling to prevent schema caching
const isDev = process.env.NODE_ENV === 'development';

const connection = postgres(process.env.DATABASE_URL, {
  // Disable connection pooling in development
  max: isDev ? 1 : undefined,
  // Force new connections in development
  idle_timeout: isDev ? 1 : undefined,
  // Disable prepared statements in development to prevent caching
  prepare: !isDev,
});

export const db = drizzle(connection, { schema });
