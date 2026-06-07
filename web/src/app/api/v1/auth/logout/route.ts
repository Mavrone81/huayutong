import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession } from "@/server/auth";
import { REFRESH_COOKIE, clearAuthCookies } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const rt = cookies().get(REFRESH_COOKIE)?.value;
  if (rt) await revokeSession(rt);
  return clearAuthCookies(NextResponse.json({ ok: true }));
}
