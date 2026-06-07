import { currentAdmin } from "@/server/admin";
import { ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const a = currentAdmin();
  if (!a) return err("unauthorized", "Admin sign-in required", 401);
  return ok({ role: a.role });
}
