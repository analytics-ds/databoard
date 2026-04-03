interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...val] = cookie.split("=");
    if (key) cookies[key.trim()] = val.join("=").trim();
  });
  return cookies;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );

    // Decode signature
    const sig = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const sigPadded = sig + "=".repeat((4 - sig.length % 4) % 4);
    const sigBytes = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1]));

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET } = context.env;

  const cookieHeader = context.request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyJWT(token, JWT_SECRET || "dev-secret-change-me");
  if (!payload) {
    return Response.json({ error: "Invalid session" }, { status: 401 });
  }

  const org = await DB.prepare("SELECT id, name, domain FROM organizations WHERE id = ?")
    .bind(payload.orgId).first();

  return Response.json({
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    },
    organization: org || null,
  });
};
