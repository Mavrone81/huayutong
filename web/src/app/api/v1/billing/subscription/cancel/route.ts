import { one } from "@/server/db";
import { currentUserId, ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const sub = await one<{ id: string }>(
    `SELECT s.id FROM subscriptions s JOIN customers c ON c.id = s.customer_id
      WHERE c.user_id = $1 AND s.status IN ('trialing','active','past_due')
      ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  if (!sub) return err("no_subscription", "No active subscription to cancel", 404);
  // Schedule cancellation: keep access until trial/period end; the billing runner
  // expires it at that point instead of charging.
  await one(
    `UPDATE subscriptions SET cancel_at_period_end = true, canceled_at = now(), updated_at = now()
      WHERE id = $1 RETURNING id`,
    [sub.id]
  );
  return ok({ status: "scheduled_cancellation", accessUntilPeriodEnd: true });
}
