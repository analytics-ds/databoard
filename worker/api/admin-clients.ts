import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleAdminClients(request: Request, env: Env): Promise<Response> {
  // Verify auth + admin role
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);
  if (payload.role !== "admin") return jsonResponse({ error: "Accès refusé" }, 403);

  if (request.method === "GET") {
    // Get all clients with their assigned consultants
    const orgs = await env.DB.prepare(
      "SELECT id, name, domain, created_at FROM organizations ORDER BY name"
    ).all();

    const consultants = await env.DB.prepare(
      "SELECT id, name, email, avatar_url FROM users WHERE role = 'consultant'"
    ).all();

    const assignments = await env.DB.prepare(
      `SELECT cc.consultant_id, cc.org_id
       FROM consultant_clients cc`
    ).all();

    return jsonResponse({
      organizations: orgs.results || [],
      consultants: consultants.results || [],
      assignments: assignments.results || [],
    });
  }

  if (request.method === "POST") {
    const body = await request.json() as any;
    const { action, consultantId, orgId } = body;

    if (action === "assign") {
      // Assign consultant to client
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(
        "INSERT OR IGNORE INTO consultant_clients (id, consultant_id, org_id, assigned_by, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, consultantId, orgId, payload.userId, now).run();
      return jsonResponse({ success: true });
    }

    if (action === "unassign") {
      // Remove consultant from client
      await env.DB.prepare(
        "DELETE FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
      ).bind(consultantId, orgId).run();
      return jsonResponse({ success: true });
    }

    if (action === "set_role") {
      // Change a user's role (admin only)
      const { userId, role } = body;
      if (!["admin", "consultant", "client", "reader"].includes(role)) {
        return jsonResponse({ error: "Rôle invalide" }, 400);
      }
      await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
