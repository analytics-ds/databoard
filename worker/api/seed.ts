import type { Env } from "../index";
import { hashPassword, jsonResponse } from "../utils";

// Temporary endpoint to seed test data. Remove in production.
export async function handleSeed(request: Request, env: Env): Promise<Response> {
  const now = new Date().toISOString();
  const testPassword = await hashPassword("Test1234!");

  // Create datashake org (for consultants + admin)
  await env.DB.prepare(
    "INSERT OR IGNORE INTO organizations (id, name, domain, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  ).bind("org-datashake", "datashake", "datashake.fr", now, now).run();

  // Client organizations
  const clients = [
    { id: "org-quitoque", name: "Quitoque", domain: "quitoque.fr", user: "Sophie Martin", email: "sophie@quitoque.fr" },
    { id: "org-strapon", name: "Strap on Me", domain: "straponme.com", user: "Lucas Bernard", email: "lucas@straponme.com" },
    { id: "org-1969", name: "1969", domain: "1969.fr", user: "Emma Petit", email: "emma@1969.fr" },
    { id: "org-tls", name: "The Last Step", domain: "thelaststep.fr", user: "Hugo Roux", email: "hugo@thelaststep.fr" },
    { id: "org-izac", name: "Izac", domain: "izac.fr", user: "Léa Moreau", email: "lea@izac.fr" },
    { id: "org-celio", name: "Celio", domain: "celio.com", user: "Nathan Dubois", email: "nathan@celio.com" },
  ];

  for (const c of clients) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO organizations (id, name, domain, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(c.id, c.name, c.domain, now, now).run();

    await env.DB.prepare(
      "INSERT OR IGNORE INTO users (id, org_id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(`user-${c.id}`, c.id, c.user, c.email, testPassword, "client", now, now).run();
  }

  // Consultant users (belong to datashake org)
  const consultants = [
    { id: "user-manon", name: "Manon Lefevre", email: "manon@datashake.fr" },
    { id: "user-theo", name: "Théo Garnier", email: "theo@datashake.fr" },
    { id: "user-valentin", name: "Valentin Morel", email: "valentin@datashake.fr" },
  ];

  for (const c of consultants) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO users (id, org_id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(c.id, "org-datashake", c.name, c.email, testPassword, "consultant", now, now).run();
  }

  // Assign some consultants to clients
  const assignments = [
    { consultant: "user-manon", orgs: ["org-quitoque", "org-strapon", "org-1969"] },
    { consultant: "user-theo", orgs: ["org-tls", "org-izac", "org-celio"] },
    { consultant: "user-valentin", orgs: ["org-quitoque", "org-celio"] },
  ];

  for (const a of assignments) {
    for (const orgId of a.orgs) {
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT OR IGNORE INTO consultant_clients (id, consultant_id, org_id, assigned_by, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, a.consultant, orgId, "user-manon", now).run();
    }
  }

  return jsonResponse({
    success: true,
    created: {
      organizations: clients.length + 1,
      clientUsers: clients.length,
      consultants: consultants.length,
      assignments: assignments.reduce((acc, a) => acc + a.orgs.length, 0),
    },
    testCredentials: {
      password: "Test1234!",
      consultants: consultants.map(c => c.email),
      clients: clients.map(c => c.email),
    },
  });
}
