"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { EX1, SB_PROMPT } from "@/lib/dict";

export default function Lesson() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [ex, setEx] = useState(1);
  const [canNext, setCanNext] = useState(false);

  const go = (n: number) => { setEx(n); setCanNext(false); };
  const next = () => { if (ex < 5) go(ex + 1); };

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="x" onClick={() => router.push("/dashboard")}>✕</button>
        <div className="lbar"><i style={{ width: `${ex * 20}%` }} /></div>
        <span className="hearts">❤ 5</span>
      </div>

      {ex === 1 && <Listening onAnswered={() => setCanNext(true)} t={t} answers={EX1[lang]} />}
      {ex === 2 && <Tone onAnswered={() => setCanNext(true)} t={t} />}
      {ex === 3 && <Sentence onAnswered={() => setCanNext(true)} t={t} prompt={SB_PROMPT[lang]} />}
      {ex === 4 && <Match onAnswered={() => setCanNext(true)} t={t} />}
      {ex === 5 && (
        <div className="card q-card">
          <div className="xp-burst">🎉</div>
          <h2 style={{ color: "var(--navy)", fontSize: 24 }}>Lesson complete!</h2>
          <p style={{ color: "var(--ink-2)", margin: "10px 0 24px" }}>Family &amp; people · Lesson 8 of 12</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>XP</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--gold)" }}>+25</div></div>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>ACCURACY</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--teal)" }}>92%</div></div>
            <div className="card" style={{ padding: "16px 26px" }}><small style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 11 }}>STREAK</small><div style={{ fontSize: 24, fontWeight: 800, color: "var(--red)" }}>🔥 13</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>Back to dashboard</button>
            <button className="btn btn-primary" onClick={() => go(1)}>Next lesson →</button>
          </div>
        </div>
      )}

      {ex !== 5 && (
        <div className="lesson-foot">
          <button className="btn btn-ghost btn-sm">Can&apos;t listen now</button>
          <button className="btn btn-primary" style={{ opacity: canNext ? 1 : 0.5 }} onClick={next}>{t("next", "Next →")}</button>
        </div>
      )}
      <p style={{ textAlign: "center", marginTop: 18, color: "var(--ink-3)", fontSize: 12.5 }}>Lesson 8 of 12 · Family &amp; people · HSK 1 · answers shown in your chosen language</p>
    </div>
  );
}

type T = (k: string, fb?: string) => string;
const AudioBtn = () => <button className="audio-btn">🔊</button>;

function Listening({ onAnswered, t, answers }: { onAnswered: () => void; t: T; answers: string[] }) {
  const [pick, setPick] = useState<number | null>(null);
  const correct = 1;
  return (
    <div className="card q-card">
      <div className="q-type">Listening · choose the meaning</div>
      <div className="q-hanzi">妹妹</div><div className="q-pinyin">mèimei</div>
      <AudioBtn />
      <div className="answers">
        {answers.map((a, i) => (
          <button key={i} className={"ans" + (pick === i ? (i === correct ? " correct" : " wrong") : "")}
            onClick={() => { setPick(i); onAnswered(); }}>
            <small>{["A", "B", "C", "D"][i]}</small><span>{a}</span>
          </button>
        ))}
      </div>
      {pick !== null && <div className={"feedback " + (pick === correct ? "ok" : "no")}>{pick === correct ? t("fb_ok") : t("fb_no")}</div>}
    </div>
  );
}

function Tone({ onAnswered, t }: { onAnswered: () => void; t: T }) {
  const [pick, setPick] = useState<number | null>(null);
  const opts = [["Tone 1 · flat high", "mā ˉ"], ["Tone 2 · rising", "má ˊ"], ["Tone 3 · dip", "mǎ ˇ"], ["Tone 4 · falling", "mà ˋ"]];
  return (
    <div className="card q-card">
      <div className="q-type">Tone drill · which tone do you hear?</div>
      <div className="q-hanzi">妈</div><AudioBtn />
      <div className="answers">
        {opts.map((o, i) => (
          <button key={i} className={"ans" + (pick === i ? (i === 0 ? " correct" : " wrong") : "")} onClick={() => { setPick(i); onAnswered(); }}>
            <small>{o[0]}</small><span style={{ fontSize: 22, fontWeight: 800 }}>{o[1]}</span>
          </button>
        ))}
      </div>
      {pick !== null && <div className={"feedback " + (pick === 0 ? "ok" : "no")}>{pick === 0 ? t("fb2_ok") : t("fb2_no")}</div>}
    </div>
  );
}

function Sentence({ onAnswered, t, prompt }: { onAnswered: () => void; t: T; prompt: string }) {
  const tiles = ["有", "我", "妹妹", "一个", "哥哥", "吗"];
  const [used, setUsed] = useState<number[]>([]);
  const [fb, setFb] = useState<null | boolean>(null);
  const add = (i: number) => { if (!used.includes(i)) setUsed([...used, i]); };
  const reset = () => { setUsed([]); setFb(null); };
  const check = () => { const ok = used.map((i) => tiles[i]).join("") === "我有一个妹妹"; setFb(ok); onAnswered(); };
  return (
    <div className="card q-card">
      <div className="q-type">Translate · build the sentence</div>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>{prompt}</p>
      <div className="tilebox">
        {used.length === 0 ? <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{t("sb_hint", "Tap the tiles in order")}</span>
          : used.map((i, k) => <button key={k} className="tile" onClick={() => setUsed(used.filter((_, j) => j !== k))}>{tiles[i]}</button>)}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {tiles.map((tile, i) => <button key={i} className={"tile" + (used.includes(i) ? " used" : "")} onClick={() => add(i)}>{tile}</button>)}
      </div>
      {fb !== null && <div className={"feedback " + (fb ? "ok" : "no")}>{fb ? t("fb3_ok") : t("fb3_no")}</div>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={reset}>{t("reset", "Reset")}</button>
        <button className="btn btn-navy btn-sm" onClick={check}>{t("check", "Check")}</button>
      </div>
    </div>
  );
}

function Match({ onAnswered, t }: { onAnswered: () => void; t: T }) {
  const items = [
    { k: 1, label: "爸爸", hz: true }, { k: 3, label: "gēge", hz: false },
    { k: 2, label: "姐姐", hz: true }, { k: 1, label: "bàba", hz: false },
    { k: 3, label: "哥哥", hz: true }, { k: 4, label: "dìdi", hz: false },
    { k: 4, label: "弟弟", hz: true }, { k: 2, label: "jiějie", hz: false },
  ];
  const [first, setFirst] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const sel = (i: number) => {
    if (done.includes(i)) return;
    if (first === null) { setFirst(i); return; }
    if (i === first) { setFirst(null); return; }
    if (items[i].k === items[first].k) {
      const nd = [...done, i, first]; setDone(nd); setFirst(null);
      if (nd.length === 8) onAnswered();
    } else {
      setWrong([i, first]); const f = first; setFirst(null);
      setTimeout(() => setWrong([]), 420); void f;
    }
  };
  return (
    <div className="card q-card">
      <div className="q-type">Match · hanzi to pinyin</div>
      <div className="pairs">
        {items.map((it, i) => (
          <button key={i} className={"pair" + (it.hz ? " hz" : "") + (done.includes(i) ? " done" : "") + (first === i || wrong.includes(i) ? " selp" : "")} onClick={() => sel(i)}>{it.label}</button>
        ))}
      </div>
      {done.length === 8 && <div className="feedback ok">{t("fb4_ok")}</div>}
    </div>
  );
}
