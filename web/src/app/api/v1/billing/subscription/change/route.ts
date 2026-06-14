import { one } from "@/server/db";
import { currentUserId, ok, err, readJson } from "@/server/http";
import { latestSubscription, USD } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upgrade/downgrade or monthly↔annual switch (PRD §5.6). A real PSP prorates the
// current period; here we re-point the subscription to the new plan and let the
// next invoice reflect the new price.
export async function POST(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);

  const b = await readJson<{ plan_code?: string }>(req);
  if (!b?.plan_code) return err("missing_fields", "plan_code is required", 400);
  if (b.plan_code === "free") return err("invalid_plan", "Use cancel to move to the free tier", 400);

  const sub = await one<{ id: string }>(
    `SELECT s.id FROM subscriptions s JOIN customers c ON c.id = s.customer_id
      WHERE c.user_id = $1 AND s.status IN ('trialing','active','past_due')
      ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  if (!sub) return err("no_subscription", "No active subscription to change", 404);

  const plan = await one<{ id: string }>(`SELECT id FROM plans WHERE code = $1 AND is_active`, [b.plan_code]);
  if (!plan) return err("plan_not_found", "Unknown plan", 404);

  await one(`UPDATE subscriptions SET plan_id = $2, updated_at = now() WHERE id = $1 RETURNING id`, [sub.id, plan.id]);

  const updated = await latestSubscription(userId);
  return ok({
    subscription: {
      id: updated!.id,
      status: updated!.status,
      planCode: updated!.plan_code,
      priceLabel: updated!.amount_minor != null ? USD(updated!.amount_minor) : null,
    },
    proration: "applied_next_invoice",
  });
}
