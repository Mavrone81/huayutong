import { currentUserId, ok, err } from "@/server/http";
import { startAttempt, HskError } from "@/server/hskprep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  try {
    return ok(await startAttempt(userId, params.id), 201);
  } catch (e) {
    if (e instanceof HskError) return err(e.code, e.message, e.status);
    throw e;
  }
}
