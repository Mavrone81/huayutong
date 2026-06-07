import { one } from "./db";

export type Entitlement = { tier: "free" | "premium"; source: string; validUntil: string | null };

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
  const until = sub.status === "trialing" ? sub.trial_ends_at : sub.current_period_end;
  return {
    tier: "premium",
    source: sub.status,
    validUntil: until ? new Date(until).toISOString() : null,
  };
}
