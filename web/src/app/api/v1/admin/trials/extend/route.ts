import { requireAdmin, extendTrial, AdminError } from "@/server/admin";
import { ok, err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin();
    const b = await readJson<{ customerId?: string; days?: number }>(req);
    if (!b?.customerId) return err("missing_customer", "customerId is required", 400);
    return ok(await extendTrial(ctx, b.customerId, b.days || 7));
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
