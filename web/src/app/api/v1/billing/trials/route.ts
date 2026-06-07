import { one } from "@/server/db";
import { currentUserId, ok, err, readJson } from "@/server/http";
import { ensureCustomer, addInterval, latestSubscription, USD } from "@/server/billing";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);

  const b = await readJson<{ plan_code?: string; payment_method?: string }>(req);
  if (!b?.plan_code || !b.payment_method) return err("missing_fields", "plan_code and payment_method are required", 400);
  if (b.plan_code === "free") return err("invalid_plan", "The free plan does not require a trial", 400);

  const cur = process.env.DEFAULT_CURRENCY || "USD";
  const plan = await one<{ id: string; interval: "month" | "year" | null; trial_days: number }>(
    `SELECT id, interval, trial_days FROM plans WHERE code = $1 AND is_active`,
    [b.plan_code]
  );
  if (!plan) return err("plan_not_found", "Unknown plan", 404);
  const price = await one<{ amount_minor: number }>(`SELECT amount_minor FROM prices WHERE plan_id = $1 AND currency = $2`, [plan.id, cur]);

  const cust = await ensureCustomer(userId);
  const existing = await one(`SELECT id FROM subscriptions WHERE customer_id = $1 AND status IN ('trialing','active','past_due')`, [cust.id]);
  if (existing) return err("already_subscribed", "You already have an active subscription", 409);

  // Vault the payment method with the PSP customer.
  const u = await one<{ email: string | null; display_name: string | null }>(`SELECT email, display_name FROM users WHERE id = $1`, [userId]);
  const psp = getPsp();
  const pspCustomerId = await psp.ensureCustomer({ userId, email: u?.email ?? null, name: u?.display_name || "Learner", pspCustomerId: cust.psp_customer_id });
  if (pspCustomerId !== cust.psp_customer_id) {
    await one(`UPDATE customers SET psp_customer_id = $1 WHERE id = $2 RETURNING id`, [pspCustomerId, cust.id]);
  }
  await one(
    `INSERT INTO payment_methods (customer_id, type, psp_payment_method_id, brand, last4, is_default)
     VALUES ($1, 'card', $2, 'Visa', '4242', true) RETURNING id`,
    [cust.id, b.payment_method]
  );

  const trialDays = Number(process.env.TRIAL_DAYS || plan.trial_days || 30);
  const now = new Date();
  const trialEnds = new Date(now.getTime() + trialDays * 86400000);
  const periodEnd = addInterval(trialEnds, plan.interval);

  await one(
    `INSERT INTO subscriptions (customer_id, plan_id, status, currency, trial_started_at, trial_ends_at, current_period_start, current_period_end)
     VALUES ($1, $2, 'trialing', $3, $4, $5, $5, $6) RETURNING id`,
    [cust.id, plan.id, cur, now, trialEnds, periodEnd]
  );

  const sub = await latestSubscription(userId);
  return ok(
    {
      subscription: {
        id: sub!.id,
        status: sub!.status,
        planCode: sub!.plan_code,
        priceLabel: sub!.amount_minor != null ? USD(sub!.amount_minor) : null,
        trialEndsAt: sub!.trial_ends_at,
      },
    },
    201
  );
}
