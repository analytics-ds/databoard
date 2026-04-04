import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET    /api/project-tasks?org_id=xxx  — list tasks for an org
 * POST   /api/project-tasks             — create a task
 * PUT    /api/project-tasks             — update a task (status, fields)
 * DELETE /api/project-tasks             — delete a task
 */
export async function handleProjectTasks(request: Request, env: Env): Promise<Response> {
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
      `SELECT t.id, t.title, t.description, t.status, t.type, t.category, t.keyword,
              t.assignee_id, t.due_date, t."order", t.created_at, t.updated_at,
              u.name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.org_id = ?
       ORDER BY t."order", t.created_at DESC`
    ).bind(orgId).all();

    const tasks = (result.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description || "",
      status: r.status,
      type: r.type || "other",
      category: r.category || "content",
      keyword: r.keyword,
      assigneeId: r.assignee_id,
      assigneeName: r.assignee_name,
      dueDate: r.due_date,
      order: r.order,
      createdAt: r.created_at,
    }));

    return jsonResponse({ tasks });
  }

  if (request.method === "POST") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { orgId, title, description, type, category, keyword, assigneeId, dueDate, status } = body;
    if (!orgId || !title) return jsonResponse({ error: "orgId et title requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO tasks (id, org_id, title, description, status, type, category, keyword, assignee_id, due_date, "order", created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(id, orgId, title, description || "", status || "brief_prep", type || "other", category || "content",
           keyword || null, assigneeId || null, dueDate || null, now, now).run();

    return jsonResponse({ success: true, id });
  }

  if (request.method === "PUT") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    const { id, orgId, title, description, status, type, category, keyword, assigneeId, dueDate } = body;
    if (!id || !orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { updates.push("title = ?"); values.push(title); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (type !== undefined) { updates.push("type = ?"); values.push(type); }
    if (category !== undefined) { updates.push("category = ?"); values.push(category); }
    if (keyword !== undefined) { updates.push("keyword = ?"); values.push(keyword); }
    if (assigneeId !== undefined) { updates.push("assignee_id = ?"); values.push(assigneeId || null); }
    if (dueDate !== undefined) { updates.push("due_date = ?"); values.push(dueDate || null); }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);
    values.push(orgId);

    await env.DB.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND org_id = ?`)
      .bind(...values).run();

    return jsonResponse({ success: true });
  }

  if (request.method === "DELETE") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    if (!body.id || !body.orgId) return jsonResponse({ error: "id et orgId requis" }, 400);
    if (!(await hasAccess(body.orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    await env.DB.prepare("DELETE FROM tasks WHERE id = ? AND org_id = ?").bind(body.id, body.orgId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
