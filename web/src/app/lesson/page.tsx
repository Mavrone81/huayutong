"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, LessonDTO } from "@/lib/api";

type View = "loading" | "ready" | "locked" | "login" | "empty";

export default function Lesson() {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ xpAwarded: number; streak: number; accuracy: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams(window.location.search);
        let id = qs.get("lesson");
        if (!id) {
          const p = await api.getProgress();
          id = p.nextLessonId;
        }
        if (!id) { setView("empty"); return; }
        const l = await api.getLesson(id);
        setLesson(l);
        setView("ready");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setView("login");
        else if (e instanceof ApiError && e.code === "locked") setView("locked");
        else setView("empty");
      }
    })();
  }, []);

  const item = lesson?.items[idx];
  const total = lesson?.items.length ?? 0;

  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (item && i === item.answer) setCorrect((c) => c + 1);
  };

  const next = async () => {
    if (!lesson) return;
    if (idx + 1 < total) {
      setIdx(idx + 1); setPick(null);
    } else {
      const score = Math.round((correct / Math.max(1, total)) * 100);
      try {
        const r = await api.completeLesson(lesson.id, score);
        setResult(r);
      } catch {
        setResult({ xpAwarded: 0, streak: 0, accuracy: score });
      }
      setDone(true);
    }
  };

  if (view === "loading") return <Centered>Loading lesson…</Centered>;
  if (view === "login") return <Centered><h2 style={{ color: "var(--navy)" }}>Please sign in</h2><Link className="btn btn-primary" href="/login" style={{ marginTop: 16 }}>Log in</Link></Centered>;
  if (view === "empty") return <Centered><div style={{ fontSize: 44 }}>🎉</div><h2 style={{ color: "var(--navy)" }}>All caught up!</h2><p style={{ color: "var(--ink-2)", margin: "8px 0 16px" }}>No lessons left to start right now.</p><Link className="btn btn-ghost" href="/dashboard">Back to dashboard</Link></Centered>;
  if (view === "locked") return <Centered><div style={{ fontSize: 44 }}>🔒</div><h2 style={{ color: "var(--navy)" }}>This lesson is Premium</h2><p style={{ color: "var(--ink-2)", margin: "8px 0 16px" }}>Start your free trial to unlock the full HSK path.</p><Link className="btn btn-primary" href="/onboarding">Start 1-month free trial</Link></Centered>;

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="x" onClick={() => router.push("/dashboard")}>✕</button>
        <div className="lbar"><i style={{ width: `${done ? 100 : (idx / Math.max(1, total)) * 100}%` }} /></div>
        <span className="hearts">❤ 5</span>
      </div>

      {!done && item && (
        <div className="card q-card">
          <div className="q-type">{lesson?.icon} {lesson?.title} · choose the meaning</div>
          <div className="q-hanzi">{item.hanzi}</div>
          <div className="q-pinyin">{item.pinyin}</div>
          <button className="audio-btn" onClick={(e) => { const t = e.currentTarget; t.style.transform = "scale(.92)"; setTimeout(() => (t.style.transform = ""), 150); }}>🔊</button>
          <div className="answers">
            {item.options.map((o, i) => (
              <button key={i} className={"ans" + (pick === i ? (i === item.answer ? " correct" : " wrong") : pick !== null && i === item.answer ? " correct" : "")} onClick={() => choose(i)}>
                <small>{["A", "B", "C", "D"][i]}</small><span>{o}</span>
              </button>
            ))}
          </div>
          {pick !== null && (
            <div className={"feedback " + (pick === item.answer ? "ok" : "no")}>
              {pick === item.answer ? `✓ Correct! ${item.hanzi} (${item.pinyin}) = ${item.gloss}` : `✗ ${item.hanzi} (${item.pinyin}) means “${item.gloss}”`}
            </div>
          )}
          <div className="lesson-foot">
            <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{idx + 1} / {total}</span>
            <button className="btn btn-primary" style={{ opacity: pick === null ? 0.5 : 1 }} disabled={pick === null} onClick={next}>{idx + 1 < total ? "Next →" : "Finish"}</button>
          </div>
        </div>
      )}

      {done && result && (
        <div className="card q-card">
          <div className="xp-burst">🎉</div>
          <h2 style={{ color: "var(--navy)", fontSize: 24 }}>Lesson complete!</h2>
          <p style={{ color: "var(--ink-2)", margin: "10px 0 24px" }}>{lesson?.title}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>XP</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--gold)" }}>+{result.xpAwarded}</div></div>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>ACCURACY</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--teal)" }}>{result.accuracy}%</div></div>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>STREAK</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--red)" }}>🔥 {result.streak}</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>Back to dashboard</button>
            <button className="btn btn-primary" onClick={() => router.push("/lesson")}>Next lesson →</button>
          </div>
        </div>
      )}
      <p style={{ textAlign: "center", marginTop: 18, color: "var(--ink-3)", fontSize: 12.5 }}>Answers shown in your chosen language · progress &amp; reviews are saved to your account</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="lesson">
      <div className="card q-card" style={{ marginTop: 40 }}>{children}</div>
    </div>
  );
}
