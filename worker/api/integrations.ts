import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET  /api/integrations?org_id=xxx  — list integrations for an org
 * POST /api/integrations             — create/update an integration
 *
 * Permissions:
 *   - admin: any org
 *   - consultant: only assigned orgs
 *   - client/owner: own org only
 *   - reader: NO ACCESS
 */
export async function handleIntegrations(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  // Get fresh user data
  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  // Readers have no access
  if (dbUser.role === "reader") {
    return jsonResponse({ error: "Accès refusé" }, 403);
  }

  // Helper: check if user has access to a specific org
  async function hasAccessToOrg(orgId: string): Promise<boolean> {
    if (dbUser.role === "admin") return true;
    if (dbUser.role === "client" && dbUser.org_id === orgId) return true;
    if (dbUser.role === "consultant") {
      const assignment = await env.DB.prepare(
        "SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
      ).bind(dbUser.id, orgId).first();
      return !!assignment;
    }
    return false;
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) return jsonResponse({ error: "org_id requis" }, 400);

    if (!(await hasAccessToOrg(orgId))) {
      return jsonResponse({ error: "Accès refusé à cette organisation" }, 403);
    }

    const result = await env.DB.prepare(
      "SELECT id, type, config, enabled, connected_by, created_at, updated_at FROM org_integrations WHERE org_id = ? ORDER BY type"
    ).bind(orgId).all();

    // Also get the connected_by user names
    const integrations = [];
    for (const row of (result.results || [])) {
      const r = row as any;
      let connectedByName = null;
      if (r.connected_by) {
        const u = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(r.connected_by).first<{ name: string }>();
        connectedByName = u?.name || null;
      }
      // Parse config but mask sensitive fields for non-admin
      let config: any = {};
      try { config = JSON.parse(r.config || "{}"); } catch { /* */ }

      integrations.push({
        id: r.id,
        type: r.type,
        enabled: !!r.enabled,
        config: maskConfig(config, r.type),
        connectedBy: connectedByName,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }

    return jsonResponse({ integrations });
  }

  if (request.method === "POST") {
    const body = await request.json() as any;
    const { action, orgId, type, config } = body;

    if (!orgId || !type) {
      return jsonResponse({ error: "orgId et type requis" }, 400);
    }

    if (!(await hasAccessToOrg(orgId))) {
      return jsonResponse({ error: "Accès refusé à cette organisation" }, 403);
    }

    const validTypes = ["gsc", "ga4"];
    if (!validTypes.includes(type)) {
      return jsonResponse({ error: "Type d'intégration invalide" }, 400);
    }

    const now = new Date().toISOString();

    if (action === "disconnect") {
      await env.DB.prepare("DELETE FROM org_integrations WHERE org_id = ? AND type = ?")
        .bind(orgId, type).run();
      return jsonResponse({ success: true });
    }

    // Upsert integration
    const id = crypto.randomUUID();
    const configJson = JSON.stringify(config || {});

    await env.DB.prepare(
      `INSERT INTO org_integrations (id, org_id, type, config, enabled, connected_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(org_id, type) DO UPDATE SET config = ?, enabled = 1, connected_by = ?, updated_at = ?`
    ).bind(id, orgId, type, configJson, dbUser.id, now, now, configJson, dbUser.id, now).run();

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}

function maskConfig(config: any, type: string): any {
  // Mask API keys — show only last 4 chars
  const masked = { ...config };
  if (masked.apiKey) {
    masked.apiKey = masked.apiKey.length > 4
      ? "•".repeat(masked.apiKey.length - 4) + masked.apiKey.slice(-4)
      : masked.apiKey;
  }
  return masked;
}
