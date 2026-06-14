import { requireAdmin, issueRefund, AdminError } from "@/server/admin";
import { ok, err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin();
    const b = await readJson<{ customerId?: string; amountMinor?: number; reason?: string }>(req);
    if (!b?.customerId) return err("missing_customer", "customerId is required", 400);
    return ok(await issueRefund(ctx, b.customerId, b.amountMinor, b.reason));
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
