import { query } from "@/server/db";
import { ok } from "@/server/http";
import { USD } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cur = process.env.DEFAULT_CURRENCY || "USD";
  const rows = await query<{ code: string; name: string; interval: string | null; trial_days: number; amount_minor: number | null }>(
    `SELECT p.code, p.name, p.interval, p.trial_days, pr.amount_minor
       FROM plans p
       LEFT JOIN prices pr ON pr.plan_id = p.id AND pr.currency = $1
      WHERE p.is_active
      ORDER BY CASE p.code WHEN 'free' THEN 0 WHEN 'premium_monthly' THEN 1 WHEN 'premium_annual' THEN 2 ELSE 3 END`,
    [cur]
  );
  return ok(
    rows.map((r) => ({
      code: r.code,
      name: r.name,
      interval: r.interval,
      trialDays: r.trial_days,
      priceLabel: r.amount_minor == null ? "$0" : `${USD(r.amount_minor)}/${r.interval}`,
      popular: r.code === "premium_monthly",
    }))
  );
}
