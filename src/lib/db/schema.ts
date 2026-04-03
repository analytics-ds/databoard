import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Users & Auth ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "manager", "editor", "viewer"] }).notNull().default("viewer"),
  image: text("image"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Clients ───────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  logo: text("logo"),
  gscPropertyUrl: text("gsc_property_url"),
  ga4PropertyId: text("ga4_property_id"),
  notes: text("notes").default(""),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Keywords ──────────────────────────────────────────────
export const keywords = sqliteTable("keywords", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  keyword: text("keyword").notNull(),
  url: text("url"),
  searchEngine: text("search_engine", { enum: ["google", "bing", "google_mobile"] }).default("google"),
  country: text("country").default("FR"),
  language: text("language").default("fr"),
  tags: text("tags").default("[]"),
  currentPosition: integer("current_position"),
  previousPosition: integer("previous_position"),
  bestPosition: integer("best_position"),
  searchVolume: integer("search_volume").default(0),
  cpc: real("cpc").default(0),
  competition: real("competition").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const keywordHistory = sqliteTable("keyword_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  keywordId: text("keyword_id").references(() => keywords.id, { onDelete: "cascade" }).notNull(),
  position: integer("position"),
  url: text("url"),
  date: text("date").notNull(),
  features: text("features").default("[]"),
});

// ── Projects & Tasks ──────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status", { enum: ["active", "paused", "completed"] }).default("active"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status", { enum: ["todo", "in_progress", "review", "done"] }).default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  assigneeId: text("assignee_id").references(() => users.id),
  dueDate: text("due_date"),
  order: integer("order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Content ───────────────────────────────────────────────
export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  projectId: text("project_id").references(() => projects.id),
  title: text("title").notNull(),
  slug: text("slug"),
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

// ── Client Documents ──────────────────────────────────────
export const clientDocuments = sqliteTable("client_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  category: text("category", { enum: ["strategy", "technical", "reporting", "other"] }).default("other"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Backlinks ─────────────────────────────────────────────
export const backlinks = sqliteTable("backlinks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  targetUrl: text("target_url").notNull(),
  sourceDomain: text("source_domain").notNull(),
  sourceUrl: text("source_url"),
  anchor: text("anchor"),
  status: text("status", { enum: ["contacted", "negotiation", "published", "rejected"] }).default("contacted"),
  da: integer("da"),
  dr: integer("dr"),
  price: real("price"),
  publishDate: text("publish_date"),
  notes: text("notes"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ── Alerts ────────────────────────────────────────────────
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id),
  type: text("type", { enum: ["position_drop", "position_gain", "crawl_error", "content_due", "custom"] }).notNull(),
  title: text("title").notNull(),
  message: text("message"),
  severity: text("severity", { enum: ["info", "warning", "critical"] }).default("info"),
  isRead: integer("is_read").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
