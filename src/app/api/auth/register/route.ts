import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const registerSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Minimum 8 caractères").max(128),
  organizationName: z.string().min(2, "Nom d'entreprise trop court").max(200),
  domain: z.string().max(255).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName, domain, turnstileToken } = parsed.data;

    // Verify Turnstile captcha in production
    if (TURNSTILE_SECRET && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", TURNSTILE_SECRET);
      formData.append("response", turnstileToken);
      formData.append("remoteip", request.headers.get("cf-connecting-ip") || "");

      const captchaRes = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        body: formData,
      });
      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        return NextResponse.json(
          { error: "Captcha invalide. Veuillez réessayer." },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Hash password (cost 12 for security)
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create organization
    const orgId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(organizations).values({
      id: orgId,
      name: organizationName,
      domain: domain || null,
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create user as owner
    const userId = crypto.randomUUID();

    db.insert(users).values({
      id: userId,
      orgId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    }).run();

    // Create session
    await createSession({
      userId,
      orgId,
      email: email.toLowerCase(),
      name,
      role: "owner",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
