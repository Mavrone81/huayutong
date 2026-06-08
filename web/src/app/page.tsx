"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { api, PlanDTO } from "@/lib/api";

function Price({ label, fallbackInterval }: { label: string; fallbackInterval: string }) {
  const [amt, int] = label.split("/");
  return <div className="price">{amt.trim()}<span> / {int ? int.trim() : fallbackInterval}</span></div>;
}

export default function Landing() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Record<string, PlanDTO>>({});
  useEffect(() => {
    api.getPlans().then((list) => {
      const m: Record<string, PlanDTO> = {};
      list.forEach((p) => (m[p.code] = p));
      setPlans(m);
    }).catch(() => {});
  }, []);
  const price = (code: string, fallback: string) => plans[code]?.priceLabel ?? fallback;
  return (
    <section>
      <div style={{ background: "var(--gold)", color: "#3a2900", textAlign: "center", padding: "12px 16px", fontWeight: 800, fontSize: 15, letterSpacing: ".01em" }}>
        🚀 CI/CD test build — this banner was deployed automatically from <code>main</code>
      </div>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap land-nav">
          <Logo />
          <div className="links">
            <span>Courses</span><span>HSK Prep</span><span>Method</span><span>Pricing</span>
          </div>
          <div className="cta">
            <Link className="btn btn-ghost btn-sm" href="/login">{t("login", "Log in")}</Link>
            <Link className="btn btn-primary btn-sm" href="/onboarding">{t("trial_cta", "Start 1-month free trial")}</Link>
          </div>
        </div>
      </div>

      <div className="wrap hero">
        <div>
          <span className="chip red" style={{ marginBottom: 18 }}>{t("hero_chip", "✦ Aligned to the new HSK 3.0 standard")}</span>
          <h1 dangerouslySetInnerHTML={{ __html: t("hero_h1", "Learn Mandarin <em>in your own language.</em>") }} />
          <p className="lead">{t("hero_p", "The first self-paced Mandarin course taught natively in Thai, Vietnamese, Bahasa Melayu and English — with a clear path from zero to HSK certification.")}</p>
          <div className="langs">
            <span className="chip navy">English</span><span className="chip navy">ไทย</span>
            <span className="chip navy">Tiếng Việt</span><span className="chip navy">Bahasa Melayu</span>
          </div>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/onboarding">{t("trial_cta", "Start 1-month free trial")}</Link>
            <span className="note">{t("hero_note", "Full premium access · cancel anytime before the month ends")}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hv-float f1">🔥 <span>12-day streak</span></div>
          <div className="hv-card">
            <div className="hv-hanzi">你好</div>
            <div className="hv-pinyin">nǐ hǎo</div>
            <div className="hv-glosses">
              <div className="hv-gloss"><span>Hello</span><small>EN</small></div>
              <div className="hv-gloss"><span>สวัสดี</span><small>TH</small></div>
              <div className="hv-gloss"><span>Xin chào</span><small>VI</small></div>
              <div className="hv-gloss"><span>Helo</span><small>MS</small></div>
            </div>
          </div>
          <div className="hv-float f2">✓ <span>HSK 1 · 78% ready</span></div>
        </div>
      </div>

      <div className="wrap trustline">
        <span>📱 Built mobile-first for SEA</span><span>🎧 Native-speaker audio</span>
        <span>🧠 Smart spaced repetition</span><span>📜 HSK 3.0 · nine levels</span>
      </div>

      <div className="wrap how">
        <h2 style={{ marginTop: 54 }}>From zero to certified, in four steps</h2>
        <p className="sub">A clear path whether you&apos;re learning for life or for the exam.</p>
        <div className="how-grid">
          <div className="card how-step"><div className="n">1</div><b>Pick your language</b><p>Thai, Vietnamese, Bahasa Melayu or English — everything is taught in it.</p></div>
          <div className="card how-step"><div className="n">2</div><b>Learn 10 min a day</b><p>Bite-size lessons with native audio, tones and characters.</p></div>
          <div className="card how-step"><div className="n">3</div><b>Review what fades</b><p>Spaced repetition resurfaces weak words at the right moment.</p></div>
          <div className="card how-step"><div className="n">4</div><b>Pass your HSK</b><p>Mock exams, readiness score and a plan that counts down to exam day.</p></div>
        </div>
      </div>

      <div className="wrap feat">
        <h2>Everything you need, from 你好 to HSK 6</h2>
        <p className="sub">No English barrier. No guesswork. A structured course that adapts to how you learn.</p>
        <div className="feat-grid">
          <div className="card feat-card"><div className="ic" style={{ background: "var(--red-soft)" }}>🗣️</div><h3>Taught in your language</h3><p>Every instruction, grammar note and translation is written natively in Thai, Vietnamese, Bahasa Melayu or English — never machine-translated.</p></div>
          <div className="card feat-card"><div className="ic" style={{ background: "var(--gold-soft)" }}>🎯</div><h3>HSK 3.0 from day one</h3><p>Lessons mapped to the new nine-level standard. Track exactly which words and characters you need for your target level.</p></div>
          <div className="card feat-card"><div className="ic" style={{ background: "var(--teal-soft)" }}>🧠</div><h3>Reviews that stick</h3><p>A spaced-repetition engine resurfaces your weak words at the right moment, so 10 minutes a day actually compounds.</p></div>
          <div className="card feat-card"><div className="ic" style={{ background: "#E8F0F8" }}>🔊</div><h3>Tones done properly</h3><p>Native audio on every word, tone-pair drills and pronunciation feedback built for serious progress.</p></div>
          <div className="card feat-card"><div className="ic" style={{ background: "var(--gold-soft)" }}>✍️</div><h3>Characters, stroke by stroke</h3><p>Animated stroke order and recognition practice aligned to HSK 3.0&apos;s recognition-first approach.</p></div>
          <div className="card feat-card"><div className="ic" style={{ background: "var(--red-soft)" }}>📝</div><h3>Mock exams &amp; readiness</h3><p>Timed practice tests in the official format, a readiness score, and a study plan that counts down to your exam date.</p></div>
        </div>
      </div>

      <div className="wrap pricing">
        <h2>Simple pricing. Serious value.</h2>
        <p className="sub">Every plan starts with a 1-month free trial of full premium access. Cancel anytime before the trial ends and pay nothing.</p>
        <div className="plans">
          <div className="card plan">
            <h3>Free</h3>
            <Price label={price("free", "$0")} fallbackInterval="forever" />
            <ul><li>First skills of HSK 1</li><li>Daily review (limited)</li><li>All four languages</li></ul>
            <Link className="btn btn-ghost" href="/onboarding">Start free</Link>
          </div>
          <div className="card plan hot">
            <span className="tag">MOST POPULAR</span>
            <h3>Premium Monthly</h3>
            <Price label={price("premium_monthly", "$5.99/month")} fallbackInterval="month" />
            <ul><li>Full HSK 1–6 course path</li><li>Unlimited smart reviews</li><li>Mock exams + readiness score</li><li>Offline lessons</li></ul>
            <Link className="btn btn-primary" href="/onboarding">{t("trial_cta", "Start 1-month free trial")}</Link>
          </div>
          <div className="card plan">
            <h3>Premium Annual</h3>
            <Price label={price("premium_annual", "$44.99/year")} fallbackInterval="year" />
            <ul><li>Everything in Monthly</li><li>Save 37%</li><li>Exam-date study plans</li></ul>
            <Link className="btn btn-navy" href="/onboarding">{t("trial_cta", "Start 1-month free trial")}</Link>
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <div>
            <Logo style={{ color: "#fff" }} />
            <p style={{ marginTop: 12, maxWidth: "30em" }}>Mandarin for Southeast Asia — taught in your language, aligned to HSK 3.0.</p>
          </div>
          <div>© 2026 MandaMix · Terms · Privacy</div>
        </div>
      </footer>
    </section>
  );
}
