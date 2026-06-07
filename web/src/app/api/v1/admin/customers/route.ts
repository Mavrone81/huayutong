import { requireAdmin, listCustomers, AdminError } from "@/server/admin";
import { ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    requireAdmin();
    const q = new URL(req.url).searchParams.get("q") || "";
    return ok({ customers: await listCustomers(q) });
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
