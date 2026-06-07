import { requireAdmin, overridePrice, AdminError } from "@/server/admin";
import { ok, err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAdmin();
    const b = await readJson<{ amountMinor?: number; reason?: string }>(req);
    if (typeof b?.amountMinor !== "number") return err("invalid_amount", "amountMinor is required", 400);
    return ok(await overridePrice(ctx, params.id, b.amountMinor, b.reason || ""));
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
