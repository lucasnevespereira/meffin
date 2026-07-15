import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const runMigrate = async () => {
  // Preview deployments should validate and build the application without
  // mutating the shared production database. Production and local builds keep
  // the existing migration behavior.
  if (process.env.VERCEL_ENV === "preview") {
    console.log("Skipping database migrations for Vercel Preview deployment.");
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "lib/db/migrations" });

  console.log("Migrations completed!");

  await sql.end();
};

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
