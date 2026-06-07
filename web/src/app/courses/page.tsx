"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LEVELS, SKILL_META, SKILL_SUB } from "@/lib/levels";

function LevelDetail({ n }: { n: number }) {
  const L = LEVELS[n];
  return (
    <div>
      {/* requirement stats */}
      <div className="card panel" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "center" }}>
          <Stat label="STAGE" value={L.stage} />
          <Stat label="VOCABULARY (CUMULATIVE)" value={L.you ? L.you.words : L.cum.toLocaleString()} sub={`+${L.nw.toLocaleString()} new at this level`} />
          <Stat label="CHARACTERS — RECOGNITION" value={L.you ? L.you.chars : "≈" + L.rec.toLocaleString()} />
          <Stat label="CHARACTERS — HANDWRITING" value={L.hand ? "≈" + L.hand : "none"} dim={!L.hand} />
          <Stat label="UNITS" value={String(L.you ? L.you.units : L.units)} />
          {L.you && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="bar"><i style={{ width: `${L.you.pct}%` }} /></div>
              <small style={{ color: "var(--ink-3)" }}>{L.you.pct}% ready for the HSK {n} exam</small>
            </div>
          )}
        </div>
      </div>

      {/* skills tested */}
      <div className="skillreq">
        {SKILL_META.map(([k, hz, name]) => {
          const st = L.skills[k as keyof typeof L.skills];
          const cls = st === "off" ? "off" : st === "new" ? "new" : "req";
          const chip = st === "new"
            ? <span className="chip gold" style={{ fontSize: 10, padding: "2px 8px" }}>NEW</span>
            : st === "req"
              ? <span className="chip teal" style={{ fontSize: 10, padding: "2px 8px" }}>✓ tested</span>
              : <span className="chip navy" style={{ fontSize: 10, padding: "2px 8px" }}>not yet</span>;
          return (
            <div key={k} className={"sreq " + cls}>
              <span className="si">{hz}</span><b>{name}</b>
              <small>{SKILL_SUB[k][st] || SKILL_SUB[k].req}</small>{chip}
            </div>
          );
        })}
      </div>

      {/* note */}
      <div className="card panel" style={{ marginBottom: 22, borderLeft: "4px solid var(--gold)" }}>
        <b style={{ color: "var(--navy)", fontSize: 14 }}>📋 What HSK 3.0 requires at Level {n}</b>
        <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 8 }}>{L.note}</p>
      </div>

      {/* exam format */}
      <div className="card panel" style={{ marginBottom: 22 }}>
        <h3>Official exam format — HSK {n}</h3>
        {L.exam.map((s, i) => (
          <div key={i} className="srs-item">
            <span className="g"><b style={{ color: "var(--navy)" }}>{i + 1} · {s[0]}</b> — {s[1]}</span>
            {s[1].includes("NEW") && <span className="chip gold">new skill</span>}
          </div>
        ))}
        <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>Format follows the post-July-2026 HSK 3.0 standard; question counts marked ≈ are directional pending the official spec.</small>
      </div>

      {/* units */}
      <h3 style={{ fontSize: 16.5, color: "var(--navy)", margin: "4px 0 16px" }}>Units in HSK {n} ({L.unitsList.length})</h3>
      <div className="unit-grid">
        {L.unitsList.map((u, i) => {
          const [ic, name, words, count, prog] = u;
          const done = prog === 100, active = prog > 0 && prog < 100, locked = prog === 0;
          const bg = done ? "var(--teal)" : active ? "var(--navy-2)" : "#B6C3D2";
          return (
            <div key={i} className={"card unit" + (locked ? " lock" : "")}>
              {locked && <span className="lockic">🔒</span>}
              <div className="skill-ic" style={{ background: bg }}>{ic}</div>
              <b>{name}</b><small>{words}</small>
              <div className="bar"><i style={{ width: `${prog}%` }} /></div>
              <small style={{ marginTop: 8 }}>
                {count ? `${count} words` : "skill studio"}
                {done && <> · <span className="chip teal" style={{ fontSize: 10.5, padding: "2px 8px" }}>✓ completed</span></>}
                {active && <> · <Link className="btn btn-primary btn-sm" style={{ padding: "5px 12px", fontSize: 12 }} href="/lesson">Continue</Link></>}
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, dim }: { label: string; value: string; sub?: string; dim?: boolean }) {
  return (
    <div>
      <small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 12 }}>{label}</small>
      <div style={{ fontSize: 22, fontWeight: 800, color: dim ? "var(--ink-3)" : "var(--navy)" }}>{value}</div>
      {sub && <small style={{ color: "var(--ink-3)" }}>{sub}</small>}
    </div>
  );
}

export default function Courses() {
  const [level, setLevel] = useState(1);
  return (
    <AppShell active="courses">
      <div className="wrap dash">
        <div className="dash-head">
          <div><h1>Courses — the full HSK 3.0 path</h1><p>Nine levels, three stages. You&apos;re in Elementary, working through HSK 1.</p></div>
        </div>
        <div className="lvl-chips">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} className={"lvl-chip" + (level === n ? " on" : "")} onClick={() => setLevel(n)}>HSK {n}</button>
          ))}
          <button className="lvl-chip" style={{ opacity: 0.55 }}>HSK 7–9 · coming 2027</button>
        </div>
        <LevelDetail n={level} />
      </div>
    </AppShell>
  );
}
