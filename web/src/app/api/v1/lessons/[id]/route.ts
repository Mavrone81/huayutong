import { currentUserId, ok, err } from "@/server/http";
import { getLessonForUser, LearnError } from "@/server/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  try {
    return ok(await getLessonForUser(userId, params.id));
  } catch (e) {
    if (e instanceof LearnError) return err(e.code, e.message, e.status);
    throw e;
  }
}
