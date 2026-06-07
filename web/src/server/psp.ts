import crypto from "node:crypto";

// Payment-provider abstraction. Real Stripe when STRIPE_SECRET_KEY is set,
// otherwise a local mock so the trial→charge→dunning flow runs without keys.

export type ChargeResult = {
  status: "succeeded" | "failed" | "requires_action";
  pspPaymentId: string;
  failureCode?: string;
};

export interface Psp {
  name: string;
  ensureCustomer(i: { userId: string; email: string | null; name: string; pspCustomerId?: string | null }): Promise<string>;
  createSetupSession(i: { pspCustomerId: string }): Promise<{ provider: string; clientKey: string; publicKey: string | null }>;
  charge(i: { pspCustomerId: string; paymentMethodId: string; amountMinor: number; currency: string; description: string }): Promise<ChargeResult>;
  refund(i: { pspPaymentId: string; amountMinor: number }): Promise<{ pspRefundId: string }>;
  verifyWebhook(rawBody: string, signature: string | null): { type: string; data: any } | null;
}

const rid = (p: string) => p + crypto.randomBytes(8).toString("hex");

function mock(): Psp {
  return {
    name: "mock",
    async ensureCustomer(i) {
      return i.pspCustomerId || "cus_mock_" + i.userId.slice(0, 8);
    },
    async createSetupSession() {
      return { provider: "mock", clientKey: rid("seti_mock_"), publicKey: null };
    },
    async charge(i) {
      // Deterministic for tests: a payment method containing "fail" declines.
      if (i.paymentMethodId.includes("fail")) {
        return { status: "failed", pspPaymentId: rid("pay_mock_"), failureCode: "card_declined" };
      }
      return { status: "succeeded", pspPaymentId: rid("pay_mock_") };
    },
    async refund() {
      return { pspRefundId: rid("ref_mock_") };
    },
    verifyWebhook(raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  };
}

// Flatten a nested object into Stripe's form-encoded bracket notation:
//   { a: { b: 1 }, c: ["x"] }  ->  a[b]=1&c[0]=x
function formEncode(params: Record<string, any>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") parts.push(formEncode(item, `${key}[${i}]`));
        else parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
      });
    } else if (v && typeof v === "object") {
      parts.push(formEncode(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

function stripe(): Psp {
  const sk = process.env.STRIPE_SECRET_KEY!;
  const base = "https://api.stripe.com/v1";

  const call = async (path: string, method: string, params?: Record<string, any>) => {
    const r = await fetch(base + path, {
      method,
      headers: { Authorization: "Bearer " + sk, "Content-Type": "application/x-www-form-urlencoded" },
      body: params ? formEncode(params) : undefined,
    });
    const j = await r.json();
    if (!r.ok) {
      const e: any = new Error(`stripe ${r.status}: ${JSON.stringify(j)}`);
      e.body = j; // declines come back as 402 with error.payment_intent attached
      throw e;
    }
    return j;
  };

  return {
    name: "stripe",
    async ensureCustomer(i) {
      if (i.pspCustomerId) return i.pspCustomerId;
      try {
        const d = await call("/customers", "POST", { email: i.email || undefined, name: i.name || "Learner" });
        return d.id;
      } catch {
        return "cus_stripe_" + i.userId.slice(0, 8);
      }
    },
    async createSetupSession(i) {
      // The browser confirms this SetupIntent with Stripe.js (publishable key + client_secret),
      // which vaults the card and yields a payment_method id posted to /billing/trials.
      const si = await call("/setup_intents", "POST", {
        customer: i.pspCustomerId,
        usage: "off_session",
        payment_method_types: ["card"],
      });
      return { provider: "stripe", clientKey: si.client_secret, publicKey: process.env.STRIPE_PUBLISHABLE_KEY || null };
    },
    async charge(i) {
      try {
        const pi = await call("/payment_intents", "POST", {
          amount: i.amountMinor,
          currency: i.currency.toLowerCase(),
          customer: i.pspCustomerId,
          payment_method: i.paymentMethodId,
          off_session: true,
          confirm: true,
          description: i.description,
        });
        if (pi.status === "succeeded") return { status: "succeeded", pspPaymentId: pi.id };
        if (pi.status === "requires_action" || pi.status === "requires_confirmation")
          return { status: "requires_action", pspPaymentId: pi.id };
        return { status: "failed", pspPaymentId: pi.id, failureCode: pi.last_payment_error?.code || pi.status };
      } catch (e: any) {
        const err = e?.body?.error;
        return {
          status: "failed",
          pspPaymentId: err?.payment_intent?.id || rid("pi_err_"),
          failureCode: err?.code || err?.decline_code || "charge_failed",
        };
      }
    },
    async refund(i) {
      const d = await call("/refunds", "POST", { payment_intent: i.pspPaymentId, amount: i.amountMinor });
      return { pspRefundId: d.id };
    },
    verifyWebhook(raw, sig) {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret || !sig) {
        try { return JSON.parse(raw); } catch { return null; }
      }
      try {
        const parts = Object.fromEntries(sig.split(",").map((kv) => kv.split("="))) as Record<string, string>;
        const signed = `${parts.t}.${raw}`;
        const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
        const provided = parts.v1 || "";
        if (provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
          return JSON.parse(raw);
        }
        return null;
      } catch {
        return null;
      }
    },
  };
}

export function getPsp(): Psp {
  return process.env.STRIPE_SECRET_KEY ? stripe() : mock();
}
