-- Add contacts, notes, and created_by to organizations
-- contacts: JSON array of contact objects [{name, role, email, phone}]
-- notes: free-text general information visible to all team members
-- created_by: tracks the original project creator (principal owner)

ALTER TABLE organizations ADD COLUMN contacts TEXT DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN notes TEXT DEFAULT '';
ALTER TABLE organizations ADD COLUMN created_by TEXT REFERENCES users(id);
