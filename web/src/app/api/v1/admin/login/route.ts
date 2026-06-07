import { NextResponse } from "next/server";
import { loginAdmin, signAdmin, ADMIN_COOKIE } from "@/server/admin";
import { err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; password?: string }>(req);
  if (!b?.email || !b?.password) return err("missing_credentials", "Email and password are required", 400);
  const a = await loginAdmin(b.email, b.password);
  if (!a) return err("invalid_credentials", "Invalid admin credentials", 401);
  const res = NextResponse.json({ admin: { role: a.role } });
  res.cookies.set(ADMIN_COOKIE, signAdmin(a.adminId, a.role), {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8,
  });
  return res;
}
