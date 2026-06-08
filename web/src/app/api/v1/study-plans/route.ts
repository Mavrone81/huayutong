import { currentUserId, ok, err, readJson } from "@/server/http";
import { createPlan, HskError } from "@/server/hskprep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const b = await readJson<{ targetLevel?: number; examDate?: string }>(req);
  if (!b?.targetLevel) return err("missing_level", "targetLevel is required", 400);
  try {
    return ok(await createPlan(userId, b.targetLevel, b.examDate || null));
  } catch (e) {
    if (e instanceof HskError) return err(e.code, e.message, e.status);
    throw e;
  }
}
