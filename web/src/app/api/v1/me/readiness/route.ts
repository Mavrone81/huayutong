import { currentUserId, ok, err } from "@/server/http";
import { getReadiness } from "@/server/hskprep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  return ok(await getReadiness(userId));
}
