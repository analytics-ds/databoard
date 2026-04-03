-- Per-org integrations (GSC, GA4, Haloscan, Meteoria, etc.)
CREATE TABLE IF NOT EXISTS org_integrations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'gsc', 'ga4', 'haloscan', 'meteoria'
  config TEXT DEFAULT '{}', -- JSON: credentials, property IDs, API keys, etc.
  enabled INTEGER DEFAULT 1,
  connected_by TEXT REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(org_id, type)
);

CREATE INDEX IF NOT EXISTS idx_org_integrations_org ON org_integrations(org_id);
