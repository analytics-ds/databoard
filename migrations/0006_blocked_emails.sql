CREATE TABLE IF NOT EXISTS blocked_emails (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  blocked_by TEXT REFERENCES users(id),
  reason TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_email ON blocked_emails(email);
