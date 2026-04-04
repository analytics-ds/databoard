import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * POST /api/files/upload     — upload a file to R2
 * GET  /api/files/:id        — download/view a file from R2
 * GET  /api/files?org_id=xxx — list files for an org
 * DELETE /api/files           — delete a file
 */
export async function handleFiles(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];
  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const dbUser = await env.DB.prepare("SELECT id, role, org_id FROM users WHERE id = ?")
    .bind(payload.userId).first<{ id: string; role: string; org_id: string }>();
  if (!dbUser) return jsonResponse({ error: "Utilisateur introuvable" }, 401);

  const url = new URL(request.url);
  const path = url.pathname;

  // Upload file
  if (path === "/api/files/upload" && request.method === "POST") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("org_id") as string | null;

    if (!file || !orgId) return jsonResponse({ error: "file et org_id requis" }, 400);

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return jsonResponse({ error: "Fichier trop volumineux (max 50 Mo)" }, 400);
    }

    const fileId = crypto.randomUUID();
    const r2Key = `${orgId}/${fileId}/${file.name}`;
    const now = new Date().toISOString();

    // Upload to R2
    if (!(env as any).FILES) {
      return jsonResponse({ error: "Le stockage de fichiers n'est pas encore configuré (R2)" }, 503);
    }

    await (env as any).FILES.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    // Save metadata to DB
    await env.DB.prepare(
      "INSERT INTO files (id, org_id, name, mime_type, size, r2_key, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(fileId, orgId, file.name, file.type, file.size, r2Key, dbUser.id, now).run();

    return jsonResponse({
      success: true,
      file: { id: fileId, name: file.name, mimeType: file.type, size: file.size, createdAt: now },
    });
  }

  // Download / view file
  if (path.startsWith("/api/files/") && path !== "/api/files/upload" && request.method === "GET") {
    const fileId = path.split("/api/files/")[1];
    if (!fileId) return jsonResponse({ error: "ID requis" }, 400);

    const fileRecord = await env.DB.prepare("SELECT * FROM files WHERE id = ?")
      .bind(fileId).first<any>();
    if (!fileRecord) return jsonResponse({ error: "Fichier introuvable" }, 404);

    if (!(env as any).FILES) {
      return jsonResponse({ error: "R2 non configuré" }, 503);
    }

    const object = await (env as any).FILES.get(fileRecord.r2_key);
    if (!object) return jsonResponse({ error: "Fichier introuvable dans le stockage" }, 404);

    const headers = new Headers();
    headers.set("Content-Type", fileRecord.mime_type);
    headers.set("Content-Disposition", `inline; filename="${fileRecord.name}"`);
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(object.body, { headers });
  }

  // List files
  if (path === "/api/files" && request.method === "GET") {
    const orgId = url.searchParams.get("org_id");
    if (!orgId) return jsonResponse({ error: "org_id requis" }, 400);

    const result = await env.DB.prepare(
      "SELECT id, name, mime_type, size, uploaded_by, created_at FROM files WHERE org_id = ? ORDER BY created_at DESC"
    ).bind(orgId).all();

    return jsonResponse({ files: result.results || [] });
  }

  // Delete file
  if (path === "/api/files" && request.method === "DELETE") {
    if (dbUser.role === "reader") return jsonResponse({ error: "Accès refusé" }, 403);
    const body = await request.json() as any;
    if (!body.fileId) return jsonResponse({ error: "fileId requis" }, 400);

    const fileRecord = await env.DB.prepare("SELECT r2_key FROM files WHERE id = ?")
      .bind(body.fileId).first<any>();

    if (fileRecord && (env as any).FILES) {
      await (env as any).FILES.delete(fileRecord.r2_key);
    }

    await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(body.fileId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
