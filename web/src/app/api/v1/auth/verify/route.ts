import { query } from "@/server/db";
import { consumeVerificationToken } from "@/server/auth";
import { ok, err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirm an email/phone verification token → activates the account (PRD §5.2).
export async function POST(req: Request) {
  const b = await readJson<{ token?: string }>(req);
  if (!b?.token) return err("missing_token", "A verification token is required", 400);

  const userId = await consumeVerificationToken(b.token, "email_verify");
  if (!userId) return err("invalid_token", "This verification link is invalid or has expired", 400);

  await query(
    `UPDATE users SET email_verified_at = now(), status = 'active', updated_at = now() WHERE id = $1`,
    [userId]
  );
  return ok({ verified: true });
}
