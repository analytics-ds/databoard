import type { users, clients, keywords, projects, tasks, contentItems, alerts, backlinks } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;
export type Client = InferSelectModel<typeof clients>;
export type Keyword = InferSelectModel<typeof keywords>;
export type Project = InferSelectModel<typeof projects>;
export type Task = InferSelectModel<typeof tasks>;
export type ContentItem = InferSelectModel<typeof contentItems>;
export type Alert = InferSelectModel<typeof alerts>;
export type Backlink = InferSelectModel<typeof backlinks>;

export type UserRole = "admin" | "manager" | "editor" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ContentStatus = "draft" | "writing" | "review" | "published";
export type BacklinkStatus = "contacted" | "negotiation" | "published" | "rejected";
export type AlertSeverity = "info" | "warning" | "critical";
