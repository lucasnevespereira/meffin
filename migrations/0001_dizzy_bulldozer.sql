ALTER TABLE "category" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;