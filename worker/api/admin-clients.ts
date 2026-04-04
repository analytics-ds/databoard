import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleAdminClients(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);
  if (payload.role !== "admin") return jsonResponse({ error: "Accès refusé" }, 403);

  if (request.method === "GET") {
    const orgs = await env.DB.prepare(
      "SELECT id, name, domain, created_at FROM organizations ORDER BY name"
    ).all();

    const users = await env.DB.prepare(
      "SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.org_id, u.created_at, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id ORDER BY u.created_at DESC"
    ).all();

    const assignments = await env.DB.prepare(
      "SELECT cc.consultant_id, cc.org_id FROM consultant_clients cc"
    ).all();

    const blockedEmails = await env.DB.prepare(
      "SELECT be.id, be.email, be.reason, be.created_at, u.name as blocked_by_name FROM blocked_emails be LEFT JOIN users u ON be.blocked_by = u.id ORDER BY be.created_at DESC"
    ).all();

    return jsonResponse({
      organizations: orgs.results || [],
      users: users.results || [],
      assignments: assignments.results || [],
      blockedEmails: blockedEmails.results || [],
    });
  }

  if (request.method === "POST") {
    const body = await request.json() as any;
    const { action } = body;

    if (action === "assign") {
      const { consultantId, orgId } = body;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(
        "INSERT OR IGNORE INTO consultant_clients (id, consultant_id, org_id, assigned_by, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, consultantId, orgId, payload.userId, now).run();
      return jsonResponse({ success: true });
    }

    if (action === "unassign") {
      const { consultantId, orgId } = body;
      await env.DB.prepare(
        "DELETE FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
      ).bind(consultantId, orgId).run();
      return jsonResponse({ success: true });
    }

    if (action === "set_role") {
      const { userId, role } = body;
      if (!["admin", "consultant", "client", "reader"].includes(role)) {
        return jsonResponse({ error: "Rôle invalide" }, 400);
      }
      await env.DB.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
        .bind(role, new Date().toISOString(), userId).run();
      return jsonResponse({ success: true });
    }

    if (action === "delete_org") {
      const { orgId, confirmName } = body;
      if (!orgId || !confirmName) return jsonResponse({ error: "Confirmation requise" }, 400);

      // Verify org exists and name matches
      const org = await env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(orgId).first<{ name: string }>();
      if (!org) return jsonResponse({ error: "Organisation introuvable" }, 404);
      if (org.name !== confirmName) return jsonResponse({ error: "Le nom ne correspond pas" }, 400);

      // Don't allow deleting the datashake org
      if (orgId === "org-datashake") return jsonResponse({ error: "Impossible de supprimer l'organisation datashake" }, 403);

      // Detach users from the org (don't delete them — they just lose access)
      await env.DB.prepare("UPDATE users SET org_id = 'org-datashake' WHERE org_id = ? AND role IN ('client', 'reader')")
        .bind(orgId).run();

      // Remove consultant assignments for this org
      await env.DB.prepare("DELETE FROM consultant_clients WHERE org_id = ?").bind(orgId).run();

      // Now delete the org (CASCADE cleans up keywords, tasks, content, etc. but NOT users)
      await env.DB.prepare("DELETE FROM organizations WHERE id = ?").bind(orgId).run();
      return jsonResponse({ success: true, deleted: org.name });
    }

    if (action === "delete_user") {
      const { userId, blockEmail } = body;
      if (!userId) return jsonResponse({ error: "userId requis" }, 400);

      // Can't delete yourself
      if (userId === payload.userId) return jsonResponse({ error: "Impossible de supprimer votre propre compte" }, 400);

      const user = await env.DB.prepare("SELECT email, name FROM users WHERE id = ?").bind(userId).first<{ email: string; name: string }>();
      if (!user) return jsonResponse({ error: "Utilisateur introuvable" }, 404);

      // Block email if requested
      if (blockEmail) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO blocked_emails (id, email, blocked_by, reason, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, user.email, payload.userId, `Compte supprimé (${user.name})`, now).run();
      }

      // Remove consultant assignments
      await env.DB.prepare("DELETE FROM consultant_clients WHERE consultant_id = ?").bind(userId).run();

      // Delete user
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

      return jsonResponse({ success: true, deleted: user.email, blocked: !!blockEmail });
    }

    if (action === "block_email") {
      const { email, reason } = body;
      if (!email) return jsonResponse({ error: "Email requis" }, 400);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(
        "INSERT OR IGNORE INTO blocked_emails (id, email, blocked_by, reason, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, email.toLowerCase(), payload.userId, reason || "Bloqué manuellement", now).run();
      return jsonResponse({ success: true });
    }

    if (action === "unblock_email") {
      const { email } = body;
      if (!email) return jsonResponse({ error: "Email requis" }, 400);
      await env.DB.prepare("DELETE FROM blocked_emails WHERE email = ?").bind(email.toLowerCase()).run();
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
