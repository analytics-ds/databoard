-- Add consultant_clients table for many-to-many consultant ↔ client assignment
CREATE TABLE IF NOT EXISTS consultant_clients (
  id TEXT PRIMARY KEY,
  consultant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_consultant_clients_unique ON consultant_clients(consultant_id, org_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_consultant ON consultant_clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_org ON consultant_clients(org_id);

-- Note: users.role now supports: 'admin', 'consultant', 'client', 'reader'
-- 'admin' = Datashake admin, sees all clients, manages assignments
-- 'consultant' = Datashake consultant, sees assigned clients only
-- 'client' = Client account owner (default on register)
-- 'reader' = Invited by client, view-only (no settings access)
