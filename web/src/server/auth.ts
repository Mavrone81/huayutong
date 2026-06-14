import crypto from "node:crypto";
import { query, one } from "./db";

const SECRET = process.env.AUTH_JWT_SECRET || "dev-insecure-secret-change-me";
const ACCESS_TTL = 60 * 15; // 15 min
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days

// ---- HS256 JWT (no external deps) ----
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signAccess(userId: string): string {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + ACCESS_TTL }));
  const sig = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyAccess(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  try {
    const body = JSON.parse(Buffer.from(p, "base64url").toString());
    if (typeof body.exp === "number" && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body.sub as string;
  } catch {
    return null;
  }
}

// ---- Passwords (scrypt, built-in) ----
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${dk.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const dk = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  const h = Buffer.from(hashHex, "hex");
  return dk.length === h.length && crypto.timingSafeEqual(dk, h);
}

// ---- Refresh sessions (opaque token, hash stored) ----
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const refresh = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + REFRESH_TTL * 1000);
  await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, sha(refresh), expires]
  );
  return { accessToken: signAccess(userId), refreshToken: refresh, refreshTtl: REFRESH_TTL };
}

export async function rotateFromRefresh(refresh: string) {
  const row = await one<{ user_id: string }>(
    `SELECT user_id FROM sessions WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [sha(refresh)]
  );
  if (!row) return null;
  return { accessToken: signAccess(row.user_id), userId: row.user_id };
}

export async function revokeSession(refresh: string) {
  await query(`UPDATE sessions SET revoked_at = now() WHERE refresh_token_hash = $1`, [sha(refresh)]);
}

// ---- Verification / password-reset tokens (opaque token, hash stored) ----
export type TokenPurpose = "email_verify" | "password_reset";

export async function createVerificationToken(userId: string, purpose: TokenPurpose, ttlSeconds: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + ttlSeconds * 1000);
  await query(
    `INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, purpose, sha(token), expires]
  );
  return token;
}

export async function consumeVerificationToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const row = await one<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM verification_tokens
      WHERE token_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC LIMIT 1`,
    [sha(token), purpose]
  );
  if (!row) return null;
  await query(`UPDATE verification_tokens SET consumed_at = now() WHERE id = $1`, [row.id]);
  return row.user_id;
}
