import { query } from "@/server/db";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe posts events here. Signature is verified against STRIPE_WEBHOOK_SECRET.
// Idempotent via webhook_events.provider_event_id.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const evt = getPsp().verifyWebhook(raw, sig) as any;
  if (!evt) return new Response("invalid signature", { status: 400 });

  const eventId: string = evt?.id || crypto.randomUUID();
  const type: string = evt?.type || "unknown";
  const object = evt?.data?.object;

  // Dedupe
  const seen = await query(`SELECT 1 FROM webhook_events WHERE provider = 'stripe' AND provider_event_id = $1`, [eventId]);
  if (seen.length) return Response.json({ ok: true, duplicate: true });
  await query(
    `INSERT INTO webhook_events (provider, provider_event_id, type, payload, processed_at) VALUES ('stripe', $1, $2, $3, now())`,
    [eventId, type, JSON.stringify(evt)]
  );

  // Drive subscription state from PSP events (PRD §5.6 — webhook-driven, never from
  // client claims). Subscriptions are matched by their stored psp_subscription_id;
  // payments by the PaymentIntent id. Failures are swallowed since the event is
  // already persisted for replay.
  try {
    switch (type) {
      case "invoice.payment_succeeded": {
        if (object?.subscription)
          await query(`UPDATE subscriptions SET status = 'active', updated_at = now() WHERE psp_subscription_id = $1`, [object.subscription]);
        break;
      }
      case "invoice.payment_failed": {
        if (object?.subscription)
          await query(`UPDATE subscriptions SET status = 'past_due', updated_at = now() WHERE psp_subscription_id = $1`, [object.subscription]);
        break;
      }
      case "customer.subscription.updated": {
        // Sync status when Stripe is the source of truth (only known states).
        if (object?.id && object?.status)
          await query(
            `UPDATE subscriptions SET status = $2, updated_at = now()
              WHERE psp_subscription_id = $1 AND $2 IN ('trialing','active','past_due','canceled')`,
            [object.id, object.status]
          );
        break;
      }
      case "customer.subscription.deleted": {
        if (object?.id)
          await query(`UPDATE subscriptions SET status = 'canceled', canceled_at = now(), updated_at = now() WHERE psp_subscription_id = $1`, [object.id]);
        break;
      }
      case "charge.refunded": {
        if (object?.payment_intent)
          await query(`UPDATE payments SET status = 'refunded' WHERE psp_payment_intent_id = $1`, [object.payment_intent]);
        break;
      }
      case "payment_intent.succeeded": {
        if (object?.id) await query(`UPDATE payments SET status = 'succeeded' WHERE psp_payment_intent_id = $1`, [object.id]);
        break;
      }
      case "payment_intent.payment_failed": {
        if (object?.id) await query(`UPDATE payments SET status = 'failed' WHERE psp_payment_intent_id = $1`, [object.id]);
        break;
      }
      // customer.subscription.trial_will_end → reminders are scheduled at trial start.
    }
  } catch {
    // swallow — event is already persisted for replay
  }

  return Response.json({ ok: true });
}
