"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { api, ApiError } from "@/lib/api";

export default function Login() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onb" style={{ maxWidth: 460 }}>
      <Logo style={{ justifyContent: "center", marginBottom: 30 }} />
      <div className="card onb-card">
        <h2 style={{ textAlign: "center" }}>{t("li_h", "Welcome back")}</h2>
        <p className="hint" style={{ textAlign: "center" }}>Your streak missed you. 🔥</p>
        <div style={{ display: "grid", gap: 12 }}>
          <button className="opt" style={{ justifyContent: "center", gap: 10 }}><span className="em" style={{ fontSize: 19 }}>🇬</span><b>Continue with Google</b></button>
          <button className="opt" style={{ justifyContent: "center", gap: 10 }}><span className="em" style={{ fontSize: 19 }}></span><b>Continue with Apple</b></button>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--ink-3)", fontSize: 12, fontWeight: 700, margin: "4px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />OR<span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <label className="field"><small>{t("reg_email", "Email or phone")}</small><input type="text" placeholder="ploy@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field" style={{ marginBottom: 0 }}><small>{t("reg_pass", "Password")}</small><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></label>
          <a style={{ textAlign: "right", fontSize: 13, color: "var(--navy-2)", fontWeight: 700 }}>Forgot password?</a>
        </div>
        {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>{busy ? "…" : t("li_cta", "Log in →")}</button>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--ink-2)" }}>New to MandaMix? <Link href="/onboarding" style={{ color: "var(--red)", fontWeight: 700 }}>Create an account</Link></p>
      </div>
    </div>
  );
}
