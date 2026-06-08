"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, AttemptDTO } from "@/lib/api";

type View = "loading" | "ready" | "login" | "none" | "done";

export default function Exam() {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [att, setAtt] = useState<AttemptDTO | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sec, setSec] = useState(0);
  const [result, setResult] = useState<{ score: number; sections: { name: string; score: number }[] } | null>(null);

  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(window.location.search).get("attempt");
      if (!id) { setView("none"); return; }
      try {
        const a = await api.getAttempt(id);
        setAtt(a); setSec(a.durationMinutes * 60); setView("ready");
      } catch (e) {
        setView(e instanceof ApiError && e.status === 401 ? "login" : "none");
      }
    })();
  }, []);

  useEffect(() => {
    if (view !== "ready") return;
    const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [view]);

  if (view === "loading") return <Centered>Loading exam…</Centered>;
  if (view === "login") return <Centered><h2 style={{ color: "var(--navy)" }}>Please sign in</h2><Link className="btn btn-primary" href="/login" style={{ marginTop: 16 }}>Log in</Link></Centered>;
  if (view === "none") return <Centered><h2 style={{ color: "var(--navy)" }}>No exam in progress</h2><p style={{ color: "var(--ink-2)", margin: "8px 0 16px" }}>Start a mock exam from HSK Prep.</p><Link className="btn btn-primary" href="/hsk">Go to HSK Prep</Link></Centered>;

  if (view === "done" && result) return (
    <Centered>
      <div style={{ fontSize: 48 }}>{result.score >= 60 ? "🎉" : "📚"}</div>
      <h2 style={{ color: "var(--navy)" }}>Mock exam scored</h2>
      <div style={{ fontSize: 46, fontWeight: 800, color: result.score >= 60 ? "var(--teal)" : "var(--danger)", margin: "8px 0" }}>{result.score}%</div>
      <p style={{ color: "var(--ink-2)", marginBottom: 14 }}>{result.score >= 60 ? "Pass — above the 60% threshold." : "Below the 60% pass mark — keep practising."}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
        {result.sections.map((s, i) => (
          <div key={i} className="card" style={{ padding: "12px 20px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>{s.name.toUpperCase()}</small><div style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)" }}>{s.score}%</div></div>
        ))}
      </div>
      <Link className="btn btn-primary" href="/hsk">Back to HSK Prep →</Link>
    </Centered>
  );

  const q = att!.questions[idx];
  const total = att!.questions.length;
  const answered = Object.keys(answers).length;
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const submit = async () => {
    const responses = att!.questions.map((qq, i) => ({ itemId: qq.itemId, chosenGloss: answers[i] != null ? qq.options[answers[i]] : "", section: qq.section }));
    try {
      const res = await api.submitAttempt(att!.attemptId, responses);
      setResult(res); setView("done");
    } catch {
      setResult({ score: 0, sections: [] }); setView("done");
    }
  };

  return (
    <div className="exam">
      <div className="exam-top">
        <b style={{ color: "var(--navy)", fontSize: 16 }}>{att!.title}</b>
        <span className="chip navy">{q.section}</span>
        <span className="chip gold">Question {idx + 1} of {total}</span>
        <span className="timer" style={{ marginLeft: "auto" }}>{mm}:{ss}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/hsk")}>Exit</button>
      </div>

      <div className="exam-cols">
        <div className="card q-card" style={{ textAlign: "center" }}>
          <div className="q-type">{q.section} · choose the meaning</div>
          <div className="q-hanzi">{q.hanzi}</div>
          <div className="q-pinyin">{q.pinyin}</div>
          <div className="answers" style={{ gridTemplateColumns: "1fr", maxWidth: 460, margin: "26px auto 0" }}>
            {q.options.map((o, i) => (
              <button key={i} className={"ans" + (answers[idx] === i ? " correct" : "")} style={{ textAlign: "left" }} onClick={() => setAnswers((a) => ({ ...a, [idx]: i }))}>
                <small>{["A", "B", "C", "D"][i]}</small><span>{o}</span>
              </button>
            ))}
          </div>
          <div className="lesson-foot" style={{ maxWidth: 460, margin: "26px auto 0" }}>
            <button className="btn btn-ghost btn-sm" disabled={idx === 0} style={{ opacity: idx === 0 ? 0.5 : 1 }} onClick={() => setIdx(idx - 1)}>← Previous</button>
            {idx + 1 < total
              ? <button className="btn btn-navy btn-sm" onClick={() => setIdx(idx + 1)}>Next question →</button>
              : <button className="btn btn-primary btn-sm" onClick={submit}>Submit exam</button>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="card panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14 }}>Questions · {answered}/{total} answered</h3>
            <div className="qgrid">
              {att!.questions.map((_, i) => (
                <button key={i} className={"qn" + (i === idx ? " cur" : answers[i] != null ? " done" : "")} onClick={() => setIdx(i)}>{i + 1}</button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={submit}>Submit exam</button>
            <small style={{ color: "var(--ink-3)", display: "block", marginTop: 10 }}>Score ≥ 60% to pass. Graded server-side from your answers.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="exam"><div className="card q-card" style={{ marginTop: 40, textAlign: "center" }}>{children}</div></div>;
}
