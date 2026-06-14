import { query } from "./db";

// Localized, scheduled notifications (PRD §5.3 pre-charge reminders, §5.5 receipts,
// §5.7 dunning prompts). Rows land in `notifications` with status='scheduled' and
// are picked up by the dispatcher at /api/v1/internal/run-notifications. Actual
// email/push delivery is left to the provider integration; this records intent.

type Channel = "email" | "push" | "in_app";

export async function scheduleNotification(
  userId: string,
  channel: Channel,
  templateKey: string,
  lang: string,
  sendAt: Date,
  payload: Record<string, any> = {}
) {
  await query(
    `INSERT INTO notifications (user_id, channel, template_key, language_code, payload, status, send_at)
     VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)`,
    [userId, channel, templateKey, lang, JSON.stringify(payload), sendAt.toISOString()]
  );
}

/** Pre-charge reminders 3 days and ~24h before a trial converts (PRD §5.3). */
export async function scheduleTrialReminders(userId: string, lang: string, trialEndsAt: Date, payload: Record<string, any>) {
  const before = (ms: number) => new Date(trialEndsAt.getTime() - ms);
  const points: [Date, string][] = [
    [before(3 * 86400000), "trial_ending_3d"],
    [before(86400000), "trial_ending_24h"],
  ];
  for (const [sendAt, key] of points) {
    for (const ch of ["email", "push", "in_app"] as Channel[]) {
      await scheduleNotification(userId, ch, key, lang, sendAt, payload);
    }
  }
}

/** Localized receipt for a successful charge (PRD §5.5). */
export async function scheduleReceipt(userId: string, lang: string, payload: Record<string, any>) {
  const now = new Date();
  await scheduleNotification(userId, "email", "payment_receipt", lang, now, payload);
  await scheduleNotification(userId, "in_app", "payment_receipt", lang, now, payload);
}

/** Dunning prompt asking the learner to update their card (PRD §5.7). */
export async function scheduleDunningPrompt(userId: string, lang: string, payload: Record<string, any>) {
  const now = new Date();
  for (const ch of ["email", "push", "in_app"] as Channel[]) {
    await scheduleNotification(userId, ch, "payment_failed_update_card", lang, now, payload);
  }
}
