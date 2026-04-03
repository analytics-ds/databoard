interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function createJWT(payload: Record<string, string>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claims = btoa(JSON.stringify({ ...payload, iat: now, exp: now + 86400 }));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${claims}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${header}.${claims}.${sig}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET, TURNSTILE_SECRET_KEY } = context.env;

  try {
    const body = await context.request.json() as any;
    const { name, email, password, organizationName, domain, turnstileToken } = body;

    if (!name || !email || !password || !organizationName) {
      return Response.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    // Verify Turnstile captcha
    if (TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", TURNSTILE_SECRET_KEY);
      formData.append("response", turnstileToken);
      const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", body: formData,
      });
      const captchaData = await captchaRes.json() as any;
      if (!captchaData.success) {
        return Response.json({ error: "Captcha invalide" }, { status: 400 });
      }
    }

    // Check email uniqueness
    const existing = await DB.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
    if (existing) {
      return Response.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    // Create org + user in a batch
    await DB.batch([
      DB.prepare("INSERT INTO organizations (id, name, domain, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
        .bind(orgId, organizationName, domain || null, now, now),
      DB.prepare("INSERT INTO users (id, org_id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(userId, orgId, name, email.toLowerCase(), passwordHash, "owner", now, now),
    ]);

    // Create JWT
    const token = await createJWT(
      { userId, orgId, email: email.toLowerCase(), name, role: "owner" },
      JWT_SECRET || "dev-secret-change-me"
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `databoard_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${context.request.url.startsWith("https") ? "; Secure" : ""}`,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return Response.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
  }
};
