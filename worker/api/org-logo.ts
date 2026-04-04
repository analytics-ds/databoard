import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

const MAX_LOGO_SIZE = 300 * 1024; // 300KB max for base64 string

/**
 * PUT /api/org-logo — upload or remove an organization logo
 * Body: { orgId: string, logoUrl: string | null }
 * Permissions: admin, consultant (assigned), client (own org). Not reader.
 */
export async function handleOrgLogo(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];
  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload?.userId) return jsonResponse({ error: "Session invalide" }, 401);

  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  if (dbUser.role === "reader") {
    return jsonResponse({ error: "Accès refusé" }, 403);
  }

  if (request.method === "PUT") {
    const body = await request.json() as { orgId: string; logoUrl: string | null };

    if (!body.orgId) return jsonResponse({ error: "orgId requis" }, 400);

    // Check access
    if (dbUser.role === "client" && dbUser.org_id !== body.orgId) {
      return jsonResponse({ error: "Accès refusé" }, 403);
    }
    if (dbUser.role === "consultant") {
      const assignment = await env.DB.prepare(
        "SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
      ).bind(dbUser.id, body.orgId).first();
      if (!assignment) return jsonResponse({ error: "Accès refusé" }, 403);
    }

    const now = new Date().toISOString();

    if (!body.logoUrl) {
      await env.DB.prepare("UPDATE organizations SET logo_url = NULL, updated_at = ? WHERE id = ?")
        .bind(now, body.orgId).run();
      return jsonResponse({ success: true, logoUrl: null });
    }

    if (!body.logoUrl.startsWith("data:image/")) {
      return jsonResponse({ error: "Format d'image invalide" }, 400);
    }

    if (body.logoUrl.length > MAX_LOGO_SIZE) {
      return jsonResponse({ error: "Image trop volumineuse (max 300KB)" }, 400);
    }

    await env.DB.prepare("UPDATE organizations SET logo_url = ?, updated_at = ? WHERE id = ?")
      .bind(body.logoUrl, now, body.orgId).run();

    return jsonResponse({ success: true, logoUrl: body.logoUrl });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
