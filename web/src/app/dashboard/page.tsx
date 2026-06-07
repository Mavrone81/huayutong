"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { api, ProgressDTO } from "@/lib/api";

export default function Dashboard() {
  const { t } = useI18n();
  const [d, setD] = useState<ProgressDTO | null | "loading">("loading");
  useEffect(() => { api.getProgress().then(setD).catch(() => setD(null)); }, []);

  if (d === "loading") return <AppShell active="learn"><div className="wrap dash"><div className="card panel">Loading…</div></div></AppShell>;
  if (d === null) return (
    <AppShell active="learn">
      <div className="wrap dash"><div className="card panel" style={{ textAlign: "center", padding: 40 }}>
        <h3 style={{ marginBottom: 12 }}>Please sign in to see your dashboard</h3>
        <Link className="btn btn-primary" href="/login" style={{ display: "inline-flex" }}>Log in</Link>
      </div></div>
    </AppShell>
  );

  const C = 163; // circumference for r=26
  const goalOffset = Math.max(0, C * (1 - Math.min(1, d.goalDone / Math.max(1, d.goalMinutes))));
  const remaining = Math.max(0, d.goalMinutes - d.goalDone);

  return (
    <AppShell active="learn">
      <div className="wrap dash">
        <div className="dash-head">
          <div><h1>{t("dash_h1", "Good morning, Ploy 👋")}</h1><p>You&apos;re {d.hsk1Readiness}% of the way to HSK 1. Keep it going.</p></div>
          {d.nextLessonId && <Link className="btn btn-primary" href={`/lesson?lesson=${d.nextLessonId}`}>{t("dash_cta", "▶ Continue lesson")}</Link>}
        </div>

        <div className="dash-grid">
          <div className="card stat">
            <div className="ring">
              <svg width="62" height="62"><circle cx="31" cy="31" r="26" fill="none" stroke="#E3E9F0" strokeWidth="7" /><circle cx="31" cy="31" r="26" fill="none" stroke="#E9A23B" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={goalOffset} /></svg>
              <b>{d.goalDone}/{d.goalMinutes}</b>
            </div>
            <div><h4>{t("st1", "Today's goal")}</h4><div className="big">{d.goalDone} <span style={{ fontSize: 13, color: "var(--ink-3)" }}>of {d.goalMinutes} min</span></div><div className="sub2">{remaining > 0 ? `${remaining} minutes to keep your streak` : "Goal met today 🎉"}</div></div>
          </div>
          <div className="card stat">
            <div style={{ fontSize: 38 }}>🔥</div>
            <div><h4>{t("st2", "Streak")}</h4><div className="big">{d.streak} <span style={{ fontSize: 13, color: "var(--ink-3)" }}>days</span></div><div className="sub2">Best: {d.longestStreak} days</div></div>
          </div>
          <div className="card stat">
            <div style={{ fontSize: 38 }}>🧠</div>
            <div><h4>{t("st3", "Reviews due")}</h4><div className="big">{d.reviewsDue} <span style={{ fontSize: 13, color: "var(--ink-3)" }}>words</span></div><div className="sub2">{d.reviewsDue ? "Clear your review queue" : "Nothing due — nice!"}</div></div>
          </div>
        </div>

        <div className="dash-cols">
          <div style={{ display: "grid", gap: 20 }}>
            <div className="card panel">
              <h3><span>Your course path — HSK 1</span><Link href="/courses">View all levels</Link></h3>
              {d.skills.map((s, i) => (
                <div key={i} className="skill-row" style={s.state === "locked" ? { opacity: 0.6 } : undefined}>
                  <div className="skill-ic" style={{ background: s.color }}>{s.hanzi}</div>
                  <div className="meta"><b>{s.title}</b><small>{s.sub}</small><div className="bar"><i style={{ width: `${s.progress}%` }} /></div></div>
                  {s.state === "done" && <span className="chip teal">✓</span>}
                  {s.state === "active" && <Link className="btn btn-primary btn-sm" href={`/lesson?lesson=${s.lessonId}`}>Continue</Link>}
                  {s.state === "locked" && <span className="chip navy">🔒</span>}
                </div>
              ))}
            </div>

            <div className="card panel">
              <h3><span>This week</span><span className="chip gold">🎯 keep your streak</span></h3>
              <div className="wk">
                {[["M", 55, true], ["T", 80, true], ["W", 18, false], ["T", 65, true], ["F", 100, true], ["S", 72, true], ["S", 34, false]].map((x, i) => (
                  <div key={i} className={x[2] ? "hit" : ""}><i style={{ height: `${x[1]}%` }} />{x[0]}</div>
                ))}
              </div>
              <small style={{ color: "var(--ink-3)", display: "block", marginTop: 12 }}>Minutes studied per day · goal: {d.goalMinutes} min</small>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div className="card panel">
              <h3><span>Smart review queue</span>{d.reviewsDue > 0 && <Link href="/lesson">Review all {d.reviewsDue}</Link>}</h3>
              {d.srs.length === 0 && <small style={{ color: "var(--ink-3)" }}>Complete a lesson to start building your review queue.</small>}
              {d.srs.map((s, i) => (
                <div key={i} className="srs-item">
                  <span className="srs-hz">{s.hanzi}</span><span className="g">{s.gloss}</span>
                  <span className="due" style={s.due === "due now" ? undefined : { background: "var(--gold-soft)", color: "#B97A18" }}>{s.due === "due now" ? t("due_now", "due now") : s.due}</span>
                </div>
              ))}
            </div>

            <div className="card panel">
              <h3><span>Gold league</span><span className="chip gold">4 days left</span></h3>
              <div className="lb-row"><span className="rk">1</span><span className="av2" style={{ background: "#7C5CBF" }}>MN</span><b>Minh N.</b><span>1,420 XP</span></div>
              <div className="lb-row"><span className="rk">2</span><span className="av2" style={{ background: "#2A9D8F" }}>AR</span><b>Aisyah R.</b><span>1,180 XP</span></div>
              <div className="lb-row me"><span className="rk">3</span><span className="av2" style={{ background: "#E9A23B" }}>PL</span><b>You</b><span>{d.xp.toLocaleString()} XP</span></div>
              <div className="lb-row"><span className="rk">4</span><span className="av2" style={{ background: "#1F4E79" }}>TV</span><b>Tuan V.</b><span>980 XP</span></div>
              <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>Top 10 advance to Sapphire · opt out in Settings</small>
            </div>

            <div className="card panel">
              <h3>HSK 1 readiness</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--teal)" }}>{d.hsk1Readiness}%</div>
                <div style={{ flex: 1 }}><div className="bar" style={{ margin: 0 }}><i style={{ width: `${d.hsk1Readiness}%` }} /></div>
                  <small style={{ color: "var(--ink-3)", display: "block", marginTop: 8 }}>Words introduced across HSK 1 · mock exam recommended at 85%</small></div>
              </div>
              <Link className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} href="/hsk">Open HSK prep →</Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
