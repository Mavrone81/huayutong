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

  // Map core PaymentIntent events. (object.id is the PaymentIntent id we store on payments.)
  try {
    if (type === "payment_intent.succeeded") {
      if (object?.id) await query(`UPDATE payments SET status = 'succeeded' WHERE psp_payment_intent_id = $1`, [object.id]);
    } else if (type === "payment_intent.payment_failed") {
      if (object?.id) await query(`UPDATE payments SET status = 'failed' WHERE psp_payment_intent_id = $1`, [object.id]);
    }
  } catch {
    // swallow — event is already persisted for replay
  }

  return Response.json({ ok: true });
}
