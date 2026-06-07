import { one } from "./db";

export const USD = (minor: number) =>
  "$" + (minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function addInterval(d: Date, interval: "month" | "year" | null): Date {
  const r = new Date(d);
  if (interval === "month") r.setMonth(r.getMonth() + 1);
  else if (interval === "year") r.setFullYear(r.getFullYear() + 1);
  return r;
}

export async function ensureCustomer(userId: string) {
  let c = await one<{ id: string; psp_customer_id: string | null }>(
    `SELECT id, psp_customer_id FROM customers WHERE user_id = $1`,
    [userId]
  );
  if (!c) {
    c = await one(
      `INSERT INTO customers (user_id, default_currency) VALUES ($1, $2) RETURNING id, psp_customer_id`,
      [userId, process.env.DEFAULT_CURRENCY || "USD"]
    );
  }
  return c!;
}

export type SubRow = {
  id: string;
  status: string;
  plan_code: string;
  currency: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount_minor: number | null;
  brand: string | null;
  last4: string | null;
};

export async function latestSubscription(userId: string): Promise<SubRow | null> {
  return one<SubRow>(
    `SELECT s.id, s.status, p.code AS plan_code, s.currency, s.trial_ends_at, s.current_period_end,
            s.cancel_at_period_end, pr.amount_minor, pm.brand, pm.last4
       FROM subscriptions s
       JOIN customers c ON c.id = s.customer_id
       JOIN plans p ON p.id = s.plan_id
       LEFT JOIN prices pr ON pr.plan_id = p.id AND pr.currency = s.currency
       LEFT JOIN payment_methods pm ON pm.id = (
         SELECT id FROM payment_methods WHERE customer_id = c.id AND is_default ORDER BY created_at DESC LIMIT 1)
      WHERE c.user_id = $1
      ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
}
