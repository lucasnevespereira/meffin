import { pgTable, varchar, timestamp, decimal, boolean, integer, text, check, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  partnerId: text("partner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Categories table (only for custom user categories)
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Hex color code
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  typeCheck: check('type_check', sql`${table.type} IN ('income', 'expense')`)
}));

// Transactions table
//
// A recurring transaction is a *series*: every occurrence is a real row sharing a
// `seriesId`, and the row with the highest `monthKey` (the head) is what gets
// projected into future months. Past months are therefore always real data, which
// is what lets already-shipped mobile builds keep editing every row they can reach.
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: text('category_id').notNull(), // Can be default ID or custom category ID
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  isFixed: boolean('is_fixed').default(false).notNull(),
  isPrivate: boolean('is_private').default(false),
  repeatType: varchar('repeat_type', { length: 20 }).default('once'), // Store the original repeat type
  endDate: timestamp('end_date', { mode: 'string' }), // For recurring transactions with end date
  // year * 12 + month (UTC), derived from `date`. Month maths runs on this and never
  // on a parsed Date, so timezone and DST drift can't move a row between months.
  monthKey: integer('month_key').notNull(),
  // Null for one-off transactions. The first occurrence of a series points at itself.
  seriesId: text('series_id'),
  // Inclusive last month of a series. Null means forever. Authoritative on the head.
  endMonth: integer('end_month'),
  // Soft-delete for a series occurrence: keeps the deletion from being undone by the
  // next materialization pass. One-off transactions are still deleted outright.
  voided: boolean('voided').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  repeatTypeCheck: check(
    'repeat_type_check',
    sql`${table.repeatType} IS NULL OR ${table.repeatType} IN ('once', 'forever', '3months', '4months', '6months', '12months', 'until', 'annual')`
  ),
  // One occurrence per series per month. Also makes materialization idempotent under
  // concurrent reads via ON CONFLICT DO NOTHING.
  seriesMonthUnique: uniqueIndex('transactions_series_month_unique')
    .on(table.seriesId, table.monthKey)
    .where(sql`${table.seriesId} IS NOT NULL`),
  userMonthIdx: index('transactions_user_month_idx').on(table.userId, table.monthKey),
}));


// Shopping lists table
export const lists = pgTable('lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6').notNull(), // Default blue color
  categoryId: text('category_id'), // Default category for items in this list
  isShared: boolean('is_shared').default(false).notNull(), // Shared with partner
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// Shopping list items table
export const listItems = pgTable('list_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').references(() => lists.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
  categoryId: text('category_id').notNull(), // Can be default ID or custom category ID
  isChecked: boolean('is_checked').default(false).notNull(),
  checkedAt: timestamp('checked_at', { mode: 'string' }), // When item was checked
  transactionId: text('transaction_id').references(() => transactions.id, { onDelete: 'set null' }), // Link to created transaction
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// Partner invitations table
export const partnerInvitations = pgTable('partner_invitations', {
  id: text('id').primaryKey(),
  fromUserId: text('from_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  toUserId: text('to_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusCheck: check('status_check', sql`${table.status} IN ('pending', 'accepted', 'declined', 'expired')`),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  partner: one(users, {
    fields: [users.partnerId],
    references: [users.id],
  }),
  categories: many(categories),
  transactions: many(transactions),
  lists: many(lists),
  listItems: many(listItems),
  sentInvitations: many(partnerInvitations, { relationName: 'invitationSender' }),
  receivedInvitations: many(partnerInvitations, { relationName: 'invitationReceiver' }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [lists.createdBy],
    references: [users.id],
    relationName: 'listCreator',
  }),
  items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, {
    fields: [listItems.listId],
    references: [lists.id],
  }),
  createdBy: one(users, {
    fields: [listItems.createdBy],
    references: [users.id],
    relationName: 'itemCreator',
  }),
  transaction: one(transactions, {
    fields: [listItems.transactionId],
    references: [transactions.id],
  }),
}));

export const partnerInvitationsRelations = relations(partnerInvitations, ({ one }) => ({
  fromUser: one(users, {
    fields: [partnerInvitations.fromUserId],
    references: [users.id],
    relationName: 'invitationSender',
  }),
  toUser: one(users, {
    fields: [partnerInvitations.toUserId],
    references: [users.id],
    relationName: 'invitationReceiver',
  }),
}));
