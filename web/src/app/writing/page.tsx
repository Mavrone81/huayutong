"use client";

import { AppShell } from "@/components/AppShell";

export default function Writing() {
  return (
    <AppShell active="review">
      <div className="write-wrap">
        <div className="card" style={{ padding: 34, textAlign: "center" }}>
          <div className="q-type">Character practice · stroke order</div>
          <h2 style={{ color: "var(--navy)", fontSize: 22, marginBottom: 4 }}><span className="hanzi" style={{ fontSize: 30 }}>好</span> hǎo — good</h2>
          <small style={{ color: "var(--ink-3)" }}>6 strokes · radical 女 (woman) + 子 (child)</small>
          <div className="grid-cell" style={{ marginTop: 22 }}>
            <svg viewBox="0 0 300 300">
              <line x1="0" y1="150" x2="300" y2="150" stroke="#E3E9F0" strokeDasharray="6 6" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="#E3E9F0" strokeDasharray="6 6" />
              <line x1="0" y1="0" x2="300" y2="300" stroke="#EEF2F6" strokeDasharray="6 6" />
              <line x1="300" y1="0" x2="0" y2="300" stroke="#EEF2F6" strokeDasharray="6 6" />
            </svg>
            <div className="gz">好</div>
          </div>
          <div className="stroke-chips">
            <span className="done">1</span><span className="done">2</span><span className="done">3</span><span>4</span><span>5</span><span>6</span>
          </div>
          <small style={{ display: "block", marginTop: 12, color: "var(--ink-3)" }}>Stroke 4 of 6 — trace the horizontal of 子</small>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
            <button className="btn btn-ghost btn-sm">▶ Replay animation</button>
            <button className="btn btn-navy btn-sm">Next character →</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="card panel">
            <h3>Today&apos;s set — Family unit</h3>
            <div className="char-list">
              <button className="char-pick ok">妈</button><button className="char-pick ok">爸</button>
              <button className="char-pick on">好</button><button className="char-pick">你</button>
              <button className="char-pick">我</button><button className="char-pick">家</button>
            </div>
            <small style={{ color: "var(--ink-3)", display: "block", marginTop: 14 }}>2 of 6 mastered · recognition-first (HSK 1–4 requires recognition only; handwriting starts at HSK 5)</small>
          </div>
          <div className="card panel">
            <h3>Stroke rules</h3>
            <div className="srs-item"><span style={{ fontSize: 18 }}>↖︎</span><span className="g">Top before bottom · 三 is written downwards</span></div>
            <div className="srs-item"><span style={{ fontSize: 18 }}>⇤</span><span className="g">Left before right · 好 starts with 女</span></div>
            <div className="srs-item"><span style={{ fontSize: 18 }}>⊞</span><span className="g">Outside before inside · 国 closes last</span></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
