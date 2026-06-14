import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query, one } from "./db";
import { verifyPassword } from "./auth";
import { getPsp } from "./psp";

const SECRET = process.env.AUTH_JWT_SECRET || "dev-insecure-secret-change-me";
const ADMIN_TTL = 60 * 60 * 8; // 8h
export const ADMIN_COOKIE = "mm_admin";

export type AdminCtx = { adminId: string; role: string };

export class AdminError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

// ---- admin token (HS256) ----
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
export function signAdmin(adminId: string, role: string): string {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(JSON.stringify({ sub: adminId, role, k: "adm", exp: Math.floor(Date.now() / 1000) + ADMIN_TTL }));
  const sig = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}
export function verifyAdmin(token: string): AdminCtx | null {
  const parts = token.split("."); if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  try {
    const body = JSON.parse(Buffer.from(p, "base64url").toString());
    if (body.k !== "adm" || (body.exp && body.exp < Math.floor(Date.now() / 1000))) return null;
    return { adminId: body.sub, role: body.role };
  } catch { return null; }
}

export function currentAdmin(): AdminCtx | null {
  const c = cookies().get(ADMIN_COOKIE)?.value;
  return c ? verifyAdmin(c) : null;
}

export function requireAdmin(): AdminCtx {
  const a = currentAdmin();
  if (!a) throw new AdminError(401, "unauthorized", "Admin sign-in required");
  return a;
}

// ---- RBAC ----
const PERM: Record<string, string[]> = {
  "trial.extend": ["ops_admin", "admin"],
  "refund.issue": ["finance_admin", "admin"],
  "price.override": ["finance_admin", "admin"],
  "user.create": ["ops_admin", "admin"],
  "user.password_reset": ["ops_admin", "admin"],
};
export function requirePerm(ctx: AdminCtx, action: string) {
  const allowed = PERM[action] || ["admin"];
  if (!allowed.includes(ctx.role)) throw new AdminError(403, "forbidden", `Role ${ctx.role} cannot ${action}`);
}

export async function loginAdmin(email: string, password: string): Promise<AdminCtx | null> {
  const row = await one<{ id: string; role: string; password_hash: string | null }>(
    `SELECT id, role, password_hash FROM admin_users WHERE email = $1`, [email]
  );
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) return null;
  return { adminId: row.id, role: row.role };
}

