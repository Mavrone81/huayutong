import crypto from "node:crypto";

// Payment-provider abstraction. Real PayMongo when PAYMONGO_SECRET_KEY is set,
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

function paymongo(): Psp {
  const sk = process.env.PAYMONGO_SECRET_KEY!;
  const base = "https://api.paymongo.com/v1";
  const authHeader = "Basic " + Buffer.from(sk + ":").toString("base64");

  const call = async (path: string, method: string, attributes?: any) => {
    const r = await fetch(base + path, {
      method,
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: attributes ? JSON.stringify({ data: { attributes } }) : undefined,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`paymongo ${r.status}: ${JSON.stringify(j)}`);
    return j.data;
  };

  return {
    name: "paymongo",
    async ensureCustomer(i) {
      if (i.pspCustomerId) return i.pspCustomerId;
      try {
        const d = await call("/customers", "POST", {
          email: i.email || undefined,
          first_name: i.name || "Learner",
          default_device: "web",
        });
        return d.id;
      } catch {
        return "cus_pm_" + i.userId.slice(0, 8);
      }
    },
    async createSetupSession() {
      // The browser collects a PaymentMethod with the public key, then posts the
      // payment_method id to /billing/trials. (PayMongo has no SetupIntent object.)
      return { provider: "paymongo", clientKey: "", publicKey: process.env.PAYMONGO_PUBLIC_KEY || null };
    },
    async charge(i) {
      const pi = await call("/payment_intents", "POST", {
        amount: i.amountMinor,
        currency: i.currency,
        payment_method_allowed: ["card"],
        capture_type: "automatic",
        description: i.description,
        setup_future_usage: { session_type: "off_session" },
      });
      try {
        const c = await call(`/payment_intents/${pi.id}/attach`, "POST", { payment_method: i.paymentMethodId });
        const st = c.attributes.status;
        if (st === "succeeded") return { status: "succeeded", pspPaymentId: c.id };
        if (st === "awaiting_next_action") return { status: "requires_action", pspPaymentId: c.id };
        return { status: "failed", pspPaymentId: c.id, failureCode: st };
      } catch {
        return { status: "failed", pspPaymentId: pi.id, failureCode: "attach_failed" };
      }
    },
    async refund(i) {
      const d = await call("/refunds", "POST", {
        amount: i.amountMinor,
        payment_id: i.pspPaymentId,
        reason: "requested_by_customer",
      });
      return { pspRefundId: d.id };
    },
    verifyWebhook(raw, sig) {
      const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
      if (!secret || !sig) {
        try { return JSON.parse(raw); } catch { return null; }
      }
      try {
        const parts = Object.fromEntries(sig.split(",").map((kv) => kv.split("="))) as Record<string, string>;
        const signed = `${parts.t}.${raw}`;
        const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
        const provided = parts.te || parts.li || "";
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
  return process.env.PAYMONGO_SECRET_KEY ? paymongo() : mock();
}
