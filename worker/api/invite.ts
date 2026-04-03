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
  const { email, role, orgId: targetOrgId } = body;

  if (!email) return jsonResponse({ error: "Email requis" }, 400);

  // Determine target org and invite role based on the inviter's role
  let inviteOrgId: string;
  let inviteRole: string;

  if (payload.role === "client") {
    // Client invites readers to their own org only
    inviteOrgId = payload.orgId;
    inviteRole = "reader";
  } else if (payload.role === "consultant") {
    // Consultant must specify a target org and must be assigned to it
    if (!targetOrgId) {
      return jsonResponse({ error: "Organisation cible requise" }, 400);
    }
    const hasAccess = await env.DB.prepare(
      "SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
    ).bind(payload.userId, targetOrgId).first();
    if (!hasAccess) {
      return jsonResponse({ error: "Vous n'avez pas accès à cette organisation" }, 403);
    }
    inviteOrgId = targetOrgId;
    inviteRole = role || "reader";
  } else {
    // Admin can invite to any org
    inviteOrgId = targetOrgId || payload.orgId;
    inviteRole = role || "reader";
  }

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
  ).bind(id, inviteOrgId, email.toLowerCase(), inviteRole, inviteToken, payload.userId, expires, now).run();

  return jsonResponse({
    success: true,
    inviteLink: `/register?invite=${inviteToken}`,
    message: `Invitation envoyée à ${email}`,
  });
}
