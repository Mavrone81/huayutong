import { currentUserId, ok, err } from "@/server/http";
import { latestSubscription, USD } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateLabel = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

export async function GET() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);
  const s = await latestSubscription(userId);
  if (!s) return ok({ subscription: null });
  return ok({
    subscription: {
      id: s.id,
      status: s.status,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      planCode: s.plan_code,
      priceLabel: s.amount_minor != null ? USD(s.amount_minor) : "—",
      trialEndsAt: dateLabel(s.trial_ends_at),
      currentPeriodEnd: dateLabel(s.current_period_end),
      paymentMethod: s.brand ? `💳 ${s.brand} •••• ${s.last4}` : "—",
    },
  });
}
