"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

type AuditRow = { time: string; actor: string; action: string; chip: string; target: string; detail: string };

export default function Admin() {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([
    { time: "06 Jun 11:42", actor: "ops_admin", action: "trial.extend", chip: "gold", target: "cus_2Kd91", detail: "+7 days · reason: onboarding bug T-1842" },
    { time: "06 Jun 10:18", actor: "system/webhook", action: "invoice.payment_failed", chip: "red", target: "cus_7Pq33", detail: "card_declined · dunning retry scheduled day 1" },
    { time: "06 Jun 09:55", actor: "finance_admin", action: "refund.issue", chip: "navy", target: "cus_5Rt18", detail: "$5.99 full · consumer-law window (TH)" },
    { time: "05 Jun 22:03", actor: "system/webhook", action: "invoice.payment_succeeded", chip: "teal", target: "cus_9Zw44", detail: "$44.99 annual · receipt sent (vi)" },
    { time: "05 Jun 18:31", actor: "content_admin", action: "content.publish", chip: "teal", target: "HSK2 · Unit 旅游", detail: "blocked → 4 items missing glosses" },
  ]);

  const act = (msg: string) => {
    setAudit((a) => [{ time: "06 Jun now", actor: "ops_admin", action: "admin.action", chip: "gold", target: "cus_8Hf2k", detail: msg }, ...a]);
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="adm">
      <aside className="adm-side">
        <Logo />
        <div className="sec">Operations</div>
        <button className={tab === 0 ? "on" : ""} onClick={() => setTab(0)}>📊 Overview</button>
        <button className={tab === 1 ? "on" : ""} onClick={() => setTab(1)}>👥 Customers &amp; Billing</button>
        <div className="sec">Content</div>
        <button className={tab === 2 ? "on" : ""} onClick={() => setTab(2)}>🌐 Content &amp; Localization</button>
        <div className="sec">Compliance</div>
        <button className={tab === 3 ? "on" : ""} onClick={() => setTab(3)}>📜 Audit log</button>
        <div style={{ marginTop: 30, padding: 12, background: "rgba(255,255,255,.06)", borderRadius: 12, fontSize: 11.5, color: "#9FB4C8" }}>
          🔐 RBAC: you are signed in as <b style={{ color: "#fff" }}>ops_admin</b>. Refunds and trial extensions are audited.
        </div>
      </aside>

      <main className="adm-main">
        {tab === 0 && (
          <>
            <h1>Operations overview</h1>
            <p className="sub">Saturday 6 June 2026 · all times UTC+7 · data refreshed 5 min ago</p>
            <div className="kpis">
              <Kpi s="MRR" v="$18,420" d="▲ 12.4% vs May" up />
              <Kpi s="Active subscribers" v="3,075" d="▲ 286 this month" up />
              <Kpi s="In trial (1-month)" v="1,512" d="▲ 9.1% — first charge: 6 Jul" up />
              <Kpi s="Trial → paid" v="52.3%" d="▲ target ≥ 50%" up />
              <Kpi s="Past due (dunning)" v="94" d="▼ retry day 3 of 7" />
              <Kpi s="Involuntary churn" v="1.2%/mo" d="within ≤1.5% target" up />
              <Kpi s="Payment success" v="93.8%" d="target ≥ 90%" up />
              <Kpi s="Refunds (30d)" v="$214" d="11 issued · all audited" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              <div className="card panel">
                <h3>Signups by market — this week</h3>
                <div className="wk" style={{ height: 110 }}>
                  {[["TH", 62], ["VN", 88], ["MY", 46], ["SG", 30], ["Other", 18]].map((m, i) => (
                    <div key={i} className="hit"><i style={{ height: `${m[1]}%` }} />{m[0]}</div>
                  ))}
                </div>
                <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>2,841 signups · Vietnam leading after the HSK 3.0 launch campaign</small>
              </div>
              <div className="card panel">
                <h3>Subscription states</h3>
                <Cov b="Trialing" w="31%" v="1,512" bg="linear-gradient(90deg,var(--gold),#F2B95C)" />
                <Cov b="Active" w="63%" v="3,075" />
                <Cov b="Past due" w="2%" v="94" bg="var(--red)" />
                <Cov b="Canceled (mo.)" w="4%" v="183" bg="#B6C3D2" />
              </div>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <h1>Customers &amp; billing</h1>
            <p className="sub">GET /admin/customers · actions call POST /admin/refunds and /admin/trials/extend (idempotent, audited)</p>
            <div className="searchbar">
              <input placeholder="Search by email, name or customer ID…" />
              <button className="btn btn-navy btn-sm">Search</button>
              <button className="btn btn-ghost btn-sm">Filter: Past due ▾</button>
              <button className="btn btn-primary btn-sm" onClick={() => act("User created · set-password invite sent")}>➕ Create user</button>
            </div>
            <div className="card" style={{ padding: "6px 16px", marginBottom: 18, overflowX: "auto" }}>
              <table className="atable">
                <tbody>
                  <tr><th>Customer</th><th>Market</th><th>Plan</th><th>Status</th><th>Next / first charge</th><th>LTV</th><th /></tr>
                  <tr><td><b>Ploy Suwannarat</b><br /><small style={{ color: "var(--ink-3)" }}>ploy@example.com</small></td><td>🇹🇭 TH · th</td><td>Monthly $5.99</td><td><span className="chip gold">trialing</span></td><td>6 Jul 2026 · $5.99</td><td>$0</td><td><button className="btn btn-ghost btn-sm">Open</button></td></tr>
                  <tr><td><b>Minh Nguyen</b><br /><small style={{ color: "var(--ink-3)" }}>minh.n@example.vn</small></td><td>🇻🇳 VN · vi</td><td>Annual $44.99</td><td><span className="chip teal">active</span></td><td>14 Feb 2027</td><td>$89.98</td><td><button className="btn btn-ghost btn-sm">Open</button></td></tr>
                  <tr><td><b>Aisyah Rahman</b><br /><small style={{ color: "var(--ink-3)" }}>aisyah@example.my</small></td><td>🇲🇾 MY · ms</td><td>Monthly $5.99</td><td><span className="chip red">past_due</span></td><td>retry #2 tomorrow</td><td>$35.94</td><td><button className="btn btn-ghost btn-sm">Open</button></td></tr>
                  <tr><td><b>Somchai K.</b><br /><small style={{ color: "var(--ink-3)" }}>somchai@example.com</small></td><td>🇹🇭 TH · th</td><td>Monthly $5.99</td><td><span className="chip navy">canceled</span></td><td>access until 28 Jun</td><td>$17.97</td><td><button className="btn btn-ghost btn-sm">Open</button></td></tr>
                </tbody>
              </table>
            </div>
            <div className="card panel">
              <h3><span>Ploy Suwannarat — cus_8Hf2k</span><span className="chip gold">trialing</span></h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 30px" }}>
                <div>
                  <Cov b="Subscription" plain="sub_91xA2 · Premium Monthly" />
                  <Cov b="Trial ends" plain="6 Jul 2026 09:00 (30 days)" />
                  <Cov b="First charge" plain="$5.99 · Visa •••• 4242" />
                  <Cov b="Reminders" plain="T-3d ✓ · T-24h ✓ scheduled" />
                </div>
                <div>
                  <Cov b="UI language" plain="ไทย (th)" />
                  <Cov b="Course" plain="HSK 1 · 78% ready · 12-day streak" />
                  <Cov b="Devices" plain="iPhone (push ✓) · Web" />
                  <Cov b="Webhooks" plain="setup_intent.succeeded ✓" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
                <button className="btn btn-navy btn-sm" onClick={() => act("Trial extended +7d for cus_8Hf2k")}>⏳ Extend trial +7 days</button>
                <button className="btn btn-navy btn-sm" onClick={() => act("Price override $4.99/mo for cus_8Hf2k")}>💲 Change price…</button>
                <button className="btn btn-ghost btn-sm" onClick={() => act("Password reset link sent (expires 1h)")}>🔑 Reset password</button>
                <button className="btn btn-ghost btn-sm" onClick={() => act("Refund issued for cus_8Hf2k")}>↩ Issue refund…</button>
                <button className="btn btn-ghost btn-sm">✉ Resend receipt</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "var(--red-soft)" }}>Cancel subscription</button>
                {toast && <span className="chip teal">✓ {toast} — written to audit log</span>}
              </div>
            </div>
          </>
        )}

        {tab === 2 && (
          <>
            <h1>Content &amp; localization</h1>
            <p className="sub">Publish gate: an item cannot ship unless all four glosses (EN · TH · VI · MS) exist — GET /admin/content/items?missing_gloss=…</p>
            <div className="card panel" style={{ marginBottom: 18, borderLeft: "4px solid var(--red)" }}>
              <b style={{ color: "var(--red)" }}>⛔ 12 items are blocked from publishing</b>
              <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 6 }}>HSK 2 · Unit “Travel basics” is 96% localized. The items below are missing at least one gloss and will not appear to learners until complete.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
              <div className="card" style={{ padding: "6px 16px", overflowX: "auto" }}>
                <table className="atable">
                  <tbody>
                    <tr><th>Item</th><th>Pinyin</th><th>HSK</th><th>EN</th><th>TH</th><th>VI</th><th>MS</th><th /></tr>
                    <GlossRow hz="护照" py="hùzhào" miss={["VI"]} />
                    <GlossRow hz="行李箱" py="xínglixiāng" miss={["TH"]} />
                    <GlossRow hz="登机牌" py="dēngjīpái" miss={["TH", "VI"]} />
                    <GlossRow hz="签证" py="qiānzhèng" miss={["MS"]} />
                  </tbody>
                </table>
              </div>
              <div style={{ display: "grid", gap: 18 }}>
                <div className="card panel">
                  <h3>Gloss coverage by language</h3>
                  <Cov b="English" w="100%" v="100%" />
                  <Cov b="ไทย" w="99%" v="98.9%" />
                  <Cov b="Tiếng Việt" w="98%" v="98.2%" />
                  <Cov b="B. Melayu" w="99%" v="99.1%" />
                </div>
                <div className="card panel">
                  <h3>Course build status</h3>
                  <Cov b="HSK 1" w="100%" v="live" />
                  <Cov b="HSK 2" w="96%" v="96%" bg="linear-gradient(90deg,var(--gold),#F2B95C)" />
                  <Cov b="HSK 3" w="61%" v="61%" bg="linear-gradient(90deg,var(--gold),#F2B95C)" />
                  <Cov b="HSK 4–6" w="18%" v="18%" bg="#B6C3D2" />
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 3 && (
          <>
            <h1>Audit log</h1>
            <p className="sub">Every billing and entitlement mutation is recorded — admin_users → audit_logs (immutable, exportable)</p>
            <div className="card" style={{ padding: "6px 16px", overflowX: "auto" }}>
              <table className="atable">
                <tbody>
                  <tr><th>Time (UTC+7)</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr>
                  {audit.map((r, i) => (
                    <tr key={i}><td>{r.time}</td><td>{r.actor}</td><td><span className={"chip " + r.chip}>{r.action}</span></td><td>{r.target}</td><td>{r.detail}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ s, v, d, up }: { s: string; v: string; d: string; up?: boolean }) {
  return <div className="card kpi"><small>{s}</small><div className="v">{v}</div><div className={"d " + (up ? "up" : "dn")}>{d}</div></div>;
}
function Cov({ b, w, v, bg, plain }: { b: string; w?: string; v?: string; bg?: string; plain?: string }) {
  if (plain) return <div className="cov"><b>{b}</b><span style={{ width: "auto", fontWeight: 600 }}>{plain}</span></div>;
  return <div className="cov"><b>{b}</b><div className="bar"><i style={{ width: w, background: bg }} /></div><span>{v}</span></div>;
}
function GlossRow({ hz, py, miss }: { hz: string; py: string; miss: string[] }) {
  const cell = (lang: string) => miss.includes(lang)
    ? <td style={{ color: "var(--red)", fontWeight: 800 }}>—</td>
    : <td>✓</td>;
  return (
    <tr>
      <td className="hanzi" style={{ fontSize: 18, fontWeight: 700 }}>{hz}</td><td>{py}</td><td>2</td>
      {cell("EN")}{cell("TH")}{cell("VI")}{cell("MS")}
      <td><button className="btn btn-ghost btn-sm">Add {miss.length > 1 ? miss.length : miss[0]}</button></td>
    </tr>
  );
}
