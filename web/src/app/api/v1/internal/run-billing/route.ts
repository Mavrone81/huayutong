import { query, one } from "@/server/db";
import { ok, err, readJson } from "@/server/http";
import { addInterval } from "@/server/billing";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The trial-charge + renewal + dunning runner. In production this is a cron
// (e.g. every 15 min) calling this endpoint with the INTERNAL_BILLING_SECRET.
export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_BILLING_SECRET) return err("forbidden", "Bad internal secret", 403);

  const b = await readJson<{ subscriptionId?: string }>(req);
  const forced = b?.subscriptionId ?? null;

  const due = await query<{ id: string; status: string; customer_id: string; currency: string; interval: "month" | "year" | null; amount_minor: number | null; cancel_at_period_end: boolean }>(
    `SELECT s.id, s.status, s.customer_id, s.currency, p.interval, pr.amount_minor, s.cancel_at_period_end
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       LEFT JOIN prices pr ON pr.plan_id = p.id AND pr.currency = s.currency
      WHERE ($1::uuid IS NOT NULL AND s.id = $1::uuid)
         OR (s.status = 'trialing' AND s.trial_ends_at <= now())
         OR (s.status = 'active' AND s.current_period_end <= now())
         OR (s.status = 'past_due')`,
    [forced]
  );

  const psp = getPsp();
  const results: any[] = [];

  for (const s of due) {
    // Scheduled-to-cancel subs are expired at period end instead of charged.
    if (s.cancel_at_period_end) {
      await query(`UPDATE subscriptions SET status = 'expired', updated_at = now() WHERE id = $1`, [s.id]);
      results.push({ id: s.id, result: "expired" });
      continue;
    }
    if (s.amount_minor == null) { results.push({ id: s.id, skipped: "no_price" }); continue; }
    const pm = await one<{ pm_id: string; psp_pm: string | null; psp_customer_id: string | null }>(
      `SELECT pm.id AS pm_id, pm.psp_payment_method_id AS psp_pm, c.psp_customer_id
         FROM customers c
         LEFT JOIN payment_methods pm ON pm.customer_id = c.id AND pm.is_default
        WHERE c.id = $1 ORDER BY pm.created_at DESC NULLS LAST LIMIT 1`,
      [s.customer_id]
    );
    if (!pm?.psp_pm) { results.push({ id: s.id, skipped: "no_payment_method" }); continue; }

    const charge = await psp.charge({
      pspCustomerId: pm.psp_customer_id || "",
      paymentMethodId: pm.psp_pm,
      amountMinor: s.amount_minor,
      currency: s.currency,
      description: `MandaMix subscription ${s.id}`,
    });

    const now = new Date();
    if (charge.status === "succeeded") {
      const periodEnd = addInterval(now, s.interval);
      const inv = await one<{ id: string }>(
        `INSERT INTO invoices (subscription_id, customer_id, status, currency, subtotal_minor, tax_minor, total_minor, period_start, period_end, paid_at)
         VALUES ($1, $2, 'paid', $3, $4, 0, $4, $5, $6, now()) RETURNING id`,
        [s.id, s.customer_id, s.currency, s.amount_minor, now, periodEnd]
      );
      await query(
        `INSERT INTO payments (invoice_id, customer_id, payment_method_id, psp_payment_intent_id, status, amount_minor, currency)
         VALUES ($1, $2, $3, $4, 'succeeded', $5, $6)`,
        [inv!.id, s.customer_id, pm.pm_id, charge.pspPaymentId, s.amount_minor, s.currency]
      );
      await query(
        `UPDATE subscriptions SET status = 'active', current_period_start = $2, current_period_end = $3, updated_at = now() WHERE id = $1`,
        [s.id, now, periodEnd]
      );
      results.push({ id: s.id, result: "charged", amount_minor: s.amount_minor });
    } else {
      await query(
        `INSERT INTO payments (customer_id, psp_payment_intent_id, status, amount_minor, currency, failure_code)
         VALUES ($1, $2, 'failed', $3, $4, $5)`,
        [s.customer_id, charge.pspPaymentId, s.amount_minor, s.currency, charge.failureCode || "unknown"]
      );
      await query(`UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE id = $1`, [s.id]);
      results.push({ id: s.id, result: "past_due", failure: charge.failureCode });
    }
  }

  return ok({ processed: results.length, results });
}
