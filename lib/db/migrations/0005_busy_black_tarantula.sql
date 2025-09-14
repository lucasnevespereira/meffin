CREATE TABLE "list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"estimated_price" numeric(10, 2),
	"category_id" text NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp,
	"transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_by" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"category_id" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;