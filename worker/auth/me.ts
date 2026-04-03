import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  const role = payload.role as string;

  // Get user's own org
  const org = await env.DB.prepare("SELECT id, name, domain FROM organizations WHERE id = ?")
    .bind(payload.orgId).first();

  // For admin/consultant, also get their accessible clients
  let clients: any[] = [];

  if (role === "admin") {
    // Admin sees ALL organizations
    const result = await env.DB.prepare("SELECT id, name, domain FROM organizations ORDER BY name").all();
    clients = result.results || [];
  } else if (role === "consultant") {
    // Consultant sees only assigned organizations
    const result = await env.DB.prepare(
      `SELECT o.id, o.name, o.domain
       FROM organizations o
       INNER JOIN consultant_clients cc ON cc.org_id = o.id
       WHERE cc.consultant_id = ?
       ORDER BY o.name`
    ).bind(payload.userId).all();
    clients = result.results || [];
  }

  return jsonResponse({
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    },
    organization: org || null,
    clients, // empty for client/reader, populated for admin/consultant
  });
}
