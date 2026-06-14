import { query } from "@/server/db";
import { ok, err } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Notification dispatcher. In production a cron calls this with the
// INTERNAL_BILLING_SECRET to flush due reminders/receipts/dunning prompts to the
// email/push providers. Here it marks due rows as sent (the provider hand-off is
// where real delivery would happen).
export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_BILLING_SECRET) return err("forbidden", "Bad internal secret", 403);

  const sent = await query<{ id: string; channel: string; template_key: string }>(
    `UPDATE notifications SET status = 'sent', sent_at = now()
      WHERE status = 'scheduled' AND send_at <= now()
      RETURNING id, channel, template_key`
  );
  return ok({ sent: sent.length, notifications: sent });
}
