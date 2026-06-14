import { NextResponse } from "next/server";
import { one, query } from "@/server/db";
import { createSession } from "@/server/auth";
import { ensureEnrollment } from "@/server/learning";
import { verifyOAuth } from "@/server/oauth";
import { err, readJson, setAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDERS = new Set(["google", "apple"]);

// Social login (PRD §5.2): exchange a provider id_token for a session. Links by
// identity, then by verified email, otherwise creates a provider-verified account.
export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider;
  if (!PROVIDERS.has(provider)) return err("unknown_provider", "Unsupported OAuth provider", 404);

  const b = await readJson<{ id_token?: string; ui_language?: string }>(req);
  if (!b?.id_token) return err("missing_token", "id_token is required", 400);

  const ext = await verifyOAuth(provider, b.id_token);
  if (!ext) return err("invalid_token", "Could not verify the provider token", 401);

  let userId: string | null = null;
  let created = false;

  // 1) Known identity → log in.
  const identity = await one<{ user_id: string }>(
    `SELECT user_id FROM auth_identities WHERE provider = $1 AND provider_subject = $2`,
    [provider, ext.subject]
  );
  if (identity) {
    userId = identity.user_id;
  } else if (ext.email) {
    // 2) Link to an existing account with the same (provider-verified) email.
    const u = await one<{ id: string }>(`SELECT id FROM users WHERE email = $1 AND status != 'deleted'`, [ext.email]);
    if (u) {
      userId = u.id;
      await query(
        `INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [userId, provider, ext.subject]
      );
    }
  }

  // 3) New account — requires an email to satisfy the contact constraint.
  if (!userId) {
    if (!ext.email) return err("email_required", "This provider did not share an email; cannot create an account", 400);
    const u = await one<{ id: string }>(
      `INSERT INTO users (email, status, ui_language, display_name, email_verified_at)
       VALUES ($1, 'active', $2, $3, now()) RETURNING id`,
      [ext.email, b.ui_language || "en", ext.name]
    );
    userId = u!.id;
    await query(`INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, $2, $3)`, [userId, provider, ext.subject]);
    await ensureEnrollment(userId);
    created = true;
  }

  const t = await createSession(userId);
  const res = NextResponse.json({ user: { id: userId, status: "active" }, provider }, { status: created ? 201 : 200 });
  return setAuthCookies(res, t.accessToken, t.refreshToken, t.refreshTtl);
}
