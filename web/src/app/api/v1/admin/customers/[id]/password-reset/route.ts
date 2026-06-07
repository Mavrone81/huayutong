import { requireAdmin, resetUserPassword, AdminError } from "@/server/admin";
import { ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAdmin();
    return ok(await resetUserPassword(ctx, params.id));
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
