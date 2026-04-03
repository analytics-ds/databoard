import type { Env } from "../index";
import { hashPassword, createJWT, jsonResponse, setCookieHeader } from "../utils";

export async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { name, email, password, organizationName, domain, turnstileToken } = body;

    if (!name || !email || !password || !organizationName) {
      return jsonResponse({ error: "Tous les champs obligatoires doivent être remplis" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Le mot de passe doit contenir au moins 8 caractères" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Email invalide" }, 400);
    }

    // Verify Turnstile captcha
    if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", env.TURNSTILE_SECRET_KEY);
      formData.append("response", turnstileToken);
      const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", body: formData,
      });
      const captchaData = await captchaRes.json() as any;
      if (!captchaData.success) {
        return jsonResponse({ error: "Captcha invalide" }, 400);
      }
    }

    // Check blocked emails
    const blocked = await env.DB.prepare("SELECT id FROM blocked_emails WHERE email = ?")
      .bind(email.toLowerCase()).first();
    if (blocked) {
      return jsonResponse({ error: "Cette adresse email n'est pas autorisée à créer un compte" }, 403);
    }

    // Check email uniqueness
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(email.toLowerCase()).first();
    if (existing) {
      return jsonResponse({ error: "Un compte existe déjà avec cet email" }, 409);
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    await env.DB.batch([
      env.DB.prepare("INSERT INTO organizations (id, name, domain, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
        .bind(orgId, organizationName, domain || null, now, now),
      env.DB.prepare("INSERT INTO users (id, org_id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(userId, orgId, name, email.toLowerCase(), passwordHash, "owner", now, now),
    ]);

    const token = await createJWT(
      { userId, orgId, email: email.toLowerCase(), name, role: "owner" },
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
    console.error("Register error:", error);
    return jsonResponse({ error: "Erreur lors de la création du compte" }, 500);
  }
}
