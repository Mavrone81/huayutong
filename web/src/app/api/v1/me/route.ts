import { one } from "@/server/db";
import { currentUserId, ok, err } from "@/server/http";
import { getEntitlement } from "@/server/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const u = await one<{ id: string; email: string | null; display_name: string | null; ui_language: string; goal: string | null; status: string }>(
    `SELECT id, email, display_name, ui_language, goal, status FROM users WHERE id = $1`,
    [userId]
  );
  if (!u) return err("not_found", "User not found", 404);
  const entitlement = await getEntitlement(userId);
  return ok({
    id: u.id,
    name: u.display_name || (u.email ? u.email.split("@")[0] : "Learner"),
    email: u.email,
    uiLanguage: u.ui_language,
    goal: u.goal,
    entitlement,
  });
}
