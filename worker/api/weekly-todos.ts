import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * GET  /api/weekly-todos?org_id=xxx           — list all weekly todos for an org
 * POST /api/weekly-todos                      — create a new weekly todo
 * PUT  /api/weekly-todos                      — update todo items (toggle done, add, remove)
 * DELETE /api/weekly-todos                    — delete a weekly todo
 */
export async function handleWeeklyTodos(request: Request, env: Env): Promise<Response> {
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

    const todos = await env.DB.prepare(
      "SELECT id, week_date, created_by, created_at FROM weekly_todos WHERE org_id = ? ORDER BY week_date DESC"
    ).bind(orgId).all();

    const result = [];
    for (const todo of (todos.results || [])) {
      const t = todo as any;
      const items = await env.DB.prepare(
        "SELECT id, title, done, assigned_to, linked_task_id, description, attachments, \"order\" FROM todo_items WHERE todo_id = ? ORDER BY assigned_to, \"order\""
      ).bind(t.id).all();

      // Get creator name
      const creator = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(t.created_by).first<{ name: string }>();

      let attachments: any[] = [];
      result.push({
        id: t.id,
        weekDate: t.week_date,
        createdBy: creator?.name || null,
        createdAt: t.created_at,
        items: (items.results || []).map((i: any) => {
          try { attachments = JSON.parse(i.attachments || "[]"); } catch { attachments = []; }
          return {
            id: i.id,
            title: i.title,
            done: !!i.done,
            assignedTo: i.assigned_to,
            linkedTaskId: i.linked_task_id,
            description: i.description || "",
            attachments,
            order: i.order,
          };
        }),
      });
    }

    // Also fetch tasks with due dates to link with todos
    const tasksResult = await env.DB.prepare(
      `SELECT id, title, status, type, category, due_date FROM tasks WHERE org_id = ? AND due_date IS NOT NULL ORDER BY due_date`
    ).bind(orgId).all();

    const linkedTasks = (tasksResult.results || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      type: t.type,
      category: t.category,
      dueDate: t.due_date,
    }));

    return jsonResponse({ todos: result, linkedTasks });
  }

  if (request.method === "POST") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);

    const body = await request.json() as any;
    const { orgId, weekDate, items } = body;
    if (!orgId || !weekDate) return jsonResponse({ error: "orgId et weekDate requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    const now = new Date().toISOString();
    const todoId = crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO weekly_todos (id, org_id, week_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(todoId, orgId, weekDate, dbUser.id, now, now).run();

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await env.DB.prepare(
          "INSERT INTO todo_items (id, todo_id, org_id, title, done, assigned_to, linked_task_id, \"order\", created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), todoId, orgId, item.title, item.assignedTo || "client", item.linkedTaskId || null, i, now).run();
      }
    }

    return jsonResponse({ success: true, id: todoId });
  }

  if (request.method === "PUT") {
    const body = await request.json() as any;
    const { action, orgId } = body;

    if (!orgId) return jsonResponse({ error: "orgId requis" }, 400);
    if (!(await hasAccess(orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    if (action === "toggle_item") {
      const { itemId, done } = body;
      await env.DB.prepare("UPDATE todo_items SET done = ? WHERE id = ?")
        .bind(done ? 1 : 0, itemId).run();
      return jsonResponse({ success: true });
    }

    if (action === "add_item") {
      const { todoId, title, assignedTo, description, attachments, linkedTaskId } = body;
      if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
      const now = new Date().toISOString();
      const maxOrder = await env.DB.prepare(
        "SELECT MAX(\"order\") as max_order FROM todo_items WHERE todo_id = ?"
      ).bind(todoId).first<{ max_order: number | null }>();
      const order = (maxOrder?.max_order ?? -1) + 1;

      const itemId = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO todo_items (id, todo_id, org_id, title, done, assigned_to, linked_task_id, description, attachments, \"order\", created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)"
      ).bind(itemId, todoId, orgId, title, assignedTo || "client", linkedTaskId || null, description || "", JSON.stringify(attachments || []), order, now).run();
      return jsonResponse({ success: true, id: itemId });
    }

    if (action === "update_item") {
      if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
      const { itemId, title, description, attachments } = body;
      const updates: string[] = [];
      const values: any[] = [];
      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (attachments !== undefined) { updates.push("attachments = ?"); values.push(JSON.stringify(attachments)); }
      if (updates.length > 0) {
        values.push(itemId);
        await env.DB.prepare(`UPDATE todo_items SET ${updates.join(", ")} WHERE id = ?`)
          .bind(...values).run();
      }
      return jsonResponse({ success: true });
    }

    if (action === "remove_item") {
      if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
      await env.DB.prepare("DELETE FROM todo_items WHERE id = ?").bind(body.itemId).run();
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  }

  if (request.method === "DELETE") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    if (!body.todoId || !body.orgId) return jsonResponse({ error: "todoId et orgId requis" }, 400);
    if (!(await hasAccess(body.orgId))) return jsonResponse({ error: "Accès refusé" }, 403);

    await env.DB.prepare("DELETE FROM todo_items WHERE todo_id = ?").bind(body.todoId).run();
    await env.DB.prepare("DELETE FROM weekly_todos WHERE id = ?").bind(body.todoId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
