"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Exam() {
  const router = useRouter();
  const [sec, setSec] = useState(13 * 60 + 46);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const opts = [
    ["A", "她是我的老师。", "tā shì wǒ de lǎoshī", false],
    ["B", "她是我的妈妈。", "tā shì wǒ de māma", true],
    ["C", "他是我的爸爸。", "tā shì wǒ de bàba", false],
  ] as const;

  const cell = (n: number) => {
    const done = [1, 2, 3, 4, 5], flag = [6], cur = [7];
    const cls = cur.includes(n) ? "cur" : flag.includes(n) ? "flag" : done.includes(n) ? "done" : "";
    return <button key={n} className={"qn " + cls}>{n}</button>;
  };

  return (
    <div className="exam">
      <div className="exam-top">
        <b style={{ color: "var(--navy)", fontSize: 16 }}>HSK 1 Mock Exam</b>
        <span className="chip navy">Section 1 · Listening</span>
        <span className="chip gold">Question 7 of 20</span>
        <span className="timer" style={{ marginLeft: "auto" }}>{mm}:{ss}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/hsk")}>Exit</button>
      </div>

      <div className="exam-cols">
        <div className="card q-card" style={{ textAlign: "center" }}>
          <div className="q-type">Listen, then choose the correct statement</div>
          <button className="audio-btn">🔊</button>
          <small style={{ color: "var(--ink-3)" }}>Plays remaining: 1 of 2</small>
          <div className="answers" style={{ gridTemplateColumns: "1fr", maxWidth: 460, margin: "26px auto 0" }}>
            {opts.map((o, i) => (
              <button key={i} className={"ans" + (pick === i ? (o[3] ? " correct" : " wrong") : "")} style={{ textAlign: "left" }} onClick={() => setPick(i)}>
                <small>{o[0]}</small><span className="hanzi" style={{ fontSize: 19 }}>{o[1]}</span><br /><span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{o[2]}</span>
              </button>
            ))}
          </div>
          <div className="lesson-foot" style={{ maxWidth: 460, margin: "26px auto 0" }}>
            <button className="btn btn-ghost btn-sm">🚩 Flag for review</button>
            <button className="btn btn-navy btn-sm">Next question →</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="card panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14 }}>Questions</h3>
            <div className="qgrid">{Array.from({ length: 20 }, (_, i) => cell(i + 1))}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11.5, color: "var(--ink-3)", flexWrap: "wrap" }}>
              <span>🟩 answered</span><span>🟨 flagged</span><span>⬜ unseen</span>
            </div>
          </div>
          <div className="card panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14 }}>Exam format · HSK 1</h3>
            <div className="srs-item"><span className="g"><b style={{ color: "var(--navy)" }}>1 · Listening</b> — 20 q · 15 min</span><span className="chip gold">now</span></div>
            <div className="srs-item"><span className="g"><b style={{ color: "var(--navy)" }}>2 · Reading</b> — 20 q · 17 min</span></div>
            <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>Mirrors the official computer-based format. Score ≥ 60% to pass.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
