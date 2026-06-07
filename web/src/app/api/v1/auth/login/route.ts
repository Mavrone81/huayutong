import { NextResponse } from "next/server";
import { one } from "@/server/db";
import { verifyPassword, createSession } from "@/server/auth";
import { err, readJson, setAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; password?: string }>(req);
  if (!b || !b.email || !b.password) return err("missing_credentials", "Email and password are required", 400);
  const row = await one<{ id: string; password_hash: string | null }>(
    `SELECT u.id, ai.password_hash
       FROM users u
       JOIN auth_identities ai ON ai.user_id = u.id AND ai.provider = 'password'
      WHERE u.email = $1 AND u.status != 'deleted'`,
    [b.email]
  );
  if (!row || !row.password_hash || !verifyPassword(b.password, row.password_hash)) {
    return err("invalid_credentials", "Invalid email or password", 401);
  }
  const t = await createSession(row.id);
  const res = NextResponse.json({ user: { id: row.id } });
  return setAuthCookies(res, t.accessToken, t.refreshToken, t.refreshTtl);
}
