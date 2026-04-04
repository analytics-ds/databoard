import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET    /api/meeting-reports?org_id=xxx  — list all meeting reports
 * POST   /api/meeting-reports             — create a meeting report
 * PUT    /api/meeting-reports             — update a meeting report
 * DELETE /api/meeting-reports             — delete a meeting report
 */
export async function handleMeetingReports(request: Request, env: Env): Promise<Response> {
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
      "SELECT id, date, subject, duration, report_url, notes, created_by, created_at FROM meeting_reports WHERE org_id = ? ORDER BY date DESC"
    ).bind(orgId).all();

    const reports = [];
    for (const r of (result.results || [])) {
      const row = r as any;
      const creator = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(row.created_by).first<{ name: string }>();
      reports.push({
        id: row.id, date: row.date, subject: row.subject, duration: row.duration,
        reportUrl: row.report_url, notes: row.notes, createdBy: creator?.name || null, createdAt: row.created_at,
      });
    }

    return jsonResponse({ reports });
  }

  if (request.method === "POST") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { orgId, date, subject, duration, reportUrl, notes } = body;
    if (!orgId || !date || !subject) return jsonResponse({ error: "orgId, date et subject requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO meeting_reports (id, org_id, date, subject, duration, report_url, notes, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, orgId, date, subject, duration || null, reportUrl || null, notes || "", dbUser.id, now, now).run();

    return jsonResponse({ success: true, id });
  }

  if (request.method === "PUT") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { id, orgId, date, subject, duration, reportUrl, notes } = body;
    if (!id || !orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE meeting_reports SET date = ?, subject = ?, duration = ?, report_url = ?, notes = ?, updated_at = ? WHERE id = ? AND org_id = ?"
    ).bind(date, subject, duration || null, reportUrl || null, notes || "", now, id, orgId).run();

    return jsonResponse({ success: true });
  }

  if (request.method === "DELETE") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    if (!body.id || !body.orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(body.orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    await env.DB.prepare("DELETE FROM meeting_reports WHERE id = ? AND org_id = ?").bind(body.id, body.orgId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
