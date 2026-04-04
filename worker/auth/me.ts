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

  // Get fresh user data from DB (includes avatar_url, up-to-date role, etc.)
  const dbUser = await env.DB.prepare(
    "SELECT id, name, email, role, avatar_url, org_id FROM users WHERE id = ?"
  ).bind(payload.userId).first<{
    id: string; name: string; email: string; role: string; avatar_url: string | null; org_id: string;
  }>();

  if (!dbUser) {
    return jsonResponse({ error: "User not found" }, 401);
  }

  // Get user's own org (include logo_url)
  const org = await env.DB.prepare("SELECT id, name, domain, logo_url FROM organizations WHERE id = ?")
    .bind(dbUser.org_id).first<{ id: string; name: string; domain: string | null; logo_url: string | null }>();

  // For admin/consultant, also get their accessible clients
  let clients: any[] = [];

  if (dbUser.role === "admin") {
    const result = await env.DB.prepare("SELECT id, name, domain, logo_url FROM organizations ORDER BY name").all();
    clients = (result.results || []).map((c: any) => ({ id: c.id, name: c.name, domain: c.domain, logoUrl: c.logo_url }));
  } else if (dbUser.role === "consultant") {
    const result = await env.DB.prepare(
      `SELECT o.id, o.name, o.domain, o.logo_url
       FROM organizations o
       INNER JOIN consultant_clients cc ON cc.org_id = o.id
       WHERE cc.consultant_id = ?
       ORDER BY o.name`
    ).bind(dbUser.id).all();
    clients = (result.results || []).map((c: any) => ({ id: c.id, name: c.name, domain: c.domain, logoUrl: c.logo_url }));
  }

  return jsonResponse({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatarUrl: dbUser.avatar_url,
    },
    organization: org ? { id: org.id, name: org.name, domain: org.domain, logoUrl: org.logo_url } : null,
    clients,
  });
}
