-- Weekly To-do lists (one per week per org)
CREATE TABLE IF NOT EXISTS weekly_todos (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  week_date TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_weekly_todos_org ON weekly_todos(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_todos_org_week ON weekly_todos(org_id, week_date);

-- Individual to-do items within a weekly to-do
CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL REFERENCES weekly_todos(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  assigned_to TEXT NOT NULL DEFAULT 'client',
  linked_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  "order" INTEGER DEFAULT 0,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_todo_items_todo ON todo_items(todo_id);

-- Meeting reports / comptes rendus
CREATE TABLE IF NOT EXISTS meeting_reports (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration TEXT,
  report_url TEXT,
  notes TEXT DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_meeting_reports_org ON meeting_reports(org_id);

-- Work documents (links to external docs: audit, roadmap, etc.)
CREATE TABLE IF NOT EXISTS work_documents (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_work_documents_org ON work_documents(org_id);

-- Resources / guides (help files for clients)
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT DEFAULT '',
  url TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_resources_org ON resources(org_id);
