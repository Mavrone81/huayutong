import { query } from "@/server/db";
import { currentUserId, ok, err } from "@/server/http";
import { USD } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Billing history / downloadable receipts (PRD §5.5).
export async function GET() {
  const userId = currentUserId();
  if (!userId) return err("unauthorized", "Not signed in", 401);

  const rows = await query<{
    id: string; status: string; currency: string;
    subtotal_minor: number; tax_minor: number; total_minor: number;
    issued_at: string; paid_at: string | null;
  }>(
    `SELECT i.id, i.status, i.currency, i.subtotal_minor, i.tax_minor, i.total_minor, i.issued_at, i.paid_at
       FROM invoices i JOIN customers c ON c.id = i.customer_id
      WHERE c.user_id = $1 ORDER BY i.issued_at DESC LIMIT 50`,
    [userId]
  );

  return ok({
    invoices: rows.map((r) => ({
      id: r.id,
      status: r.status,
      currency: r.currency,
      subtotalLabel: USD(r.subtotal_minor),
      taxLabel: USD(r.tax_minor),
      totalLabel: USD(r.total_minor),
      issuedAt: r.issued_at,
      paidAt: r.paid_at,
    })),
  });
}
