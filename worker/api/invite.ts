import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleInvite(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  // Only client, admin, or consultant can invite
  if (!["client", "admin", "consultant"].includes(payload.role)) {
    return jsonResponse({ error: "Accès refusé" }, 403);
  }

  const body = await request.json() as any;
  const { email, role } = body;

  if (!email) return jsonResponse({ error: "Email requis" }, 400);

  // Client can only invite readers
  const inviteRole = payload.role === "client" ? "reader" : (role || "reader");

  // Check email not already registered
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email.toLowerCase()).first();
  if (existing) {
    return jsonResponse({ error: "Cet utilisateur a déjà un compte" }, 409);
  }

  const inviteToken = crypto.randomUUID();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await env.DB.prepare(
    "INSERT INTO invitations (id, org_id, email, role, token, invited_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, payload.orgId, email.toLowerCase(), inviteRole, inviteToken, payload.userId, expires, now).run();

  return jsonResponse({
    success: true,
    inviteLink: `/register?invite=${inviteToken}`,
    message: `Invitation envoyée à ${email}`,
  });
}
