import { one } from "@/server/db";
import { currentUserId, ok, err } from "@/server/http";
import { ensureCustomer } from "@/server/billing";
import { getPsp } from "@/server/psp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);

  const u = await one<{ email: string | null; display_name: string | null }>(`SELECT email, display_name FROM users WHERE id = $1`, [userId]);
  const cust = await ensureCustomer(userId);
  const psp = getPsp();
  const pspCustomerId = await psp.ensureCustomer({ userId, email: u?.email ?? null, name: u?.display_name || "Learner", pspCustomerId: cust.psp_customer_id });
  if (pspCustomerId !== cust.psp_customer_id) {
    await one(`UPDATE customers SET psp_customer_id = $1 WHERE id = $2 RETURNING id`, [pspCustomerId, cust.id]);
  }
  const session = await psp.createSetupSession({ pspCustomerId });
  return ok({ ...session, provider: psp.name });
}
