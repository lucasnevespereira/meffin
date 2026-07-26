-- Built-in categories are identified by stable `default_*` ids. Older releases also
-- created database categories from translated labels, so changing locale (or adding a
-- new built-in category) could expose two identities for the same concept.
--
-- Preserve every affected row before reconciling it. These tables are intentionally
-- unconstrained recovery snapshots and can be dropped after the release is stable.
CREATE TABLE "category_identity_reconciliation_backup" AS
WITH aliases("name", "type", "canonical_category_id") AS (
  VALUES
    ('salary', 'income', 'default_salary'),
    ('salaire', 'income', 'default_salary'),
    ('freelance', 'income', 'default_freelance'),
    ('investment', 'income', 'default_investment'),
    ('investissement', 'income', 'default_investment'),
    ('business', 'income', 'default_business'),
    ('entreprise', 'income', 'default_business'),
    ('groceries', 'expense', 'default_groceries'),
    ('courses', 'expense', 'default_groceries'),
    ('transportation', 'expense', 'default_transportation'),
    ('transport', 'expense', 'default_transportation'),
    ('housing', 'expense', 'default_housing'),
    ('logement', 'expense', 'default_housing'),
    ('utilities', 'expense', 'default_utilities'),
    ('factures', 'expense', 'default_utilities'),
    ('entertainment', 'expense', 'default_entertainment'),
    ('loisirs', 'expense', 'default_entertainment'),
    ('subscriptions', 'expense', 'default_subscriptions'),
    ('abonnements', 'expense', 'default_subscriptions'),
    ('healthcare', 'expense', 'default_healthcare'),
    ('santé', 'expense', 'default_healthcare'),
    ('sante', 'expense', 'default_healthcare'),
    ('shopping', 'expense', 'default_shopping'),
    ('education', 'expense', 'default_education'),
    ('éducation', 'expense', 'default_education'),
    ('insurance', 'expense', 'default_insurance'),
    ('assurance', 'expense', 'default_insurance'),
    ('dining out', 'expense', 'default_dining'),
    ('restaurant', 'expense', 'default_dining')
)
SELECT
  c.*,
  aliases."canonical_category_id"
FROM "categories" c
JOIN aliases
  ON aliases."type" = c."type"
 AND aliases."name" = REGEXP_REPLACE(LOWER(BTRIM(c."name")), '\s+', ' ', 'g');--> statement-breakpoint

CREATE TABLE "transaction_category_identity_backup" AS
SELECT
  t.*,
  b."canonical_category_id"
FROM "transactions" t
JOIN "category_identity_reconciliation_backup" b
  ON b."id" = t."category_id";--> statement-breakpoint

CREATE TABLE "list_category_identity_backup" AS
SELECT
  l.*,
  b."canonical_category_id"
FROM "lists" l
JOIN "category_identity_reconciliation_backup" b
  ON b."id" = l."category_id";--> statement-breakpoint

CREATE TABLE "list_item_category_identity_backup" AS
SELECT
  i.*,
  b."canonical_category_id"
FROM "list_items" i
JOIN "category_identity_reconciliation_backup" b
  ON b."id" = i."category_id";--> statement-breakpoint

UPDATE "transactions" t
SET "category_id" = b."canonical_category_id"
FROM "category_identity_reconciliation_backup" b
WHERE t."category_id" = b."id";--> statement-breakpoint

UPDATE "lists" l
SET "category_id" = b."canonical_category_id"
FROM "category_identity_reconciliation_backup" b
WHERE l."category_id" = b."id";--> statement-breakpoint

UPDATE "list_items" i
SET "category_id" = b."canonical_category_id"
FROM "category_identity_reconciliation_backup" b
WHERE i."category_id" = b."id";--> statement-breakpoint

-- A user may have recreated a recurring transaction after its translated custom
-- category gained a built-in equivalent. Merge only the unambiguous two-series case:
-- overlapping forever-series owned by the same user with the same canonical category,
-- normalized description, amount, and billing day, where at least one series was just
-- remapped.
-- The oldest series remains canonical so its history and stable id survive.
CREATE TABLE "recurring_category_series_merge_backup" AS
WITH series_bounds AS (
  SELECT
    "series_id",
    MIN("month_key") AS "first_month"
  FROM "transactions"
  WHERE "series_id" IS NOT NULL
  GROUP BY "series_id"
),
series_heads AS (
  SELECT DISTINCT ON ("series_id")
    "series_id",
    "user_id",
    "category_id",
    "description",
    "amount",
    "date",
    "repeat_type"
  FROM "transactions"
  WHERE "series_id" IS NOT NULL
    AND "voided" = false
    AND "repeat_type" = 'forever'
  ORDER BY "series_id", "month_key" DESC, "created_at" DESC, "id"
),
ranked AS (
  SELECT
    h."series_id" AS "source_series_id",
    FIRST_VALUE(h."series_id") OVER signature AS "target_series_id",
    b."first_month",
    COUNT(*) OVER signature AS "matching_series"
  FROM series_heads h
  JOIN series_bounds b ON b."series_id" = h."series_id"
  WINDOW signature AS (
    PARTITION BY
      h."user_id",
      h."category_id",
      LOWER(BTRIM(h."description")),
      h."amount",
      EXTRACT(DAY FROM h."date"),
      h."repeat_type"
    ORDER BY b."first_month", h."series_id"
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  )
),
impacted_series AS (
  SELECT DISTINCT "series_id"
  FROM "transaction_category_identity_backup"
  WHERE "series_id" IS NOT NULL
)
SELECT
  r."source_series_id",
  r."target_series_id",
  r."first_month"
FROM ranked r
WHERE r."matching_series" = 2
  AND r."source_series_id" <> r."target_series_id"
  AND EXISTS (
    SELECT 1
    FROM impacted_series i
    WHERE i."series_id" IN (r."source_series_id", r."target_series_id")
  );--> statement-breakpoint

CREATE TABLE "recurring_category_series_rows_backup" AS
SELECT t.*
FROM "transactions" t
JOIN "recurring_category_series_merge_backup" m
  ON m."source_series_id" = t."series_id";--> statement-breakpoint

-- Keep non-overlapping months by moving them onto the canonical series.
UPDATE "transactions" source
SET
  "series_id" = merge."target_series_id",
  "updated_at" = NOW()
FROM "recurring_category_series_merge_backup" merge
WHERE source."series_id" = merge."source_series_id"
  AND source."voided" = false
  AND NOT EXISTS (
    SELECT 1
    FROM "transactions" target
    WHERE target."series_id" = merge."target_series_id"
      AND target."month_key" = source."month_key"
  );--> statement-breakpoint

-- Preserve overlapping rows for recovery but remove them from totals and projection.
-- With no live row left, the duplicate series cannot materialize future occurrences.
UPDATE "transactions" source
SET
  "voided" = true,
  "updated_at" = NOW()
FROM "recurring_category_series_merge_backup" merge
WHERE source."series_id" = merge."source_series_id"
  AND source."voided" = false;--> statement-breakpoint

-- All references now use canonical ids, so the translated duplicate rows are obsolete.
DELETE FROM "categories" c
USING "category_identity_reconciliation_backup" b
WHERE c."id" = b."id";--> statement-breakpoint
