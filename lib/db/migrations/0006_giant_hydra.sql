-- Recurring transactions become addressable series so future months can be projected.
-- Every step is additive; nothing is deleted and no existing row changes meaning.

-- Safety net. Drop this once the release has been stable for a few weeks.
CREATE TABLE IF NOT EXISTS "transactions_pre_series_backup" AS SELECT * FROM "transactions";--> statement-breakpoint

-- month_key: added nullable, backfilled, then locked down. Derived from the stored
-- wall-clock timestamp so it matches how the existing range queries already bucket rows.
ALTER TABLE "transactions" ADD COLUMN "month_key" integer;--> statement-breakpoint
UPDATE "transactions"
  SET "month_key" = EXTRACT(YEAR FROM "date")::int * 12 + EXTRACT(MONTH FROM "date")::int - 1;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "month_key" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "transactions" ADD COLUMN "series_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "end_month" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "voided" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Monthly recurring rows collapse into series, grouped by the same key the cron used to
-- dedupe on (user, category, description). The earliest occurrence lends its id.
--
-- Two exclusions: rows whose descriptions carry the legacy "(Monthly Budget)" /
-- "(Annual Renewal)" markers are left as one-offs, because the dashboard already filters
-- those strings and turning them into series would make them reappear in totals.
--
-- Where a group somehow holds two rows in the same month (the cron deduped, but manual
-- entry never did), only the earliest joins the series. The other stays a standalone row:
-- still visible, still counted, just not projected.
WITH candidates AS (
  SELECT
    "id", "user_id", "category_id", "description", "month_key", "created_at",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id", "category_id", "description", "month_key"
      ORDER BY "created_at", "id"
    ) AS dup_rank
  FROM "transactions"
  WHERE "is_fixed" = true
    AND ("repeat_type" IS NULL OR "repeat_type" IN ('forever', '3months', '4months', '6months', '12months', 'until'))
    AND "description" NOT LIKE '%(Monthly Budget)%'
    AND "description" NOT LIKE '%(Annual Renewal)%'
),
kept AS (
  SELECT * FROM candidates WHERE dup_rank = 1
),
heads AS (
  SELECT DISTINCT ON ("user_id", "category_id", "description")
    "id" AS head_id, "user_id", "category_id", "description"
  FROM kept
  ORDER BY "user_id", "category_id", "description", "month_key", "created_at", "id"
)
UPDATE "transactions" t
SET "series_id" = h.head_id
FROM kept k
JOIN heads h
  ON h."user_id" = k."user_id"
 AND h."category_id" = k."category_id"
 AND h."description" = k."description"
WHERE t."id" = k."id";--> statement-breakpoint

-- The cron never copied end_date onto the monthly duplicates it created, so the bound
-- survives on whichever rows predate it. Take the furthest one for the whole series.
WITH bounds AS (
  SELECT
    "series_id",
    MAX(EXTRACT(YEAR FROM "end_date")::int * 12 + EXTRACT(MONTH FROM "end_date")::int - 1) AS end_month
  FROM "transactions"
  WHERE "series_id" IS NOT NULL AND "end_date" IS NOT NULL
  GROUP BY "series_id"
)
UPDATE "transactions" t
SET "end_month" = b.end_month
FROM bounds b
WHERE t."series_id" = b."series_id";--> statement-breakpoint

-- Annual transactions were never materialized, so each row is already its own series.
UPDATE "transactions" SET "series_id" = "id"
  WHERE "repeat_type" = 'annual' AND "series_id" IS NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "transactions_series_month_unique" ON "transactions" USING btree ("series_id","month_key") WHERE "transactions"."series_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "transactions_user_month_idx" ON "transactions" USING btree ("user_id","month_key");--> statement-breakpoint

-- NOT VALID: applies to every future write without scanning existing rows, so an
-- unexpected legacy value can't fail the deploy. Validate separately once counted.
ALTER TABLE "transactions" ADD CONSTRAINT "repeat_type_check" CHECK ("transactions"."repeat_type" IS NULL OR "transactions"."repeat_type" IN ('once', 'forever', '3months', '4months', '6months', '12months', 'until', 'annual')) NOT VALID;
