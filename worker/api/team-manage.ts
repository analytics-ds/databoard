import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * DELETE /api/team-manage  — remove a member from the project
 * PUT    /api/team-manage  — transfer ownership (make someone else owner)
 *
 * Role hierarchy for removal:
 *   - admin: can remove consultants, clients, readers
 *   - consultant: can remove clients, readers
 *   - client: can remove readers only
 *   - reader: cannot remove anyone
 *
 * Ownership transfer:
 *   - Only client (owner) can transfer ownership
 *   - Original creator (created_by) remains tagged as principal
 */
export async function handleTeamManage(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  if (request.method === "DELETE") {
    const body = await request.json() as any;
    const { targetUserId, orgId } = body;

    if (!targetUserId || !orgId) {
      return jsonResponse({ error: "targetUserId et orgId requis" }, 400);
    }

    // Cannot remove yourself
    if (targetUserId === dbUser.id) {
      return jsonResponse({ error: "Vous ne pouvez pas vous retirer vous-même" }, 400);
    }

    // Get target user
    const target = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
      .bind(targetUserId).first<{ id: string; role: string; org_id: string }>();
    if (!target) return jsonResponse({ error: "Utilisateur cible introuvable" }, 404);

    // Check permission based on role hierarchy
    const canRemove = checkRemovePermission(dbUser.role, target.role);
    if (!canRemove) {
      return jsonResponse({ error: "Vous n'avez pas la permission de retirer ce membre" }, 403);
    }

    // Check that the current user has access to this org
    if (!(await hasAccessToOrg(dbUser, orgId, env))) {
      return jsonResponse({ error: "Accès refusé à cette organisation" }, 403);
    }

    // Cannot remove the original creator (principal owner)
    const org = await env.DB.prepare("SELECT created_by FROM organizations WHERE id = ?")
      .bind(orgId).first<{ created_by: string | null }>();
    if (org?.created_by === targetUserId) {
      return jsonResponse({ error: "Impossible de retirer le propriétaire principal (créateur du projet)" }, 403);
    }

    // Perform removal based on target's relationship to org
    if (target.role === "consultant") {
      // Remove consultant assignment
      await env.DB.prepare("DELETE FROM consultant_clients WHERE consultant_id = ? AND org_id = ?")
        .bind(targetUserId, orgId).run();
    } else if (target.org_id === orgId) {
      // For org members (client/reader), remove from org by setting org_id to null or deleting
      // We'll unlink them from the org
      await env.DB.prepare("DELETE FROM users WHERE id = ? AND org_id = ?")
        .bind(targetUserId, orgId).run();
    }

    return jsonResponse({ success: true });
  }

  if (request.method === "PUT") {
    const body = await request.json() as any;
    const { action, targetUserId, orgId } = body;

    if (action === "transfer_ownership") {
      if (!targetUserId || !orgId) {
        return jsonResponse({ error: "targetUserId et orgId requis" }, 400);
      }

      // Only client (owner) or admin can transfer ownership
      if (dbUser.role !== "client" && dbUser.role !== "admin") {
        return jsonResponse({ error: "Seul le propriétaire peut transférer la propriété" }, 403);
      }

      // Check current user belongs to this org (for client)
      if (dbUser.role === "client" && dbUser.org_id !== orgId) {
        return jsonResponse({ error: "Accès refusé" }, 403);
      }

      // Get target user — must be in the same org
      const target = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
        .bind(targetUserId).first<{ id: string; role: string; org_id: string }>();
      if (!target) return jsonResponse({ error: "Utilisateur cible introuvable" }, 404);

      if (target.org_id !== orgId && target.role !== "consultant") {
        return jsonResponse({ error: "L'utilisateur cible ne fait pas partie de ce projet" }, 400);
      }

      // Ensure created_by is set (first time transfer, set current owner as creator)
      const org = await env.DB.prepare("SELECT created_by FROM organizations WHERE id = ?")
        .bind(orgId).first<{ created_by: string | null }>();

      if (!org?.created_by) {
        // Set the current owner as the original creator
        await env.DB.prepare("UPDATE organizations SET created_by = ? WHERE id = ?")
          .bind(dbUser.id, orgId).run();
      }

      // Update target to client role and assign to org
      await env.DB.prepare("UPDATE users SET role = 'client', org_id = ? WHERE id = ?")
        .bind(orgId, targetUserId).run();

      // Demote current owner to reader (unless they are the principal creator or admin)
      if (dbUser.role === "client" && dbUser.id !== org?.created_by) {
        // Non-principal owner gets demoted to reader
        await env.DB.prepare("UPDATE users SET role = 'reader' WHERE id = ?")
          .bind(dbUser.id).run();
      }
      // If principal creator transfers, they stay as client role

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Action inconnue" }, 400);
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}

function checkRemovePermission(actorRole: string, targetRole: string): boolean {
  const hierarchy: Record<string, string[]> = {
    admin: ["consultant", "client", "reader"],
    consultant: ["client", "reader"],
    client: ["reader"],
    reader: [],
  };
  return (hierarchy[actorRole] || []).includes(targetRole);
}

async function hasAccessToOrg(user: { id: string; role: string; org_id: string }, orgId: string, env: Env): Promise<boolean> {
  if (user.role === "admin") return true;
  if ((user.role === "client" || user.role === "reader") && user.org_id === orgId) return true;
  if (user.role === "consultant") {
    const assignment = await env.DB.prepare(
      "SELECT id FROM consultant_clients WHERE consultant_id = ? AND org_id = ?"
    ).bind(user.id, orgId).first();
    return !!assignment;
  }
  return false;
}
