import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rotateFromRefresh } from "@/server/auth";
import { REFRESH_COOKIE, err, setAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const rt = cookies().get(REFRESH_COOKIE)?.value;
  if (!rt) return err("no_session", "No refresh token", 401);
  const r = await rotateFromRefresh(rt);
  if (!r) return err("invalid_session", "Session expired or revoked", 401);
  return setAuthCookies(NextResponse.json({ ok: true }), r.accessToken);
}
