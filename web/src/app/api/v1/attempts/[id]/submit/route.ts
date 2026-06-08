import { currentUserId, ok, err, readJson } from "@/server/http";
import { submitAttempt, HskError } from "@/server/hskprep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const b = await readJson<{ responses?: { itemId: string; chosenGloss: string; section: string }[] }>(req);
  try {
    return ok(await submitAttempt(userId, params.id, b?.responses || []));
  } catch (e) {
    if (e instanceof HskError) return err(e.code, e.message, e.status);
    throw e;
  }
}
