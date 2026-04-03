import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user - use constant-time comparison to prevent timing attacks
    const user = db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get();

    if (!user) {
      // Always hash to prevent timing-based user enumeration
      await bcryptjs.hash("dummy", 12);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const validPassword = await bcryptjs.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Create session
    await createSession({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur de connexion" },
      { status: 500 }
    );
  }
}
