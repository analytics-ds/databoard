import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET /api/consultant-overview — get all todos + tasks across all clients for the current consultant/admin
 * Returns: { clients: [...], todos: [...], tasks: [...] }
 * Only accessible to admin and consultant roles.
 */
export async function handleConsultantOverview(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];
  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  if (dbUser.role !== "admin" && dbUser.role !== "consultant") {
    return jsonResponse({ error: "Accès réservé aux consultants et administrateurs" }, 403);
  }

  // Get accessible orgs
  let orgIds: string[] = [];
  let orgs: any[] = [];

  if (dbUser.role === "admin") {
    const result = await env.DB.prepare("SELECT id, name, domain, logo_url FROM organizations ORDER BY name").all();
    orgs = (result.results || []).map((o: any) => ({ id: o.id, name: o.name, domain: o.domain, logoUrl: o.logo_url }));
    orgIds = orgs.map((o: any) => o.id);
  } else {
    const result = await env.DB.prepare(
      `SELECT o.id, o.name, o.domain, o.logo_url
       FROM organizations o
       INNER JOIN consultant_clients cc ON cc.org_id = o.id
       WHERE cc.consultant_id = ?
       ORDER BY o.name`
    ).bind(dbUser.id).all();
    orgs = (result.results || []).map((o: any) => ({ id: o.id, name: o.name, domain: o.domain, logoUrl: o.logo_url }));
    orgIds = orgs.map((o: any) => o.id);
  }

  if (orgIds.length === 0) {
    return jsonResponse({ clients: [], todos: [], tasks: [] });
  }

  // Fetch all weekly todos for all orgs
  const placeholders = orgIds.map(() => "?").join(",");

  // Only fetch the LATEST to-do per client (not full history)
  const todosResult = await env.DB.prepare(
    `SELECT wt.id, wt.org_id, wt.week_date, wt.created_at
     FROM weekly_todos wt
     INNER JOIN (
       SELECT org_id, MAX(week_date) as max_week
       FROM weekly_todos
       WHERE org_id IN (${placeholders})
       GROUP BY org_id
     ) latest ON wt.org_id = latest.org_id AND wt.week_date = latest.max_week
     ORDER BY wt.week_date DESC`
  ).bind(...orgIds).all();

  const todos = [];
  for (const t of (todosResult.results || [])) {
    const todo = t as any;
    const items = await env.DB.prepare(
      "SELECT id, title, done, assigned_to FROM todo_items WHERE todo_id = ? ORDER BY assigned_to, \"order\""
    ).bind(todo.id).all();

    const orgName = orgs.find((o: any) => o.id === todo.org_id)?.name || "";

    todos.push({
      id: todo.id,
      orgId: todo.org_id,
      orgName,
      weekDate: todo.week_date,
      createdAt: todo.created_at,
      totalItems: (items.results || []).length,
      doneItems: (items.results || []).filter((i: any) => i.done).length,
      items: (items.results || []).map((i: any) => ({
        id: i.id,
        title: i.title,
        done: !!i.done,
        assignedTo: i.assigned_to,
      })),
    });
  }

  // Fetch all tasks for all orgs
  const tasksResult = await env.DB.prepare(
    `SELECT t.id, t.org_id, t.title, t.status, t.type, t.category, t.keyword,
            t.due_date, t.created_at, u.name as assignee_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.org_id IN (${placeholders})
     ORDER BY t.due_date IS NULL, t.due_date, t.created_at DESC`
  ).bind(...orgIds).all();

  const tasks = (tasksResult.results || []).map((r: any) => {
    const orgName = orgs.find((o: any) => o.id === r.org_id)?.name || "";
    return {
      id: r.id,
      orgId: r.org_id,
      orgName,
      title: r.title,
      status: r.status,
      type: r.type || "other",
      category: r.category || "content",
      keyword: r.keyword,
      dueDate: r.due_date,
      assigneeName: r.assignee_name,
      createdAt: r.created_at,
    };
  });

  return jsonResponse({ clients: orgs, todos, tasks });
}
