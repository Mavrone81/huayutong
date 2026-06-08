"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const usd = (m: number | null) => (m == null ? "—" : "$" + (m / 100).toLocaleString("en-US", { minimumFractionDigits: 2 }));
const MKT: Record<string, string> = { th: "🇹🇭 TH", vi: "🇻🇳 VN", ms: "🇲🇾 MY", en: "🌐 EN" };
const chipFor = (s: string) => (s === "active" ? "teal" : s === "trialing" ? "gold" : s === "past_due" ? "red" : "navy");

async function adm(path: string, opts: RequestInit = {}) {
  const r = await fetch("/api/v1/admin" + path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...opts });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || "Request failed");
  return j;
}

export default function Admin() {
  const [role, setRole] = useState<string | null | "loading">("loading");
  const [email, setEmail] = useState("admin@mandamix.com");
  const [password, setPassword] = useState("admin12345");
  const [loginErr, setLoginErr] = useState<string | null>(null);

  useEffect(() => { adm("/me").then((d) => setRole(d.role)).catch(() => setRole(null)); }, []);

  const login = async () => {
    setLoginErr(null);
    try { const d = await adm("/login", { method: "POST", body: JSON.stringify({ email, password }) }); setRole(d.admin.role); }
    catch (e) { setLoginErr(e instanceof Error ? e.message : "Login failed"); }
  };

  if (role === "loading") return <Centered>Loading…</Centered>;
  if (role === null)
    return (
      <Centered>
        <Logo style={{ justifyContent: "center", marginBottom: 24 }} />
        <h2 style={{ color: "var(--navy)", marginBottom: 4 }}>Admin sign-in</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginBottom: 20 }}>Restricted — staff only. RBAC enforced server-side.</p>
        <label className="field"><small>Email</small><input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><small>Password</small><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} /></label>
        {loginErr && <p style={{ color: "var(--red)", fontSize: 13, fontWeight: 600 }}>{loginErr}</p>}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={login}>Sign in →</button>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 16 }}>Dev logins (pw <b>admin12345</b>): admin@ (super) · finance@ (refunds/price) · ops@ (trials/users)</p>
      </Centered>
    );

  return <Console role={role} onLogout={() => { adm("/logout", { method: "POST" }).finally(() => setRole(null)); }} />;
}

