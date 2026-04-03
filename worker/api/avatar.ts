import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

const MAX_AVATAR_SIZE = 200 * 1024; // 200KB max for base64 string

export async function handleAvatar(request: Request, env: Env): Promise<Response> {
  // Authenticate
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];
  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload?.userId) return jsonResponse({ error: "Session invalide" }, 401);

  if (request.method === "PUT") {
    const body = await request.json() as { avatarUrl: string };

    if (!body.avatarUrl) {
      // Remove avatar
      await env.DB.prepare("UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), payload.userId)
        .run();
      return jsonResponse({ success: true, avatarUrl: null });
    }

    // Validate it's a data URL
    if (!body.avatarUrl.startsWith("data:image/")) {
      return jsonResponse({ error: "Format d'image invalide" }, 400);
    }

    // Check size
    if (body.avatarUrl.length > MAX_AVATAR_SIZE) {
      return jsonResponse({ error: "Image trop volumineuse (max 200KB)" }, 400);
    }

    await env.DB.prepare("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?")
      .bind(body.avatarUrl, new Date().toISOString(), payload.userId)
      .run();

    return jsonResponse({ success: true, avatarUrl: body.avatarUrl });
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}
