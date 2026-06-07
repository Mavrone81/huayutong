// API client. Auth + billing hit the real backend (/api/v1, see src/app/api).
// Learning data (dashboard) is still mock until those tables are populated.
import { DashboardData } from "./types";

const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call(path: string, opts: RequestInit = {}) {
  const r = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, body?.error?.message || "Request failed", body?.error?.code);
  return body;
}

export interface PlanDTO { code: string; name: string; interval: string | null; trialDays: number; priceLabel: string; popular: boolean }
export interface SubscriptionDTO {
  id: string; status: string; cancelAtPeriodEnd: boolean; planCode: string; priceLabel: string;
  trialEndsAt: string | null; currentPeriodEnd: string | null; paymentMethod: string;
}

export const api = {
  // ---- auth ----
  register: (body: { email: string; password: string; ui_language?: string; goal?: string }) =>
    call("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (email: string, password: string) =>
    call("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => call("/auth/logout", { method: "POST" }),
  getCurrentUser: () => call("/me"),

  // ---- billing ----
  getPlans: (): Promise<PlanDTO[]> => call("/billing/plans"),
  setupIntent: () => call("/billing/setup-intent", { method: "POST" }),
  startTrial: (planCode: string, paymentMethod: string) =>
    call("/billing/trials", { method: "POST", body: JSON.stringify({ plan_code: planCode, payment_method: paymentMethod }) }),
  cancelSubscription: () => call("/billing/subscription/cancel", { method: "POST" }),
  /** Returns the subscription, or null if none / not signed in. */
  getSubscription: async (): Promise<SubscriptionDTO | null> => {
    const r = await fetch(BASE + "/billing/subscription", { credentials: "include" });
    if (r.status === 401) return null;
    const j = await r.json().catch(() => null);
    return j?.subscription ?? null;
  },

  // ---- learning (mock until course tables are seeded with progress) ----
  getDashboard: (): Promise<DashboardData> =>
    Promise.resolve({
      goalMinutes: 10, goalDone: 7, streak: 12, reviewsDue: 14, hsk1Readiness: 78,
      skills: [
        { hanzi: "问", title: "Greetings & introductions", sub: "20/20 words · 你好 · 谢谢 · 再见 · 请问", progress: 100, state: "done", color: "var(--teal)" },
        { hanzi: "数", title: "Numbers & time", sub: "24/24 words · 一 二 三 · 今天 · 点", progress: 100, state: "done", color: "var(--teal)" },
        { hanzi: "家", title: "Family & people", sub: "17/26 words · 妈妈 · 爸爸 · 哥哥 · 妹妹", progress: 65, state: "active", color: "var(--navy-2)" },
        { hanzi: "食", title: "Food & drink", sub: "0/28 words · 米饭 · 茶 · 水 · 苹果", progress: 0, state: "locked", color: "#B6C3D2" },
        { hanzi: "行", title: "Getting around", sub: "0/24 words · 出租车 · 飞机 · 火车站", progress: 0, state: "locked", color: "#B6C3D2" },
      ],
      srs: [
        { hanzi: "妈妈", gloss: "māma · mom", due: "due now" },
        { hanzi: "哥哥", gloss: "gēge · older brother", due: "due now" },
        { hanzi: "谁", gloss: "shéi · who", due: "due now" },
        { hanzi: "谢谢", gloss: "xièxie · thank you", due: "2h" },
        { hanzi: "再见", gloss: "zàijiàn · goodbye", due: "5h" },
      ],
    }),
};
