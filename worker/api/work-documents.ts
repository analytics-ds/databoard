import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET    /api/work-documents?org_id=xxx  — list all work documents
 * POST   /api/work-documents             — create a work document
 * PUT    /api/work-documents             — update a work document
 * DELETE /api/work-documents             — delete a work document
 */
export async function handleWorkDocuments(request: Request, env: Env): Promise<Response> {
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
      const a = await env.DB.prepare("SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?")
        .bind(dbUser.id, orgId).first();
      return !!a;
    }
    return false;
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) return jsonResponse({ error: "org_id requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const result = await env.DB.prepare(
      "SELECT id, title, category, url, description, created_by, created_at FROM work_documents WHERE org_id = ? ORDER BY category, title"
    ).bind(orgId).all();

    const docs = (result.results || []).map((r: any) => ({
      id: r.id, title: r.title, category: r.category, url: r.url,
      description: r.description, createdBy: r.created_by, createdAt: r.created_at,
    }));

    return jsonResponse({ documents: docs });
  }

  if (request.method === "POST") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { orgId, title, category, url, description } = body;
    if (!orgId || !title || !url) return jsonResponse({ error: "orgId, title et url requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO work_documents (id, org_id, title, category, url, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, orgId, title, category || "other", url, description || "", dbUser.id, now, now).run();

    return jsonResponse({ success: true, id });
  }

  if (request.method === "PUT") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { id, orgId, title, category, url, description } = body;
    if (!id || !orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE work_documents SET title = ?, category = ?, url = ?, description = ?, updated_at = ? WHERE id = ? AND org_id = ?"
    ).bind(title, category || "other", url, description || "", now, id, orgId).run();

    return jsonResponse({ success: true });
  }

  if (request.method === "DELETE") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    if (!body.id || !body.orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(body.orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    await env.DB.prepare("DELETE FROM work_documents WHERE id = ? AND org_id = ?").bind(body.id, body.orgId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
