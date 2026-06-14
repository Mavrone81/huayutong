import { query, one } from "@/server/db";
import { ok, err, readJson } from "@/server/http";
import { addInterval } from "@/server/billing";
import { resolveCountry, taxRateBps, splitInclusive } from "@/server/tax";
import { scheduleReceipt, scheduleDunningPrompt } from "@/server/notifications";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Smart-retry schedule (days between attempts) and caps — PRD §5.7.
const RETRY_GAP_DAYS = (process.env.DUNNING_RETRY_GAP_DAYS || "1,3,7").split(",").map((n) => Number(n.trim()) || 1);
const MAX_ATTEMPTS = Number(process.env.DUNNING_MAX_ATTEMPTS || 4);
const GRACE_DAYS = Number(process.env.PAST_DUE_GRACE_DAYS || process.env.DUNNING_GRACE_DAYS || 7);

// The trial-charge + renewal + dunning runner. In production this is a cron
// (e.g. every 15 min) calling this endpoint with the INTERNAL_BILLING_SECRET.
export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_BILLING_SECRET) return err("forbidden", "Bad internal secret", 403);

  const b = await readJson<{ subscriptionId?: string }>(req);
  const forced = b?.subscriptionId ?? null;

  const due = await query<{ id: string; status: string; customer_id: string; currency: string; interval: "month" | "year" | null; amount_minor: number | null; cancel_at_period_end: boolean }>(
    `SELECT s.id, s.status, s.customer_id, s.currency, p.interval,
            COALESCE(s.price_override_minor, pr.amount_minor) AS amount_minor, s.cancel_at_period_end
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

    // Count failed charges in the current dunning cycle (since the last success).
    const h = await one<{ fails: number; last_fail: string | null; first_fail: string | null }>(
      `SELECT count(*)::int AS fails, max(created_at) AS last_fail, min(created_at) AS first_fail
         FROM payments
        WHERE customer_id = $1 AND status = 'failed'
          AND created_at > COALESCE((SELECT max(created_at) FROM payments WHERE customer_id = $1 AND status = 'succeeded'), 'epoch')`,
      [s.customer_id]
    );
    const priorFails = h?.fails || 0;
    const firstFail = h?.first_fail ? new Date(h.first_fail) : null;
    const lastFail = h?.last_fail ? new Date(h.last_fail) : null;

    // Dunning gate: for past_due, honor retry spacing and the grace window (unless forced).
    if (s.status === "past_due" && !forced) {
      const graceExhausted = firstFail ? Date.now() > firstFail.getTime() + GRACE_DAYS * 86400000 : false;
      if (priorFails >= MAX_ATTEMPTS || graceExhausted) {
        await query(`UPDATE subscriptions SET status = 'canceled', canceled_at = now(), updated_at = now() WHERE id = $1`, [s.id]);
        results.push({ id: s.id, result: "dunning_exhausted", attempts: priorFails });
        continue;
      }
      const gapDays = RETRY_GAP_DAYS[Math.min(priorFails - 1, RETRY_GAP_DAYS.length - 1)] ?? RETRY_GAP_DAYS[RETRY_GAP_DAYS.length - 1];
      if (lastFail && Date.now() < lastFail.getTime() + gapDays * 86400000) {
        results.push({ id: s.id, result: "retry_scheduled", nextInDays: gapDays });
        continue;
      }
    }

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
    const meta = await one<{ user_id: string; ui_language: string; billing_country: string | null }>(
      `SELECT u.id AS user_id, u.ui_language, c.billing_country FROM customers c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [s.customer_id]
    );

    if (charge.status === "succeeded") {
      // Tax-inclusive: the charged gross already includes destination VAT/GST.
      const country = resolveCountry(meta?.billing_country, meta?.ui_language);
      const { subtotalMinor, taxMinor } = splitInclusive(s.amount_minor, taxRateBps(country));
      const periodEnd = addInterval(now, s.interval);
      const inv = await one<{ id: string }>(
        `INSERT INTO invoices (subscription_id, customer_id, status, currency, subtotal_minor, tax_minor, total_minor, period_start, period_end, paid_at)
         VALUES ($1, $2, 'paid', $3, $4, $5, $6, $7, $8, now()) RETURNING id`,
        [s.id, s.customer_id, s.currency, subtotalMinor, taxMinor, s.amount_minor, now, periodEnd]
      );
      await query(
        `INSERT INTO payments (invoice_id, customer_id, payment_method_id, psp_payment_intent_id, status, amount_minor, currency, attempt_count)
         VALUES ($1, $2, $3, $4, 'succeeded', $5, $6, $7)`,
        [inv!.id, s.customer_id, pm.pm_id, charge.pspPaymentId, s.amount_minor, s.currency, priorFails + 1]
      );
      await query(
        `UPDATE subscriptions SET status = 'active', current_period_start = $2, current_period_end = $3, updated_at = now() WHERE id = $1`,
        [s.id, now, periodEnd]
      );
      if (meta?.user_id) {
        await scheduleReceipt(meta.user_id, meta.ui_language || "en", {
          amountMinor: s.amount_minor, subtotalMinor, taxMinor, currency: s.currency, country, periodEnd: periodEnd.toISOString(),
        });
      }
      results.push({ id: s.id, result: "charged", amount_minor: s.amount_minor, tax_minor: taxMinor, country });
    } else if (charge.status === "requires_action") {
      // SCA/3DS: needs customer authentication, not a decline. Record as pending and
      // move to past_due so the learner keeps grace-window access while authenticating.
      await query(
        `INSERT INTO payments (customer_id, payment_method_id, psp_payment_intent_id, status, amount_minor, currency)
         VALUES ($1, $2, $3, 'requires_action', $4, $5)`,
        [s.customer_id, pm.pm_id, charge.pspPaymentId, s.amount_minor, s.currency]
      );
      await query(`UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE id = $1`, [s.id]);
      results.push({ id: s.id, result: "requires_action" });
    } else {
      const attempt = priorFails + 1;
      await query(
        `INSERT INTO payments (customer_id, payment_method_id, psp_payment_intent_id, status, amount_minor, currency, failure_code, attempt_count)
         VALUES ($1, $2, $3, 'failed', $4, $5, $6, $7)`,
        [s.customer_id, pm.pm_id, charge.pspPaymentId, s.amount_minor, s.currency, charge.failureCode || "unknown", attempt]
      );
      if (attempt >= MAX_ATTEMPTS) {
        // Final attempt failed — exhaust dunning and downgrade.
        await query(`UPDATE subscriptions SET status = 'canceled', canceled_at = now(), updated_at = now() WHERE id = $1`, [s.id]);
        results.push({ id: s.id, result: "dunning_exhausted", attempts: attempt, failure: charge.failureCode });
      } else {
        await query(`UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE id = $1`, [s.id]);
        if (meta?.user_id) await scheduleDunningPrompt(meta.user_id, meta.ui_language || "en", { attempt, failure: charge.failureCode || "unknown" });
        results.push({ id: s.id, result: "past_due", attempt, failure: charge.failureCode });
      }
    }
  }

  return ok({ processed: results.length, results });
}
