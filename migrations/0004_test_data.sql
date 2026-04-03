-- Test data: clients + consultants
-- Password for all test accounts: Test1234! (hashed with PBKDF2)

-- Client organizations
INSERT OR IGNORE INTO organizations (id, name, domain, created_at, updated_at) VALUES
  ('org-quitoque', 'Quitoque', 'quitoque.fr', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('org-strapon', 'Strap on Me', 'straponme.com', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('org-1969', '1969', '1969.fr', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('org-tls', 'The Last Step', 'thelaststep.fr', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('org-izac', 'Izac', 'izac.fr', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('org-celio', 'Celio', 'celio.com', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z');

-- Client users (one per org)
INSERT OR IGNORE INTO users (id, org_id, name, email, password_hash, role, created_at, updated_at) VALUES
  ('user-quitoque', 'org-quitoque', 'Sophie Martin', 'sophie@quitoque.fr', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('user-strapon', 'org-strapon', 'Lucas Bernard', 'lucas@straponme.com', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('user-1969', 'org-1969', 'Emma Petit', 'emma@1969.fr', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('user-tls', 'org-tls', 'Hugo Roux', 'hugo@thelaststep.fr', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('user-izac', 'org-izac', 'Léa Moreau', 'lea@izac.fr', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z'),
  ('user-celio', 'org-celio', 'Nathan Dubois', 'nathan@celio.com', 'DEMO_HASH', 'client', '2026-04-03T20:00:00Z', '2026-04-03T20:00:00Z');
