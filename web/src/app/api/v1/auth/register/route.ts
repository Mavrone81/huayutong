import { NextResponse } from "next/server";
import { one, query } from "@/server/db";
import { hashPassword, createSession } from "@/server/auth";
import { err, readJson, setAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; phone?: string; password?: string; ui_language?: string; goal?: string; name?: string }>(req);
  if (!b || !b.password || b.password.length < 8) return err("invalid_password", "Password must be at least 8 characters", 400);
  if (!b.email && !b.phone) return err("missing_contact", "Email or phone is required", 400);
  if (b.email) {
    const exists = await one(`SELECT id FROM users WHERE email = $1`, [b.email]);
    if (exists) return err("email_taken", "An account with that email already exists", 409);
  }
  const u = await one<{ id: string }>(
    `INSERT INTO users (email, phone, status, ui_language, goal, display_name)
     VALUES ($1, $2, 'active', $3, $4, $5) RETURNING id`,
    [b.email || null, b.phone || null, b.ui_language || "en", b.goal || null, b.name || null]
  );
  await query(`INSERT INTO auth_identities (user_id, provider, password_hash) VALUES ($1, 'password', $2)`, [u!.id, hashPassword(b.password)]);
  const t = await createSession(u!.id);
  const res = NextResponse.json({ user: { id: u!.id, status: "active" } }, { status: 201 });
  return setAuthCookies(res, t.accessToken, t.refreshToken, t.refreshTtl);
}