function Console({ role, onLogout }: { role: string; onLogout: () => void }) {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [ov, setOv] = useState<any>(null);
  const [custs, setCusts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };
  const loadCustomers = useCallback(() => adm(`/customers?q=${encodeURIComponent(q)}`).then((d) => setCusts(d.customers)), [q]);

  useEffect(() => {
    if (tab === 0) adm("/overview").then(setOv).catch(() => {});
    if (tab === 1) loadCustomers().catch(() => {});
    if (tab === 2) adm("/content").then(setContent).catch(() => {});
    if (tab === 3) adm("/audit").then((d) => setAudit(d.entries)).catch(() => {});
  }, [tab, loadCustomers]);

  const refreshAfterAction = async () => {
    await loadCustomers().catch(() => {});
    if (detail) await adm(`/customers/${detail.id}`).then(setDetail).catch(() => {});
  };

  const act = async (fn: () => Promise<any>, label: string) => {
    try { await fn(); flash(`✓ ${label} — written to audit log`); await refreshAfterAction(); }
    catch (e) { flash(`✗ ${e instanceof Error ? e.message : "failed"}`); }
  };

  const openCustomer = (id: string) => adm(`/customers/${id}`).then(setDetail).catch(() => {});

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
          🔐 Signed in as <b style={{ color: "#fff" }}>{role}</b>. Refunds &amp; price overrides need finance_admin.
          <button onClick={onLogout} style={{ color: "#C7D5E3", textDecoration: "underline", marginTop: 8, display: "block" }}>Sign out</button>
        </div>
      </aside>

      <main className="adm-main">
        {toast && <div className="chip teal" style={{ marginBottom: 14 }}>{toast}</div>}

        {tab === 0 && ov && (
          <>
            <h1>Operations overview</h1>
            <p className="sub">Live from PostgreSQL · refresh by reopening the tab</p>
            <div className="kpis">
              <Kpi s="MRR" v={usd(ov.mrrMinor)} d="active subscriptions" up />
              <Kpi s="Active subscribers" v={String(ov.activeSubs)} d="status = active" up />
              <Kpi s="In trial" v={String(ov.inTrial)} d="status = trialing" up />
              <Kpi s="Trial → paid" v={`${ov.conversionPct}%`} d="converted / started" up={ov.conversionPct >= 50} />
              <Kpi s="Past due (dunning)" v={String(ov.pastDue)} d="needs recovery" />
              <Kpi s="Payment success" v={`${ov.paymentSuccessPct}%`} d="succeeded / attempts" up={ov.paymentSuccessPct >= 90} />
              <Kpi s="Refunds (30d)" v={usd(ov.refundsMinor)} d={`${ov.refundsCount} issued · audited`} />
              <Kpi s="Markets" v={String(ov.markets.length)} d="active languages" up />
            </div>
            <div className="resp-asym-r">
              <div className="card panel">
                <h3>Signups by market (by UI language)</h3>
                <div className="wk" style={{ height: 110 }}>
                  {ov.markets.map((m: any, i: number) => {
                    const max = Math.max(...ov.markets.map((x: any) => x.n), 1);
                    return <div key={i} className="hit"><i style={{ height: `${Math.round((m.n / max) * 100)}%` }} />{(MKT[m.lang] || m.lang).split(" ")[1] || m.lang}</div>;
                  })}
                </div>
                <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>{ov.markets.reduce((a: number, m: any) => a + m.n, 0)} total signups</small>
              </div>
              <div className="card panel">
                <h3>Subscription states</h3>
                {ov.states.length === 0 && <small style={{ color: "var(--ink-3)" }}>No subscriptions yet.</small>}
                {ov.states.map((s: any, i: number) => {
                  const tot = ov.states.reduce((a: number, x: any) => a + x.n, 0) || 1;
                  return <div key={i} className="cov"><b>{s.status}</b><div className="bar"><i style={{ width: `${(s.n / tot) * 100}%`, background: s.status === "past_due" ? "var(--red)" : s.status === "trialing" ? "linear-gradient(90deg,var(--gold),#F2B95C)" : undefined }} /></div><span>{s.n}</span></div>;
                })}
              </div>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <h1>Customers &amp; billing</h1>
            <p className="sub">GET /admin/customers · actions are RBAC-gated and audited</p>
            <div className="searchbar">
              <input placeholder="Search email or name…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadCustomers()} />
              <button className="btn btn-navy btn-sm" onClick={() => loadCustomers()}>Search</button>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const name = prompt("Full name"); if (name === null) return;
                const em = prompt("Email"); if (!em) return;
                act(() => adm("/users", { method: "POST", body: JSON.stringify({ name, email: em }) }), "User created · invite sent");
              }}>➕ Create user</button>
            </div>
            <div className="card" style={{ padding: "6px 16px", marginBottom: 18, overflowX: "auto" }}>
              <table className="atable">
                <tbody>
                  <tr><th>Customer</th><th>Market</th><th>Plan</th><th>Status</th><th>Trial / renews</th><th>LTV</th><th /></tr>
                  {custs.length === 0 && <tr><td colSpan={7} style={{ color: "var(--ink-3)" }}>No customers match.</td></tr>}
                  {custs.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.display_name || "—"}</b><br /><small style={{ color: "var(--ink-3)" }}>{c.email}</small></td>
                      <td>{MKT[c.ui_language] || c.ui_language}</td>
                      <td>{c.plan_code ? `${c.plan_code === "premium_annual" ? "Annual" : "Monthly"} ${usd(c.amount_minor)}` : "—"}{c.price_override_minor != null && <span className="chip teal" style={{ fontSize: 10, marginLeft: 6 }}>override</span>}</td>
                      <td>{c.status ? <span className={"chip " + chipFor(c.status)}>{c.status}</span> : "—"}</td>
                      <td>{c.status === "trialing" ? dateLabel(c.trial_ends_at) : dateLabel(c.current_period_end)}</td>
                      <td>{usd(c.ltv)}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => openCustomer(c.id)}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detail && (
              <div className="card panel">
                <h3><span>{detail.display_name || detail.email} — {detail.psp_customer_id || "no PSP id"}</span>{detail.status && <span className={"chip " + chipFor(detail.status)}>{detail.status}</span>}</h3>
                <div className="resp-2col">
                  <div>
                    <Cov b="Plan" v={detail.plan_code || "—"} />
                    <Cov b="Trial ends" v={dateLabel(detail.trial_ends_at)} />
                    <Cov b="Price" v={`${usd(detail.amount_minor)}${detail.price_override_minor != null ? " (override)" : ""}`} />
                    <Cov b="Payment method" v={detail.brand ? `${detail.brand} •••• ${detail.last4}` : "—"} />
                  </div>
                  <div>
                    <Cov b="UI language" v={`${MKT[detail.ui_language] || detail.ui_language}`} />
                    <Cov b="Lessons completed" v={String(detail.lessons_done)} />
                    <Cov b="Cancel at period end" v={detail.cancel_at_period_end ? "yes" : "no"} />
                    <Cov b="Email" v={detail.email} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                  <button className="btn btn-navy btn-sm" onClick={() => act(() => adm("/trials/extend", { method: "POST", body: JSON.stringify({ customerId: detail.id, days: 7 }) }), "Trial extended +7 days")}>⏳ Extend trial +7d</button>
                  <button className="btn btn-navy btn-sm" onClick={() => {
                    const amt = prompt("New price (USD / month)", "4.99"); if (!amt) return;
                    const reason = prompt("Reason (required, audited)"); if (!reason) return;
                    act(() => adm(`/customers/${detail.id}/price`, { method: "PUT", body: JSON.stringify({ amountMinor: Math.round(parseFloat(amt) * 100), reason }) }), `Price override ${amt}`);
                  }}>💲 Change price…</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => act(() => adm(`/customers/${detail.id}/password-reset`, { method: "POST" }), "Password reset link sent")}>🔑 Reset password</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Refund the latest charge?")) act(() => adm("/refunds", { method: "POST", body: JSON.stringify({ customerId: detail.id }) }), "Refund issued"); }}>↩ Issue refund</button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 2 && content && (
          <>
            <h1>Content &amp; localization</h1>
            <p className="sub">Publish gate: an item ships only when all 4 glosses (EN · TH · VI · MS) exist</p>
            <div className="card panel" style={{ marginBottom: 18, borderLeft: `4px solid ${content.blocked.length ? "var(--red)" : "var(--teal)"}` }}>
              <b style={{ color: content.blocked.length ? "var(--red)" : "var(--teal)" }}>
                {content.blocked.length ? `⛔ ${content.blocked.length} items blocked from publishing` : `✓ All ${content.totalItems} published items are fully localized`}
              </b>
            </div>
            <div className="resp-content">
              <div className="card panel">
                <h3>{content.blocked.length ? "Blocked items (missing a gloss)" : "Recently published items"}</h3>
                {content.blocked.length === 0 && <small style={{ color: "var(--ink-3)" }}>Nothing blocked — every item has all four language glosses.</small>}
                {content.blocked.map((b: any, i: number) => (
                  <div key={i} className="srs-item"><span className="hanzi" style={{ fontWeight: 700, width: 60 }}>{b.hanzi}</span><span className="g">{b.pinyin}</span><span className="chip red">missing {b.missing}</span></div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 18 }}>
                <div className="card panel">
                  <h3>Gloss coverage by language</h3>
                  {content.coverage.map((c: any, i: number) => (
                    <div key={i} className="cov"><b>{c.name}</b><div className="bar"><i style={{ width: `${c.pct}%` }} /></div><span>{c.pct}%</span></div>
                  ))}
                </div>
                <div className="card panel">
                  <h3>Course build status</h3>
                  {content.courses.map((c: any, i: number) => (
                    <div key={i} className="cov"><b>HSK {c.level}</b><div className="bar"><i style={{ width: `${c.items ? 100 : 0}%`, background: c.items ? undefined : "#B6C3D2" }} /></div><span>{c.items ? `${c.lessons}L` : "—"}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 3 && (
          <>
            <h1>Audit log</h1>
            <p className="sub">Every admin &amp; billing mutation — audit_logs (immutable)</p>
            <div className="card" style={{ padding: "6px 16px", overflowX: "auto" }}>
              <table className="atable">
                <tbody>
                  <tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th></tr>
                  {audit.length === 0 && <tr><td colSpan={5} style={{ color: "var(--ink-3)" }}>No audit entries yet — perform an action.</td></tr>}
                  {audit.map((a, i) => (
                    <tr key={i}>
                      <td>{new Date(a.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{a.actor}{a.role ? ` · ${a.role}` : ""}</td>
                      <td><span className={"chip " + (a.action?.includes("refund") ? "navy" : a.action?.includes("fail") ? "red" : "gold")}>{a.action}</span></td>
                      <td>{a.entity_type}</td>
                      <td style={{ color: "var(--ink-2)" }}>{a.metadata ? JSON.stringify(a.metadata) : ""}</td>
                    </tr>
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

function dateLabel(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
function Kpi({ s, v, d, up }: { s: string; v: string; d: string; up?: boolean }) {
  return <div className="card kpi"><small>{s}</small><div className="v">{v}</div><div className={"d " + (up ? "up" : "")}>{d}</div></div>;
}
function Cov({ b, v }: { b: string; v: string }) {
  return <div className="cov"><b>{b}</b><span style={{ width: "auto", fontWeight: 600 }}>{v}</span></div>;
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div className="onb" style={{ maxWidth: 440 }}><div className="card onb-card">{children}</div></div>;
}
