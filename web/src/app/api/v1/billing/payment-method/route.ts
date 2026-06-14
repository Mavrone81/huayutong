import { one, query } from "@/server/db";
import { currentUserId, ok, err, readJson } from "@/server/http";
import { ensureCustomer } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Replace the default card — the self-serve card-update used for dunning recovery
// (PRD §5.7). The refreshed card is picked up by the next dunning retry.
export async function PUT(req: Request) {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);

  const b = await readJson<{ payment_method?: string; brand?: string; last4?: string; card_fingerprint?: string }>(req);
  if (!b?.payment_method) return err("missing_fields", "payment_method is required", 400);

  const cust = await ensureCustomer(userId);

  await query(`UPDATE payment_methods SET is_default = false WHERE customer_id = $1`, [cust.id]);
  const pm = await one<{ id: string }>(
    `INSERT INTO payment_methods (customer_id, type, psp_payment_method_id, brand, last4, is_default)
     VALUES ($1, 'card', $2, $3, $4, true) RETURNING id`,
    [cust.id, b.payment_method, b.brand || "Visa", b.last4 || "4242"]
  );
  if (b.card_fingerprint && pm) {
    try {
      await one(`UPDATE payment_methods SET fingerprint = $1 WHERE id = $2 RETURNING id`, [b.card_fingerprint, pm.id]);
    } catch {
      // fingerprint column lands with migration 0002
    }
  }

  return ok({ updated: true, paymentMethod: `💳 ${b.brand || "Visa"} •••• ${b.last4 || "4242"}` });
}
