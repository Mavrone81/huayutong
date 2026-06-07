import { requireAdmin, overview, AdminError } from "@/server/admin";
import { ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireAdmin();
    return ok(await overview());
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
