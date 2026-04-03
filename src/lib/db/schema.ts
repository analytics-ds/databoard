import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Organizations (1 org = 1 client account) ──────────────
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  domain: text("domain"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Users ─────────────────────────────────────────────────
// Every user belongs to exactly one organization.
// orgId is ALWAYS used to scope data access (multi-tenant isolation).
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "admin", "member", "viewer"] }).notNull().default("member"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Invitations ───────────────────────────────────────────
export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "member", "viewer"] }).notNull().default("member"),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").references(() => users.id).notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ── Keywords ──────────────────────────────────────────────
// ALL data tables include orgId for strict tenant isolation.
// Queries MUST always filter by orgId from the authenticated session.
export const keywords = sqliteTable("keywords", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  keyword: text("keyword").notNull(),
  url: text("url"),
  searchEngine: text("search_engine", { enum: ["google", "google_mobile", "bing"] }).default("google"),
  country: text("country").default("FR"),
  tags: text("tags").default("[]"),
  currentPosition: integer("current_position"),
  previousPosition: integer("previous_position"),
  bestPosition: integer("best_position"),
  searchVolume: integer("search_volume").default(0),
  cpc: real("cpc").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const keywordHistory = sqliteTable("keyword_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  keywordId: text("keyword_id").references(() => keywords.id, { onDelete: "cascade" }).notNull(),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  position: integer("position"),
  url: text("url"),
  date: text("date").notNull(),
});

// ── Projects & Tasks ──────────────────────────────────────
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo"),
  type: text("type", { enum: ["content", "netlinking", "technique", "audit", "other"] }).default("other"),
  keyword: text("keyword"),
  assigneeId: text("assignee_id").references(() => users.id),
  dueDate: text("due_date"),
  order: integer("order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Content ───────────────────────────────────────────────
export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  body: text("body").default(""),
  status: text("status", { enum: ["draft", "writing", "review", "published"] }).default("draft"),
  targetKeyword: text("target_keyword"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  wordCount: integer("word_count").default(0),
  seoScore: integer("seo_score").default(0),
  authorId: text("author_id").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Backlinks ─────────────────────────────────────────────
export const backlinks = sqliteTable("backlinks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  keyword: text("keyword"),
  sourceDomain: text("source_domain").notNull(),
  sourceUrl: text("source_url"),
  targetUrl: text("target_url").notNull(),
  anchor: text("anchor"),
  status: text("status", { enum: ["domain_to_validate", "article_writing", "article_validated", "published", "domain_rejected"] }).default("domain_to_validate"),
  da: integer("da"),
  tf: integer("tf"),
  cf: integer("cf"),
  dr: integer("dr"),
  traffic: integer("traffic"),
  price: real("price"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Campaigns ─────────────────────────────────────────────
export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  budget: real("budget").default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status", { enum: ["active", "completed", "late"] }).default("active"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ── Alerts ────────────────────────────────────────────────
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: text("type", { enum: ["position_drop", "position_gain", "crawl_error", "content_due", "custom"] }).notNull(),
  title: text("title").notNull(),
  message: text("message"),
  severity: text("severity", { enum: ["info", "warning", "critical"] }).default("info"),
  isRead: integer("is_read").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
