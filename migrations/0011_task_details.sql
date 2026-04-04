-- Enrich tasks with Notion-like properties
ALTER TABLE tasks ADD COLUMN url TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN estimated_days INTEGER;
ALTER TABLE tasks ADD COLUMN end_date TEXT;
