import type { organizations, users, keywords, tasks, contentItems, alerts, backlinks, campaigns, invitations } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type Organization = InferSelectModel<typeof organizations>;
export type User = InferSelectModel<typeof users>;
export type Keyword = InferSelectModel<typeof keywords>;
export type Task = InferSelectModel<typeof tasks>;
export type ContentItem = InferSelectModel<typeof contentItems>;
export type Alert = InferSelectModel<typeof alerts>;
export type Backlink = InferSelectModel<typeof backlinks>;
export type Campaign = InferSelectModel<typeof campaigns>;
export type Invitation = InferSelectModel<typeof invitations>;

export type UserRole = "owner" | "admin" | "member" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "done";
export type ContentStatus = "draft" | "writing" | "review" | "published";
export type BacklinkStatus = "domain_to_validate" | "article_writing" | "article_validated" | "published" | "domain_rejected";
export type AlertSeverity = "info" | "warning" | "critical";
