import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleProjectTeam(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifie" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");
  if (!orgId) return jsonResponse({ error: "org_id requis" }, 400);

  // Org members (owners, readers)
  const orgMembers = await env.DB.prepare(
    "SELECT id, name, email, role, avatar_url FROM users WHERE org_id = ?"
  ).bind(orgId).all();

  // Assigned consultants
  const consultants = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.avatar_url
     FROM users u
     INNER JOIN consultant_clients cc ON cc.consultant_id = u.id
     WHERE cc.org_id = ?`
  ).bind(orgId).all();

  // Admins (they have access to everything)
  const admins = await env.DB.prepare(
    "SELECT id, name, email, role, avatar_url FROM users WHERE role = 'admin'"
  ).all();

  // Get org created_by (principal owner)
  const org = await env.DB.prepare("SELECT created_by FROM organizations WHERE id = ?")
    .bind(orgId).first<{ created_by: string | null }>();

  // Merge and deduplicate
  const allMembers = new Map<string, any>();
  for (const m of [...(admins.results || []), ...(consultants.results || []), ...(orgMembers.results || [])]) {
    const member = m as any;
    if (!allMembers.has(member.id)) {
      allMembers.set(member.id, {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatarUrl: member.avatar_url,
      });
    }
  }

  return jsonResponse({ members: Array.from(allMembers.values()), createdBy: org?.created_by || null });
}
