import { pgTable, varchar, timestamp, decimal, boolean, integer, text, check, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
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

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
  alg: text("alg"),
  crv: text("crv"),
});

export const oauthClient = pgTable(
  "oauth_client",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientDiscoveryId: text("client_discovery_id"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: text("subject_type"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("client_credentials_scopes")
      .array()
      .default([]),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    backchannelLogoutSessionRequired: boolean(
      "backchannel_logout_session_required",
    ),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    applicationType: text("application_type"),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    grantTypes: text("grant_types").array(),
    responseTypes: text("response_types").array(),
    requirePKCE: boolean("require_pkce"),
    dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauthClient_userId_idx").on(table.userId)],
);

export const oauthResource = pgTable("oauth_resource", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: integer("access_token_ttl"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  allowedScopes: text("allowed_scopes").array(),
  customClaims: jsonb("custom_claims"),
  dpopBoundAccessTokensRequired: boolean(
    "dpop_bound_access_tokens_required",
  ).default(false),
  disabled: boolean("disabled").default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  policyVersion: integer("policy_version").default(1),
  metadata: jsonb("metadata"),
});

export const oauthClientResource = pgTable(
  "oauth_client_resource",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResource.identifier, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("oauthClientResource_clientId_idx").on(table.clientId),
    index("oauthClientResource_resourceId_idx").on(table.resourceId),
    uniqueIndex("oauth_client_resource_pair_unique").on(table.clientId, table.resourceId),
  ],
);

export const oauthRefreshToken = pgTable(
  "oauth_refresh_token",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    revoked: timestamp("revoked"),
    rotatedAt: timestamp("rotated_at"),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: timestamp("rotation_replay_expires_at"),
    authTime: timestamp("auth_time"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthRefreshToken_clientId_idx").on(table.clientId),
    index("oauthRefreshToken_sessionId_idx").on(table.sessionId),
    index("oauthRefreshToken_userId_idx").on(table.userId),
    index("oauthRefreshToken_authorizationCodeId_idx").on(
      table.authorizationCodeId,
    ),
  ],
);

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: text("id").primaryKey(),
    token: text("token").unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: text("refresh_id").references(() => oauthRefreshToken.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    revoked: timestamp("revoked"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthAccessToken_clientId_idx").on(table.clientId),
    index("oauthAccessToken_sessionId_idx").on(table.sessionId),
    index("oauthAccessToken_userId_idx").on(table.userId),
    index("oauthAccessToken_authorizationCodeId_idx").on(
      table.authorizationCodeId,
    ),
    index("oauthAccessToken_refreshId_idx").on(table.refreshId),
  ],
);

export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("oauthConsent_clientId_idx").on(table.clientId),
    index("oauthConsent_userId_idx").on(table.userId),
  ],
);

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});


// Categories table (only for custom user categories)
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Hex color code
  archivedAt: timestamp('archived_at'),
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
  // year * 12 + month, derived from `date`. Month maths runs on this and never on a
  // parsed Date, so timezone and DST drift can't move a row between months.
  //
  // Postgres computes it, for three reasons: it can never drift out of step with `date`;
  // nothing has to remember to set it on insert; and because migrations run at build time
  // while the previous deployment is still serving, a column the old code doesn't know
  // about would otherwise fail every insert until the new code went live.
  monthKey: integer('month_key')
    .generatedAlwaysAs(
      sql`EXTRACT(YEAR FROM "date")::int * 12 + EXTRACT(MONTH FROM "date")::int - 1`
    )
    .notNull(),
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
  budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }),
  color: varchar('color', { length: 7 }).default('#3B82F6').notNull(), // Default blue color
  categoryId: text('category_id'), // Default category for items in this list
  isShared: boolean('is_shared').default(false).notNull(), // Shared with partner
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// One result per user/client/request ID, so a retried MCP write cannot create another list.
export const mcpActionReceipts = pgTable('mcp_action_receipts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: text('client_id').notNull(),
  requestId: text('request_id').notNull(),
  listId: text('list_id').references(() => lists.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueRequest: uniqueIndex('mcp_action_receipts_request_unique').on(table.userId, table.clientId, table.requestId),
}));

// Invalidates JWTs immediately when a user disconnects an AI client.
export const mcpClientRevocations = pgTable('mcp_client_revocations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: text('client_id').notNull(),
  revokedAt: timestamp('revoked_at').notNull(),
}, (table) => ({
  uniqueClient: uniqueIndex('mcp_client_revocations_user_client_unique').on(table.userId, table.clientId),
}));

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
