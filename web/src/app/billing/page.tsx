"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { api, SubscriptionDTO } from "@/lib/api";

export default function Billing() {
  const { t } = useI18n();
  const [sub, setSub] = useState<SubscriptionDTO | null | "loading">("loading");
  const [modal, setModal] = useState(false);

  const load = () => api.getSubscription().then(setSub).catch(() => setSub(null));
  useEffect(() => { load(); }, []);

  const doCancel = async () => {
    try { await api.cancelSubscription(); } catch { /* ignore */ }
    setModal(false);
    load();
  };

  const canceled = sub && sub !== "loading" && (sub.cancelAtPeriodEnd || sub.status === "canceled" || sub.status === "expired");
  const trialing = sub && sub !== "loading" && sub.status === "trialing";

  return (
    <AppShell active="account">
      <div className="bill">
        {sub === "loading" && <div className="card panel">Loading your subscription…</div>}

        {sub === null && (
          <div className="trial-banner">
            <div>
              <b style={{ fontSize: 17 }}>No active subscription</b>
              <p>Start your 1-month free trial to unlock the full HSK 1–6 path. You won&apos;t be charged until the trial ends.</p>
            </div>
            <Link className="btn btn-primary" href="/onboarding">{t("trial_cta", "Start 1-month free trial")}</Link>
          </div>
        )}

        {sub && sub !== "loading" && (
          <>
            <div className="trial-banner">
              <div>
                <div className="days">30 <span style={{ fontSize: 16, color: "#B9CBDC" }}>days left</span></div>
                <b style={{ fontSize: 17 }}>{canceled ? t("tb_h_c", "Trial canceled — access until trial end") : `Your free trial ends ${sub.trialEndsAt ?? ""}`}</b>
                <p>{canceled
                  ? t("tb_p_c", "You will not be charged. You can resubscribe anytime to keep Premium.")
                  : `You'll be charged ${sub.priceLabel} on ${sub.trialEndsAt} unless you cancel. We'll remind you 3 days and 24 hours before. Cancel anytime — you keep access until the trial ends.`}</p>
              </div>
              {!canceled && <button className="btn btn-primary">Keep Premium</button>}
            </div>

            <div className="resp-2col">
              <div className="card panel">
                <h3>Subscription</h3>
                <Row k="Plan" v={<b>{sub.planCode === "premium_annual" ? "Premium Annual" : "Premium Monthly"}</b>} />
                <Row k="Status" v={<span className={"chip " + (canceled ? "red" : trialing ? "gold" : "teal")}>{canceled ? t("canceled", "Canceled") : sub.status}</span>} />
                <Row k={trialing ? "First charge" : "Renews"} v={<b>{(trialing ? sub.trialEndsAt : sub.currentPeriodEnd) ?? "—"} · {sub.priceLabel}</b>} />
                <Row k="Payment method" v={<b>{sub.paymentMethod}</b>} last />
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost btn-sm">Update card</button>
                  {!canceled && <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "var(--red-soft)" }} onClick={() => setModal(true)}>Cancel trial</button>}
                </div>
              </div>
              <div className="card panel">
                <h3>Billing history</h3>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 14 }}><span>Trial started</span><span className="chip navy">$0.00</span></div>
                <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 14 }}>Receipts will appear here after your first charge. All invoices are downloadable and localized.</p>
                <div style={{ marginTop: 18, padding: "14px 16px", background: "var(--bg)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-2)" }}>
                  🔒 Payments are processed by Stripe. MandaMix never stores your full card number.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={"modal-bg" + (modal ? " open" : "")} onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
        <div className="modal">
          <div style={{ fontSize: 44 }}>😢</div>
          <h3>Cancel your free trial?</h3>
          <p>You&apos;ll keep full premium access until the trial ends, then drop to the Free plan. Your progress, streak and vocabulary are never deleted. You won&apos;t be charged anything.</p>
          <button className="btn btn-navy" style={{ width: "100%", justifyContent: "center" }} onClick={() => setModal(false)}>Keep my trial</button>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, color: "var(--red)" }} onClick={doCancel}>Cancel trial — no charge</button>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? undefined : "1px solid var(--line)", fontSize: 14 }}>
      <span style={{ color: "var(--ink-2)" }}>{k}</span>{v}
    </div>
  );
}
