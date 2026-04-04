import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET  /api/org-details?org_id=xxx  — get contacts and notes for an org
 * PUT  /api/org-details             — update contacts and/or notes
 *
 * Permissions:
 *   - admin: any org
 *   - consultant: assigned orgs
 *   - client: own org
 *   - reader: can read but not edit
 */
export async function handleOrgDetails(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  async function hasAccess(orgId: string): Promise<boolean> {
    if (dbUser.role === "admin") return true;
    if ((dbUser.role === "client" || dbUser.role === "reader") && dbUser.org_id === orgId) return true;
    if (dbUser.role === "consultant") {
      const a = await env.DB.prepare(
        "SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
      ).bind(dbUser.id, orgId).first();
      return !!a;
    }
    return false;
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) return jsonResponse({ error: "org_id requis" }, 400);

    if (!(await hasAccess(orgId))) {
      return jsonResponse({ error: "Accès refusé" }, 403);
    }

    const org = await env.DB.prepare(
      "SELECT contacts, notes FROM organizations WHERE id = ?"
    ).bind(orgId).first<{ contacts: string | null; notes: string | null }>();

    let contacts: any[] = [];
    try { contacts = JSON.parse(org?.contacts || "[]"); } catch { /* */ }

    return jsonResponse({
      contacts,
      notes: org?.notes || "",
    });
  }

  if (request.method === "PUT") {
    // Readers cannot edit
    if (dbUser.role === "reader") {
      return jsonResponse({ error: "Accès refusé" }, 403);
    }

    const body = await request.json() as any;
    const { orgId, contacts, notes } = body;

    if (!orgId) return jsonResponse({ error: "orgId requis" }, 400);

    if (!(await hasAccess(orgId))) {
      return jsonResponse({ error: "Accès refusé" }, 403);
    }

    const now = new Date().toISOString();

    if (contacts !== undefined) {
      await env.DB.prepare("UPDATE organizations SET contacts = ?, updated_at = ? WHERE id = ?")
        .bind(JSON.stringify(contacts), now, orgId).run();
    }

    if (notes !== undefined) {
      await env.DB.prepare("UPDATE organizations SET notes = ?, updated_at = ? WHERE id = ?")
        .bind(notes, now, orgId).run();
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
