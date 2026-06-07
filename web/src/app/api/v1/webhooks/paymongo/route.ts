import { query } from "@/server/db";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PayMongo posts events here. Signature is verified against PAYMONGO_WEBHOOK_SECRET.
// Idempotent via webhook_events.provider_event_id.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("paymongo-signature");
  const evt = getPsp().verifyWebhook(raw, sig);
  if (!evt) return new Response("invalid signature", { status: 400 });

  const event = (evt as any).data ?? evt;
  const eventId: string = event?.id || crypto.randomUUID();
  const type: string = event?.attributes?.type || (evt as any).type || "unknown";

  // Dedupe
  const seen = await query(`SELECT 1 FROM webhook_events WHERE provider = 'paymongo' AND provider_event_id = $1`, [eventId]);
  if (seen.length) return Response.json({ ok: true, duplicate: true });
  await query(
    `INSERT INTO webhook_events (provider, provider_event_id, type, payload, processed_at) VALUES ('paymongo', $1, $2, $3, now())`,
    [eventId, type, JSON.stringify(evt)]
  );

  // Map a couple of core events. (PayMongo names: payment.paid / payment.failed)
  try {
    if (type === "payment.paid") {
      const pid = event?.attributes?.data?.id;
      if (pid) await query(`UPDATE payments SET status = 'succeeded' WHERE psp_payment_intent_id = $1`, [pid]);
    } else if (type === "payment.failed") {
      const pid = event?.attributes?.data?.id;
      if (pid) await query(`UPDATE payments SET status = 'failed' WHERE psp_payment_intent_id = $1`, [pid]);
    }
  } catch {
    // swallow — event is already persisted for replay
  }

  return Response.json({ ok: true });
}
