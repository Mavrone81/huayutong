import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccess } from "./auth";

export const ACCESS_COOKIE = "mm_at";
export const REFRESH_COOKIE = "mm_rt";

export function ok(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function readJson<T = any>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** userId from the access-token cookie, or null. */
export function currentUserId(): string | null {
  const c = cookies().get(ACCESS_COOKIE)?.value;
  return c ? verifyAccess(c) : null;
}

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string,
  refreshTtl = 60 * 60 * 24 * 30
) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(ACCESS_COOKIE, accessToken, { httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: 60 * 15 });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: refreshTtl });
  }
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
