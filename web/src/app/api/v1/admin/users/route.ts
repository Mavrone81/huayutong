import { requireAdmin, createUserAsAdmin, AdminError } from "@/server/admin";
import { ok, err, readJson } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin();
    const b = await readJson<{ name?: string; email?: string; language?: string }>(req);
    if (!b?.email) return err("missing_email", "email is required", 400);
    return ok(await createUserAsAdmin(ctx, { name: b.name, email: b.email, language: b.language }));
  } catch (e) {
    if (e instanceof AdminError) return err(e.code, e.message, e.status);
    throw e;
  }
}