export async function audit(adminId: string | null, action: string, entityType: string, entityId: string | null, metadata: any) {
  await query(
    `INSERT INTO audit_logs (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, entityType, entityId, JSON.stringify(metadata || {})]
  );
}

// ---- read models ----
export async function overview() {
  const k = await one<any>(`
    SELECT
      (SELECT COALESCE(SUM(CASE WHEN p.interval='year' THEN COALESCE(s.price_override_minor,pr.amount_minor)/12.0
                                ELSE COALESCE(s.price_override_minor,pr.amount_minor) END),0)::int
         FROM subscriptions s JOIN plans p ON p.id=s.plan_id
         LEFT JOIN prices pr ON pr.plan_id=p.id AND pr.currency=s.currency
        WHERE s.status='active') AS mrr_minor,
      (SELECT count(*)::int FROM subscriptions WHERE status='active')   AS active_subs,
      (SELECT count(*)::int FROM subscriptions WHERE status='trialing') AS in_trial,
      (SELECT count(*)::int FROM subscriptions WHERE status='past_due') AS past_due,
      (SELECT count(*)::int FROM subscriptions WHERE trial_started_at IS NOT NULL) AS trials_started,
      (SELECT count(DISTINCT subscription_id)::int FROM invoices WHERE status='paid') AS converted,
      (SELECT count(*)::int FROM payments WHERE status='succeeded') AS pay_ok,
      (SELECT count(*)::int FROM payments WHERE status='failed')    AS pay_fail,
      (SELECT COALESCE(SUM(amount_minor),0)::int FROM refunds WHERE created_at > now() - interval '30 days') AS refunds_minor,
      (SELECT count(*)::int FROM refunds WHERE created_at > now() - interval '30 days') AS refunds_n
  `);
  const markets = await query<{ lang: string; n: number }>(
    `SELECT ui_language AS lang, count(*)::int AS n FROM users WHERE status != 'deleted' GROUP BY ui_language ORDER BY n DESC`
  );
  const states = await query<{ status: string; n: number }>(
    `SELECT status, count(*)::int AS n FROM subscriptions GROUP BY status`
  );
  const conv = k.trials_started ? Math.round((k.converted / k.trials_started) * 1000) / 10 : 0;
  const paySucc = k.pay_ok + k.pay_fail ? Math.round((k.pay_ok / (k.pay_ok + k.pay_fail)) * 1000) / 10 : 0;
  return {
    mrrMinor: k.mrr_minor, activeSubs: k.active_subs, inTrial: k.in_trial, pastDue: k.past_due,
    conversionPct: conv, paymentSuccessPct: paySucc, refundsMinor: k.refunds_minor, refundsCount: k.refunds_n,
    markets, states,
  };
}

const MARKET: Record<string, string> = { th: "🇹🇭 TH", vi: "🇻🇳 VN", ms: "🇲🇾 MY", en: "🌐 EN" };
export const market = (lang: string) => MARKET[lang] || lang;

export async function listCustomers(q: string) {
  return query<any>(
    `SELECT c.id, u.display_name, u.email, u.ui_language, u.created_at,
            s.status, p.code AS plan_code, s.trial_ends_at, s.current_period_end,
            COALESCE(s.price_override_minor, pr.amount_minor) AS amount_minor, s.currency, s.price_override_minor,
            (SELECT COALESCE(SUM(amount_minor),0)::int FROM payments pay WHERE pay.customer_id=c.id AND pay.status='succeeded') AS ltv
       FROM customers c JOIN users u ON u.id = c.user_id
       LEFT JOIN LATERAL (SELECT * FROM subscriptions ss WHERE ss.customer_id = c.id ORDER BY created_at DESC LIMIT 1) s ON true
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN prices pr ON pr.plan_id = p.id AND pr.currency = s.currency
      WHERE ($1 = '' OR u.email ILIKE '%'||$1||'%' OR u.display_name ILIKE '%'||$1||'%')
      ORDER BY u.created_at DESC LIMIT 50`,
    [q]
  );
}

export async function customerDetail(customerId: string) {
  const c = await one<any>(
    `SELECT c.id, u.id AS user_id, u.display_name, u.email, u.ui_language,
            s.id AS sub_id, s.status, p.code AS plan_code, s.trial_ends_at, s.current_period_end,
            s.cancel_at_period_end, COALESCE(s.price_override_minor, pr.amount_minor) AS amount_minor, s.price_override_minor, s.currency,
            pm.brand, pm.last4, cu.psp_customer_id,
            (SELECT count(*)::int FROM lesson_progress lp WHERE lp.user_id=u.id AND lp.state='completed') AS lessons_done
       FROM customers c
       JOIN users u ON u.id = c.user_id
       JOIN customers cu ON cu.id = c.id
       LEFT JOIN LATERAL (SELECT * FROM subscriptions ss WHERE ss.customer_id = c.id ORDER BY created_at DESC LIMIT 1) s ON true
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN prices pr ON pr.plan_id = p.id AND pr.currency = s.currency
       LEFT JOIN LATERAL (SELECT brand, last4 FROM payment_methods WHERE customer_id=c.id AND is_default ORDER BY created_at DESC LIMIT 1) pm ON true
      WHERE c.id = $1`,
    [customerId]
  );
  if (!c) throw new AdminError(404, "not_found", "Customer not found");
  return c;
}

// ---- actions ----
async function latestSub(customerId: string) {
  return one<{ id: string; status: string }>(`SELECT id, status FROM subscriptions WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 1`, [customerId]);
}

export async function extendTrial(ctx: AdminCtx, customerId: string, days: number) {
  requirePerm(ctx, "trial.extend");
  const sub = await latestSub(customerId);
  if (!sub) throw new AdminError(404, "no_subscription", "No subscription");
  await query(`UPDATE subscriptions SET trial_ends_at = COALESCE(trial_ends_at, now()) + make_interval(days => $2), updated_at=now() WHERE id=$1`, [sub.id, days]);
  await audit(ctx.adminId, "trial.extend", "customer", customerId, { days });
  return { ok: true };
}

export async function issueRefund(ctx: AdminCtx, customerId: string) {
  requirePerm(ctx, "refund.issue");
  const pay = await one<{ id: string; psp_payment_intent_id: string; amount_minor: number }>(
    `SELECT id, psp_payment_intent_id, amount_minor FROM payments WHERE customer_id=$1 AND status='succeeded' ORDER BY created_at DESC LIMIT 1`,
    [customerId]
  );
  if (!pay) throw new AdminError(404, "no_payment", "No charge to refund");
  const r = await getPsp().refund({ pspPaymentId: pay.psp_payment_intent_id, amountMinor: pay.amount_minor });
  await query(`INSERT INTO refunds (payment_id, psp_refund_id, amount_minor, reason, created_by) VALUES ($1,$2,$3,$4,$5)`,
    [pay.id, r.pspRefundId, pay.amount_minor, "admin refund", ctx.adminId]);
  await query(`UPDATE payments SET status='refunded' WHERE id=$1`, [pay.id]);
  await audit(ctx.adminId, "refund.issue", "customer", customerId, { amountMinor: pay.amount_minor, pspRefundId: r.pspRefundId });
  return { ok: true, amountMinor: pay.amount_minor };
}

// Overrides below a floor (default 50% of list price) require finance approval (PRD §5.9).
const PRICE_OVERRIDE_FLOOR_PCT = Number(process.env.PRICE_OVERRIDE_FLOOR_PCT || 50);

export async function overridePrice(ctx: AdminCtx, customerId: string, amountMinor: number, reason: string) {
  requirePerm(ctx, "price.override");
  if (!reason || !reason.trim()) throw new AdminError(400, "reason_required", "A reason is required");
  if (!Number.isFinite(amountMinor) || amountMinor < 0) throw new AdminError(400, "invalid_amount", "Amount must be a non-negative integer");

  const sub = await one<{ id: string; plan_id: string; currency: string | null }>(
    `SELECT id, plan_id, currency FROM subscriptions WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [customerId]
  );
  if (!sub) throw new AdminError(404, "no_subscription", "No subscription");

  const list = await one<{ amount_minor: number }>(
    `SELECT amount_minor FROM prices WHERE plan_id=$1 AND currency=$2`,
    [sub.plan_id, sub.currency || process.env.DEFAULT_CURRENCY || "USD"]
  );
  let belowFloor = false;
  if (list?.amount_minor) {
    const floor = Math.round((list.amount_minor * PRICE_OVERRIDE_FLOOR_PCT) / 100);
    belowFloor = amountMinor < floor;
    // Below the floor requires a finance_admin; ops/general admins are blocked.
    if (belowFloor && ctx.role !== "finance_admin") {
      throw new AdminError(403, "below_floor", `Overrides below ${PRICE_OVERRIDE_FLOOR_PCT}% of list (${list.amount_minor}) require finance approval`);
    }
  }

  await query(`UPDATE subscriptions SET price_override_minor=$2, updated_at=now() WHERE id=$1`, [sub.id, amountMinor]);
  await audit(ctx.adminId, "price.override", "customer", customerId, { amountMinor, reason, listMinor: list?.amount_minor ?? null, belowFloor });
  return { ok: true };
}

