import { one } from "./db";

export type Entitlement = { tier: "free" | "premium"; source: string; validUntil: string | null };

// Limited, configurable grace window for past_due before access is revoked (PRD §5.7).
const PAST_DUE_GRACE_DAYS = Number(process.env.PAST_DUE_GRACE_DAYS || 7);

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const sub = await one<{ status: string; trial_ends_at: string | null; current_period_end: string | null }>(
    `SELECT s.status, s.trial_ends_at, s.current_period_end
       FROM subscriptions s
       JOIN customers c ON c.id = s.customer_id
      WHERE c.user_id = $1 AND s.status IN ('trialing','active','past_due')
      ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  if (!sub) return { tier: "free", source: "none", validUntil: null };

  const base = sub.status === "trialing" ? sub.trial_ends_at : sub.current_period_end;
  let until = base ? new Date(base) : null;
  // past_due keeps limited access until the grace window is exhausted, then downgrades.
  if (until && sub.status === "past_due") {
    until = new Date(until.getTime() + PAST_DUE_GRACE_DAYS * 86400000);
  }

  // Entitlement is time-bounded: an expired trial/period (or exhausted grace) is free,
  // even if the billing cron hasn't reconciled the subscription row yet.
  if (until && until.getTime() <= Date.now()) {
    return { tier: "free", source: "expired", validUntil: until.toISOString() };
  }
  return { tier: "premium", source: sub.status, validUntil: until ? until.toISOString() : null };
}

export async function isPremium(userId: string): Promise<boolean> {
  return (await getEntitlement(userId)).tier === "premium";
}
