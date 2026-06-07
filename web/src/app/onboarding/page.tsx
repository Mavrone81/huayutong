"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { api, ApiError } from "@/lib/api";

function OptionGroup({
  options, defaultIndex = 0, cols = 2,
}: { options: { em: string; b: ReactNode; s?: ReactNode }[]; defaultIndex?: number; cols?: 1 | 2 }) {
  const [sel, setSel] = useState(defaultIndex);
  return (
    <div className="opt-grid" style={cols === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
      {options.map((o, i) => (
        <button key={i} className={"opt" + (sel === i ? " sel" : "")} onClick={() => setSel(i)}>
          <span className="em">{o.em}</span>
          <span><b>{o.b}</b>{o.s ? <small>{o.s}</small> : null}</span>
        </button>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState("₱299.00/month");
  useEffect(() => {
    api.getPlans().then((list) => {
      const m = list.find((p) => p.code === "premium_monthly");
      if (m) setMonthlyPrice(m.priceLabel);
    }).catch(() => {});
  }, []);

  const createAccount = async () => {
    if (!consent) { alert("Please accept the required Terms & Privacy consent to continue."); return; }
    if (!email || password.length < 8) { setError("Enter an email and a password of at least 8 characters."); return; }
    setError(null); setBusy(true);
    try {
      await api.register({ email, password, ui_language: lang, goal: "hsk_exam" });
      setStep(6);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create account");
    } finally { setBusy(false); }
  };

  const startTrial = async () => {
    setBusy(true);
    try {
      await api.setupIntent();                          // vault a card (mock PSP returns a stub)
      await api.startTrial("premium_monthly", "pm_mock_card");
    } catch (e) {
      if (!(e instanceof ApiError && e.code === "already_subscribed")) {
        // non-fatal for the demo — proceed to the app
      }
    } finally {
      setBusy(false);
      router.push("/dashboard");
    }
  };

  return (
    <div className="onb">
      <Logo style={{ justifyContent: "center", marginBottom: 30 }} />
      <div className="onb-progress">
        {[1, 2, 3, 4, 5, 6].map((i) => <i key={i} className={step >= i ? "on" : ""} />)}
      </div>

      {step === 1 && (
        <div className="card onb-card">
          <h2>Which language do you want to learn in?</h2>
          <p className="hint">Everything — instructions, grammar notes, translations — will be in this language. You can change it anytime.</p>
          <OptionGroup options={[
            { em: "🇬🇧", b: "English", s: "Learn Mandarin through English" },
            { em: "🇹🇭", b: "ไทย", s: "เรียนภาษาจีนผ่านภาษาไทย" },
            { em: "🇻🇳", b: "Tiếng Việt", s: "Học tiếng Trung bằng tiếng Việt" },
            { em: "🇲🇾", b: "Bahasa Melayu", s: "Belajar Mandarin dalam Bahasa Melayu" },
          ]} />
          <div className="onb-foot"><span /><button className="btn btn-primary" onClick={() => setStep(2)}>{t("continue", "Continue →")}</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="card onb-card">
          <h2>What&apos;s your goal?</h2>
          <p className="hint">We&apos;ll shape your course path around it.</p>
          <OptionGroup defaultIndex={1} options={[
            { em: "💬", b: "Everyday conversation", s: "Travel, work, daily life" },
            { em: "🎓", b: "Pass an HSK exam", s: "Structured prep with a target date" },
            { em: "💼", b: "Business Mandarin", s: "Trade, tourism, hospitality" },
            { em: "🌱", b: "Casual learning", s: "No pressure, steady progress" },
          ]} />
          <div className="onb-foot">
            <button className="skip" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>{t("continue", "Continue →")}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card onb-card">
          <h2>How much Mandarin do you already know?</h2>
          <p className="hint">We&apos;ll start you at the right point — or take a quick 3-minute placement test for a precise level.</p>
          <OptionGroup cols={1} options={[
            { em: "🌱", b: "Complete beginner", s: "Start from 你好 — HSK 1, Unit 1" },
            { em: "🙂", b: "I know some words & phrases", s: "Quick check, then start mid-HSK 1" },
            { em: "💬", b: "I can hold a basic conversation", s: "Placement test recommended — likely HSK 2–3" },
            { em: "⏱️", b: "Take the 3-min placement test", s: "12 adaptive questions · most precise start" },
          ]} />
          <div className="onb-foot">
            <button className="skip" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>{t("continue", "Continue →")}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card onb-card">
          <h2>Set your daily goal</h2>
          <p className="hint">Learners who set a daily goal are 3× more likely to keep their streak.</p>
          <OptionGroup defaultIndex={1} options={[
            { em: "☕", b: "5 min / day", s: "Casual" },
            { em: "⚡", b: "10 min / day", s: "Regular" },
            { em: "🔥", b: "20 min / day", s: "Serious" },
            { em: "🚀", b: "30 min / day", s: "Intense" },
          ]} />
          <div className="onb-foot">
            <button className="skip" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(5)}>{t("continue", "Continue →")}</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card onb-card">
          <h2>{t("reg_h", "Create your account")}</h2>
          <p className="hint">Your progress, streak and trial are saved to your account across all devices.</p>
          <div style={{ display: "grid", gap: 12 }}>
            <button className="opt" style={{ justifyContent: "center", gap: 10 }}><span className="em" style={{ fontSize: 19 }}>🇬</span><b>Continue with Google</b></button>
            <button className="opt" style={{ justifyContent: "center", gap: 10 }}><span className="em" style={{ fontSize: 19 }}></span><b>Continue with Apple</b></button>
            <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--ink-3)", fontSize: 12, fontWeight: 700, margin: "4px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />OR<span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            <label className="field"><small>{t("reg_email", "Email or phone")}</small><input type="text" placeholder="ploy@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="field" style={{ marginBottom: 0 }}><small>{t("reg_pass", "Password")}</small><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <small style={{ color: "var(--ink-3)", fontSize: 11.5, fontWeight: 500, display: "block", marginTop: 5 }}>At least 8 characters</small></label>
            <label className="field" style={{ marginBottom: 0, marginTop: 14 }}><small>Date of birth</small><input type="text" placeholder="DD / MM / YYYY" />
              <small style={{ color: "var(--ink-3)", fontSize: 11.5, fontWeight: 500, display: "block", marginTop: 5 }}>Under 18? We&apos;ll ask a parent or guardian to confirm your account.</small></label>
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 10, textAlign: "left" }}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--red)" }} />
              <span>I agree to the <b style={{ color: "var(--navy-2)" }}>Terms</b> and to the processing of my account and learning data as described in the <b style={{ color: "var(--navy-2)" }}>Privacy Policy</b>. <b>(required)</b></span>
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
              <input type="checkbox" style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--red)" }} />
              <span>Send me learning tips and offers by email. (optional — you can change this anytime)</span>
            </label>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 12 }}>Consent is per-purpose and never pre-ticked, in line with Vietnam PDPL, Thailand PDPA and Malaysia PDPA. We&apos;ll send a verification code to confirm your email or phone.</p>
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10, fontWeight: 600 }}>{error}</p>}
          <div className="onb-foot">
            <button className="skip" onClick={() => setStep(4)}>← Back</button>
            <button className="btn btn-primary" onClick={createAccount} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>{busy ? "…" : t("reg_cta", "Create account →")}</button>
          </div>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--ink-2)" }}>{t("reg_have", "Already have an account?")} <Link href="/login" style={{ color: "var(--red)", fontWeight: 700 }}>{t("login", "Log in")}</Link></p>
        </div>
      )}

      {step === 6 && (
        <div className="card onb-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
          <h2>Your 1-month free trial is ready</h2>
          <p className="hint">Full premium access until 6 July. We&apos;ll remind you 3 days and 24 hours before the trial ends. Cancel anytime — no charge.</p>
          <div className="card" style={{ padding: "18px 22px", margin: "0 auto 26px", maxWidth: 380, display: "flex", gap: 14, alignItems: "center", textAlign: "left" }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>Premium Monthly — {monthlyPrice}</b><br /><small style={{ color: "var(--ink-3)" }}>Card required · first charge in 30 days · cancel anytime</small></div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={startTrial}>{busy ? "Starting…" : "Add card & start learning →"}</button>
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>🔒 Secured by Stripe — your card details never touch our servers</p>
        </div>
      )}
    </div>
  );
}
