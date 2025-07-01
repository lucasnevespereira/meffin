ALTER TABLE "category" ADD COLUMN "locale" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "type" text DEFAULT 'expense' NOT NULL;