export async function createUserAsAdmin(ctx: AdminCtx, input: { name?: string; email: string; language?: string }) {
  requirePerm(ctx, "user.create");
  if (!input.email) throw new AdminError(400, "email_required", "Email is required");
  const exists = await one(`SELECT id FROM users WHERE email=$1`, [input.email]);
  if (exists) throw new AdminError(409, "email_taken", "Email already exists");
  const u = await one<{ id: string }>(
    `INSERT INTO users (email, status, ui_language, display_name) VALUES ($1,'pending',$2,$3) RETURNING id`,
    [input.email, input.language || "en", input.name || null]
  );
  await audit(ctx.adminId, "user.create", "user", u!.id, { email: input.email, invite: "set-password link sent" });
  return { ok: true, userId: u!.id };
}

export async function resetUserPassword(ctx: AdminCtx, customerId: string) {
  requirePerm(ctx, "user.password_reset");
  const u = await one<{ user_id: string; email: string }>(`SELECT u.id AS user_id, u.email FROM customers c JOIN users u ON u.id=c.user_id WHERE c.id=$1`, [customerId]);
  if (!u) throw new AdminError(404, "not_found", "User not found");
  await audit(ctx.adminId, "user.password_reset", "user", u.user_id, { email: u.email, link: "expires in 1h" });
  return { ok: true };
}

// ---- content & audit ----
export async function contentCoverage() {
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM mandarin_items WHERE is_published`))!.n;
  const langs = await query<{ code: string; native_name: string }>(`SELECT code, native_name FROM languages WHERE is_learner_facing ORDER BY code`);
  const coverage = [] as { code: string; name: string; pct: number; have: number }[];
  for (const l of langs) {
    const have = (await one<{ n: number }>(
      `SELECT count(DISTINCT ig.item_id)::int AS n FROM item_glosses ig JOIN mandarin_items mi ON mi.id=ig.item_id WHERE ig.language_code=$1 AND mi.is_published`, [l.code]
    ))!.n;
    coverage.push({ code: l.code, name: l.native_name, have, pct: total ? Math.round((have / total) * 1000) / 10 : 0 });
  }
  const learnerLangs = langs.length;
  const blocked = await query<{ hanzi: string; pinyin: string; missing: number }>(
    `SELECT mi.hanzi, mi.pinyin, ($1 - count(ig.id))::int AS missing
       FROM mandarin_items mi
       LEFT JOIN item_glosses ig ON ig.item_id=mi.id AND ig.language_code IN (SELECT code FROM languages WHERE is_learner_facing)
      WHERE mi.is_published
      GROUP BY mi.id, mi.hanzi, mi.pinyin
      HAVING count(ig.id) < $1
      ORDER BY missing DESC LIMIT 20`,
    [learnerLangs]
  );
  const courses = await query<{ level: number; items: number; lessons: number }>(
    `SELECT hl.level, (SELECT count(*)::int FROM mandarin_items WHERE hsk_level=hl.level AND is_published) AS items,
            (SELECT count(*)::int FROM lessons l JOIN skills s ON s.id=l.skill_id JOIN courses c ON c.id=s.course_id WHERE c.hsk_level=hl.level) AS lessons
       FROM hsk_levels hl ORDER BY hl.level`
  );
  return { totalItems: total, coverage, blocked, courses };
}

export async function auditLog() {
  return query<any>(
    `SELECT a.created_at, COALESCE(au.email,'system') AS actor, au.role, a.action, a.entity_type, a.entity_id, a.metadata
       FROM audit_logs a LEFT JOIN admin_users au ON au.id = a.actor_admin_id
      ORDER BY a.created_at DESC LIMIT 50`
  );
}
