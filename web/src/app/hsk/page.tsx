"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function Hsk() {
  return (
    <AppShell active="hsk">
      <div className="wrap dash">
        <div className="dash-head">
          <div><h1>HSK 4 — exam plan</h1><p>Target exam: 12 December 2026 · 189 days left · plan on track</p></div>
          <Link className="btn btn-navy" href="/exam">Take mock exam</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20, alignItems: "start" }} className="hsk-grid">
          <div style={{ display: "grid", gap: 20 }}>
            <div className="card" style={{ padding: 30, textAlign: "center" }}>
              <h3 style={{ fontSize: 16, color: "var(--navy)", marginBottom: 8 }}>Readiness score</h3>
              <div style={{ position: "relative", width: 190, height: 110, margin: "6px auto 4px", overflow: "hidden" }}>
                <svg viewBox="0 0 190 190" style={{ width: 190, height: 190 }}>
                  <path d="M 20 95 A 75 75 0 0 1 170 95" fill="none" stroke="#E3E9F0" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 20 95 A 75 75 0 0 1 170 95" fill="none" stroke="#E9A23B" strokeWidth="16" strokeLinecap="round" strokeDasharray="236" strokeDashoffset="92" />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontSize: 34, fontWeight: 800, color: "var(--navy)" }}>61%</div>
              </div>
              <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 4 }}>Estimated level today: <b>HSK 3</b> · on pace for HSK 4 by November</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 20 }}>
                {[["1,240", "words mastered"], ["2,000", "needed for HSK 4"], ["72%", "last mock score"]].map((m, i) => (
                  <div key={i}><b style={{ display: "block", fontSize: 19, color: "var(--navy)" }}>{m[0]}</b><small style={{ color: "var(--ink-3)", fontSize: 12 }}>{m[1]}</small></div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <h3>Section scores — last 3 mocks</h3>
              {[["Listening", 58, "linear-gradient(90deg,var(--red),#E66B52)"], ["Reading", 74, ""], ["Writing", 81, ""]].map((s, i) => (
                <div key={i} className="srs-item"><span className="g" style={{ width: 90, flex: "none", fontWeight: 700, color: "var(--navy)" }}>{s[0]}</span><div className="bar" style={{ flex: 1, margin: 0 }}><i style={{ width: `${s[1]}%`, background: (s[2] as string) || undefined }} /></div><span style={{ fontWeight: 800, fontSize: 13, width: 42, textAlign: "right" }}>{s[1]}%</span></div>
              ))}
              <small style={{ color: "var(--ink-3)", display: "block", marginTop: 12 }}>Listening is your bottleneck — today&apos;s plan adds a listening drill.</small>
            </div>

            <div className="card panel">
              <h3>Weak areas to fix</h3>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <span className="chip red">Listening · long dialogues</span><span className="chip red">结果 vs 后果</span>
                <span className="chip gold">Tone pairs 2-3</span><span className="chip gold">把 sentences</span><span className="chip gold">Reading speed</span>
              </div>
              <small style={{ display: "block", marginTop: 14, color: "var(--ink-3)" }}>Your review queue has been reweighted toward these.</small>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div className="card panel">
              <h3><span>Today&apos;s study plan</span><span className="chip teal">Day 38 of 226</span></h3>
              {[["Lesson: 方向与位置 (Directions)", "10 min", true], ["Clear review queue (21 cards)", "8 min", true], ["Listening drill: dialogues set 4", "7 min", false], ["10 new HSK 4 words: 商务 set", "6 min", false]].map((tk, i) => (
                <div key={i} className="srs-item">
                  <span style={{ width: 18, color: tk[2] ? "var(--teal)" : "var(--ink-3)" }}>{tk[2] ? "☑" : "☐"}</span>
                  <span className="g" style={{ color: "var(--navy)" }}>{tk[0]}</span><span className="chip navy">{tk[1]}</span>
                </div>
              ))}
            </div>

            <div className="card panel">
              <h3>Mock exams</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 0" }}><div className="lvlrow"><div className="lv">H4</div></div><div style={{ flex: 1 }}><b style={{ fontSize: 14.5 }}>HSK 4 mock · full format</b><br /><small style={{ color: "var(--ink-3)" }}>Listening + reading + writing · 85 min</small></div><Link className="btn btn-primary btn-sm" href="/exam">Start</Link></div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 0", borderTop: "1px solid var(--line)" }}><div className="lvlrow"><div className="lv">H4</div></div><div style={{ flex: 1 }}><b style={{ fontSize: 14.5 }}>Listening section only</b><br /><small style={{ color: "var(--ink-3)" }}>Your weakest section · 30 min</small></div><Link className="btn btn-ghost btn-sm" href="/exam">Start</Link></div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 0", borderTop: "1px solid var(--line)" }}><div className="lvlrow"><div className="lv" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>H3</div></div><div style={{ flex: 1 }}><b style={{ fontSize: 14.5 }}>HSK 3 mock — passed 86%</b><br /><small style={{ color: "var(--ink-3)" }}>Taken 14 May 2026</small></div><span className="chip teal">✓</span></div>
            </div>

            <div className="card panel">
              <h3>Readiness history</h3>
              <div className="wk" style={{ height: 80 }}>
                {[["Feb", 30], ["Mar", 38], ["Apr", 47], ["May", 55], ["Jun", 61]].map((m, i) => (
                  <div key={i} className="hit"><i style={{ height: `${m[1]}%`, background: i === 4 ? "linear-gradient(180deg,var(--teal),#3DBEAF)" : undefined }} />{m[0]}</div>
                ))}
              </div>
              <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>+6 pts/month average — at this pace you&apos;ll cross 85% (exam-ready) in October.</small>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
