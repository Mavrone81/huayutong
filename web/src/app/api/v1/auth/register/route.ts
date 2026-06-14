import { NextResponse } from "next/server";
import { one, query } from "@/server/db";
import { hashPassword, createSession, createVerificationToken } from "@/server/auth";
import { ensureEnrollment } from "@/server/learning";
import { err, readJson, setAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// When REQUIRE_VERIFICATION is enabled, accounts start 'pending' and must verify
// their email/phone before the trial can activate (PRD §5.2). The verification
// link is normally emailed; with no email provider configured the raw token is
// returned so the flow stays completable in dev.
const REQUIRE_VERIFICATION = process.env.REQUIRE_VERIFICATION === "true";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; phone?: string; password?: string; ui_language?: string; goal?: string; name?: string }>(req);
  if (!b || !b.password || b.password.length < 8) return err("invalid_password", "Password must be at least 8 characters", 400);
  if (!b.email && !b.phone) return err("missing_contact", "Email or phone is required", 400);
  if (b.email) {
    const exists = await one(`SELECT id FROM users WHERE email = $1`, [b.email]);
    if (exists) return err("email_taken", "An account with that email already exists", 409);
  }
  const status = REQUIRE_VERIFICATION ? "pending" : "active";
  const u = await one<{ id: string }>(
    `INSERT INTO users (email, phone, status, ui_language, goal, display_name)
     VALUES ($1, $2, $6, $3, $4, $5) RETURNING id`,
    [b.email || null, b.phone || null, b.ui_language || "en", b.goal || null, b.name || null, status]
  );
  await query(`INSERT INTO auth_identities (user_id, provider, password_hash) VALUES ($1, 'password', $2)`, [u!.id, hashPassword(b.password)]);
  await ensureEnrollment(u!.id);

  let verification: string | undefined;
  if (REQUIRE_VERIFICATION) {
    const token = await createVerificationToken(u!.id, "email_verify", 24 * 3600);
    verification = process.env.EMAIL_API_KEY ? "sent" : token; // raw token only when no provider (dev)
  }

  const t = await createSession(u!.id);
  const res = NextResponse.json({ user: { id: u!.id, status }, ...(verification ? { verification } : {}) }, { status: 201 });
  return setAuthCookies(res, t.accessToken, t.refreshToken, t.refreshTtl);
}
