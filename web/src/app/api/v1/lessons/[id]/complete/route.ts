import { currentUserId, ok, err, readJson } from "@/server/http";
import { completeLesson, LearnError } from "@/server/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const b = await readJson<{ score?: number }>(req);
  try {
    return ok(await completeLesson(userId, params.id, typeof b?.score === "number" ? b.score : 100));
  } catch (e) {
    if (e instanceof LearnError) return err(e.code, e.message, e.status);
    throw e;
  }
}
