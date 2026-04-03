import type { Env } from "../index";
import { verifyPassword, createJWT, jsonResponse, setCookieHeader } from "../utils";

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: "Email et mot de passe requis" }, 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, org_id, name, email, password_hash, role FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first<{
      id: string; org_id: string; name: string; email: string; password_hash: string; role: string;
    }>();

    if (!user) {
      // Timing-safe: do work to prevent user enumeration
      await verifyPassword("dummy", btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48)))));
      return jsonResponse({ error: "Email ou mot de passe incorrect" }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonResponse({ error: "Email ou mot de passe incorrect" }, 401);
    }

    const token = await createJWT(
      { userId: user.id, orgId: user.org_id, email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setCookieHeader(token, request.url.startsWith("https")),
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return jsonResponse({ error: "Erreur de connexion" }, 500);
  }
}
