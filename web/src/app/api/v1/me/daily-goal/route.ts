import { currentUserId, ok, err, readJson } from "@/server/http";
import { setDailyGoal } from "@/server/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const b = await readJson<{ minutes?: number }>(req);
  const minutes = Number(b?.minutes);
  if (!minutes || minutes < 1 || minutes > 240) return err("invalid_minutes", "minutes must be 1–240", 400);
  return ok(await setDailyGoal(userId, minutes));
}
