-- Enrich todo_items with description and attachments
ALTER TABLE todo_items ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE todo_items ADD COLUMN attachments TEXT DEFAULT '[]';

-- Add category to tasks for multi-type kanban filtering
-- status values: brief_prep, brief_done, review, done
ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'content';

-- Files table for R2 uploads (used across todos, meetings, etc.)
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_files_org ON files(org_id);
