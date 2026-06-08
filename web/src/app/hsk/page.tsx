"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { api, ReadinessDTO, PlanTask, MockExam } from "@/lib/api";

type State = "loading" | "noplan" | "ready" | "login";

export default function Hsk() {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [r, setR] = useState<ReadinessDTO | null>(null);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [mocks, setMocks] = useState<MockExam[]>([]);
  const [target, setTarget] = useState(4);
  const [examDate, setExamDate] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const rd = await api.getReadiness();
      if (!rd.hasPlan) { setState("noplan"); return; }
      const [plan, mk] = await Promise.all([api.getStudyPlan(), api.getMockExams()]);
      setR(rd); setTasks(plan.tasks); setMocks(mk.mockExams); setState("ready");
    } catch {
      setState("login");
    }
  };
  useEffect(() => { load(); }, []);

  const createPlan = async () => {
    setBusy(true);
    try { await api.createStudyPlan(target, examDate || null); await load(); } finally { setBusy(false); }
  };
  const toggle = async (id: string) => {
    const res = await api.toggleTask(id);
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, is_done: res.isDone } : t)));
  };
  const startMock = async (id: string) => {
    const { attemptId } = await api.startAttempt(id);
    router.push(`/exam?attempt=${attemptId}`);
  };

  if (state === "loading") return <AppShell active="hsk"><div className="wrap dash"><div className="card panel">Loading…</div></div></AppShell>;
  if (state === "login") return <AppShell active="hsk"><div className="wrap dash"><div className="card panel" style={{ textAlign: "center", padding: 40 }}><h3 style={{ marginBottom: 12 }}>Please sign in</h3><Link className="btn btn-primary" href="/login" style={{ display: "inline-flex" }}>Log in</Link></div></div></AppShell>;

  if (state === "noplan") return (
    <AppShell active="hsk">
      <div className="wrap dash">
        <div className="dash-head"><div><h1>HSK exam prep</h1><p>Set a target level and exam date — we&apos;ll build a study plan and track your readiness.</p></div></div>
        <div className="card panel" style={{ maxWidth: 520 }}>
          <h3>🎯 Set your exam goal</h3>
          <label className="field"><small>Target HSK level</small>
            <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>HSK {n}</option>)}
            </select>
          </label>
          <label className="field"><small>Exam date (optional)</small><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></label>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={createPlan}>{busy ? "Creating…" : "Create my study plan →"}</button>
        </div>
      </div>
    </AppShell>
  );

  const pct = r!.readinessPct ?? 0;
  const offset = Math.round(236 * (1 - pct / 100));
  const sections = r!.sectionScores ?? [];
  const weakest = sections.length ? [...sections].sort((a, b) => a.score - b.score)[0] : null;
  const hist = r!.history ?? [];

  return (
    <AppShell active="hsk">
      <div className="wrap dash">
        <div className="dash-head">
          <div><h1>HSK {r!.targetLevel} — exam plan</h1><p>{r!.examDate ? `Target exam: ${new Date(r!.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${r!.daysLeft} days left` : "No exam date set"}</p></div>
        </div>

        <div className="resp-asym">
          <div style={{ display: "grid", gap: 20 }}>
            <div className="card" style={{ padding: 30, textAlign: "center" }}>
              <h3 style={{ fontSize: 16, color: "var(--navy)", marginBottom: 8 }}>Readiness score</h3>
              <div style={{ position: "relative", width: 190, height: 110, margin: "6px auto 4px", overflow: "hidden" }}>
                <svg viewBox="0 0 190 190" style={{ width: 190, height: 190 }}>
                  <path d="M 20 95 A 75 75 0 0 1 170 95" fill="none" stroke="#E3E9F0" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 20 95 A 75 75 0 0 1 170 95" fill="none" stroke="#E9A23B" strokeWidth="16" strokeLinecap="round" strokeDasharray="236" strokeDashoffset={offset} />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontSize: 34, fontWeight: 800, color: "var(--navy)" }}>{pct}%</div>
              </div>
              <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 4 }}>Estimated level today: <b>HSK {r!.estimatedLevel}</b></p>
              <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 20 }}>
                <Metric v={String(r!.wordsMastered ?? 0)} label="words mastered" />
                <Metric v={(r!.wordsNeeded ?? 0).toLocaleString()} label={`needed for HSK ${r!.targetLevel}`} />
                <Metric v={r!.lastMockScore != null ? `${r!.lastMockScore}%` : "—"} label="last mock score" />
              </div>
            </div>

            <div className="card panel">
              <h3>Section scores — last mock</h3>
              {sections.length === 0 && <small style={{ color: "var(--ink-3)" }}>Take a mock exam to see your section breakdown.</small>}
              {sections.map((s, i) => (
                <div key={i} className="srs-item"><span className="g" style={{ width: 90, flex: "none", fontWeight: 700, color: "var(--navy)" }}>{s.name}</span><div className="bar" style={{ flex: 1, margin: 0 }}><i style={{ width: `${s.score}%`, background: s.score < 60 ? "linear-gradient(90deg,var(--red),#E66B52)" : undefined }} /></div><span style={{ fontWeight: 800, fontSize: 13, width: 42, textAlign: "right" }}>{s.score}%</span></div>
              ))}
              {weakest && <small style={{ color: "var(--ink-3)", display: "block", marginTop: 12 }}>{weakest.name} is your bottleneck — focus your reviews there.</small>}
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div className="card panel">
              <h3><span>Today&apos;s study plan</span><span className="chip teal">{tasks.filter((t) => t.is_done).length}/{tasks.length} done</span></h3>
              {tasks.length === 0 && <small style={{ color: "var(--ink-3)" }}>No tasks yet.</small>}
              {tasks.map((t) => (
                <div key={t.id} className="srs-item" style={{ cursor: "pointer" }} onClick={() => toggle(t.id)}>
                  <span style={{ width: 20, color: t.is_done ? "var(--teal)" : "var(--ink-3)", fontSize: 16 }}>{t.is_done ? "☑" : "☐"}</span>
                  <span className="g" style={{ color: "var(--navy)", textDecoration: t.is_done ? "line-through" : "none", opacity: t.is_done ? 0.6 : 1 }}>{t.description_key}</span>
                  <span className="chip navy">{new Date(t.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>

            <div className="card panel">
              <h3>Mock exams</h3>
              {mocks.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--line)" }}>
                  <div className="lvlrow"><div className="lv" style={m.best_score != null ? { background: "var(--teal-soft)", color: "var(--teal)" } : undefined}>H{m.hsk_level}</div></div>
                  <div style={{ flex: 1 }}><b style={{ fontSize: 14.5 }}>{m.title_key}</b><br /><small style={{ color: "var(--ink-3)" }}>{m.duration_minutes} min{m.attempts ? ` · best ${m.best_score}% · ${m.attempts} attempt(s)` : " · not attempted"}</small></div>
                  <button className={"btn btn-sm " + (m.best_score != null ? "btn-ghost" : "btn-primary")} onClick={() => startMock(m.id)}>{m.best_score != null ? "Retake" : "Start"}</button>
                </div>
              ))}
            </div>

            <div className="card panel">
              <h3>Readiness history</h3>
              {hist.length === 0 && <small style={{ color: "var(--ink-3)" }}>Your readiness trend will appear after your first mock exam.</small>}
              {hist.length > 0 && (
                <div className="wk" style={{ height: 80 }}>
                  {hist.map((h, i) => (
                    <div key={i} className="hit"><i style={{ height: `${Math.max(6, h.pct)}%`, background: i === hist.length - 1 ? "linear-gradient(180deg,var(--teal),#3DBEAF)" : undefined }} />{new Date(h.at).toLocaleDateString("en-GB", { month: "short" })}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ v, label }: { v: string; label: string }) {
  return <div><b style={{ display: "block", fontSize: 19, color: "var(--navy)" }}>{v}</b><small style={{ color: "var(--ink-3)", fontSize: 12 }}>{label}</small></div>;
}
