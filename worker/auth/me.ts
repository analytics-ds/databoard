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

  const org = await env.DB.prepare("SELECT id, name, domain FROM organizations WHERE id = ?")
    .bind(payload.orgId).first();

  return jsonResponse({
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    },
    organization: org || null,
  });
}
