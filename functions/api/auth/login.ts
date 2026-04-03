interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const storedKey = combined.slice(16);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashArray = new Uint8Array(hash);

  // Constant-time comparison
  if (hashArray.length !== storedKey.length) return false;
  let result = 0;
  for (let i = 0; i < hashArray.length; i++) {
    result |= hashArray[i] ^ storedKey[i];
  }
  return result === 0;
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
  const { DB, JWT_SECRET } = context.env;

  try {
    const body = await context.request.json() as any;
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const user = await DB.prepare(
      "SELECT id, org_id, name, email, password_hash, role FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first<{
      id: string; org_id: string; name: string; email: string; password_hash: string; role: string;
    }>();

    if (!user) {
      // Timing-safe: still do work to prevent user enumeration
      await verifyPassword("dummy", btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48)))));
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const token = await createJWT(
      { userId: user.id, orgId: user.org_id, email: user.email, name: user.name, role: user.role },
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
    console.error("Login error:", error);
    return Response.json({ error: "Erreur de connexion" }, { status: 500 });
  }
};
