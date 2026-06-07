import { currentUserId, ok, err, readJson } from "@/server/http";
import { reviewCard, LearnError } from "@/server/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const b = await readJson<{ cardId?: string; grade?: number }>(req);
  if (!b?.cardId || typeof b.grade !== "number") return err("missing_fields", "cardId and grade are required", 400);
  try {
    return ok(await reviewCard(userId, b.cardId, b.grade));
  } catch (e) {
    if (e instanceof LearnError) return err(e.code, e.message, e.status);
    throw e;
  }
}
