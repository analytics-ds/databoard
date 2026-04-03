-- Databoard D1 Schema
-- All tables include org_id for strict multi-tenant isolation

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS keywords (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  url TEXT,
  search_engine TEXT DEFAULT 'google',
  country TEXT DEFAULT 'FR',
  tags TEXT DEFAULT '[]',
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  cpc REAL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS keyword_history (
  id TEXT PRIMARY KEY,
  keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position INTEGER,
  url TEXT,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  type TEXT DEFAULT 'other',
  keyword TEXT,
  assignee_id TEXT REFERENCES users(id),
  due_date TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  target_keyword TEXT,
  meta_title TEXT,
  meta_description TEXT,
  word_count INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  author_id TEXT REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS backlinks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT,
  source_domain TEXT NOT NULL,
  source_url TEXT,
  target_url TEXT NOT NULL,
  anchor TEXT,
  status TEXT DEFAULT 'domain_to_validate',
  da INTEGER,
  tf INTEGER,
  cf INTEGER,
  dr INTEGER,
  traffic INTEGER,
  price REAL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budget REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info',
  is_read INTEGER DEFAULT 0,
  created_at TEXT
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_keywords_org ON keywords(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_content_org ON content_items(org_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_org ON backlinks(org_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
