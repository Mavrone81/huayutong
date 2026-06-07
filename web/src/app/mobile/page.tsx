"use client";

export default function Mobile() {
  return (
    <>
      <div className="wrap" style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 26, color: "var(--navy)", textAlign: "center" }}>Mobile-first layouts</h1>
        <p style={{ textAlign: "center", color: "var(--ink-2)", marginTop: 8, maxWidth: "48em", marginLeft: "auto", marginRight: "auto" }}>
          The product ships as a React Native app (iOS/Android) sharing the same design tokens. Below: home and lesson on a 390-pt viewport.
        </p>
      </div>
      <div className="phones">
        {/* Phone 1: home */}
        <div className="phone">
          <div className="pstatus"><span>9:41</span><span>华 MandaMix</span><span>🔋 87%</span></div>
          <div className="ph-head">
            <div className="logo" style={{ fontSize: 15 }}><div className="mark" style={{ width: 28, height: 28, fontSize: 14 }}>华</div></div>
            <b style={{ color: "var(--navy)", fontSize: 15 }}>Home</b>
            <span className="streak-pill" style={{ marginLeft: "auto", fontSize: 12, padding: "5px 10px" }}>🔥 12</span>
            <span className="bell" style={{ fontSize: 16 }}>🔔<i>3</i></span>
          </div>
          <div className="ph-body">
            <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <div className="ring" style={{ position: "relative", width: 54, height: 54, flex: "none" }}>
                <svg width="54" height="54" style={{ transform: "rotate(-90deg)" }}><circle cx="27" cy="27" r="22" fill="none" stroke="#E3E9F0" strokeWidth="6" /><circle cx="27" cy="27" r="22" fill="none" stroke="#E9A23B" strokeWidth="6" strokeLinecap="round" strokeDasharray="138" strokeDashoffset="41" /></svg>
                <b style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--navy)" }}>7/10</b>
              </div>
              <div style={{ flex: 1 }}><b style={{ fontSize: 13.5, color: "var(--navy)" }}>Today&apos;s goal</b><br /><small style={{ color: "var(--ink-3)", fontSize: 11.5 }}>3 minutes to keep your streak</small></div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 12, padding: 14 }}>▶ Continue lesson</button>
            <div className="card" style={{ padding: "14px 16px", marginBottom: 12 }}>
              <b style={{ fontSize: 13, color: "var(--navy)" }}>Your course path — HSK 1</b>
              <div className="skill-row" style={{ padding: "10px 0 4px" }}>
                <div className="skill-ic" style={{ width: 38, height: 38, fontSize: 16, background: "var(--navy-2)" }}>家</div>
                <div className="meta"><b style={{ fontSize: 13 }}>Family &amp; people</b><small style={{ fontSize: 11 }}>17/26 · 妹妹 · 哥哥</small><div className="bar" style={{ height: 5 }}><i style={{ width: "65%" }} /></div></div>
              </div>
            </div>
            <div className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
              <b style={{ fontSize: 13, color: "var(--navy)" }}>Smart review queue</b>
              <div className="srs-item" style={{ padding: "8px 0" }}><span className="srs-hz" style={{ fontSize: 17, width: 50 }}>妈妈</span><span className="g" style={{ fontSize: 11.5 }}>māma · mom</span><span className="due" style={{ fontSize: 10 }}>due now</span></div>
              <div className="srs-item" style={{ padding: "8px 0" }}><span className="srs-hz" style={{ fontSize: 17, width: 50 }}>谢谢</span><span className="g" style={{ fontSize: 11.5 }}>xièxie · thank you</span><span className="due" style={{ fontSize: 10, background: "var(--gold-soft)", color: "#B97A18" }}>2h</span></div>
            </div>
          </div>
          <div className="ph-tabs">
            <div className="on"><span className="ti">🏠</span><span>Home</span></div>
            <div><span className="ti">📚</span><span>Courses</span></div>
            <div><span className="ti">🧠</span><span>Review</span></div>
            <div><span className="ti">🎓</span><span>HSK</span></div>
            <div><span className="ti">👤</span><span>Me</span></div>
          </div>
        </div>

        {/* Phone 2: lesson */}
        <div className="phone">
          <div className="pstatus"><span>9:42</span><span>华 MandaMix</span><span>🔋 87%</span></div>
          <div className="ph-head">
            <span style={{ color: "var(--ink-3)" }}>✕</span>
            <div className="lbar" style={{ height: 10 }}><i style={{ width: "45%" }} /></div>
            <span className="hearts" style={{ fontSize: 12.5 }}>❤ 5</span>
          </div>
          <div className="ph-body" style={{ textAlign: "center", paddingTop: 26 }}>
            <div className="q-type" style={{ fontSize: 10.5 }}>Listening · choose the meaning</div>
            <div className="q-hanzi" style={{ fontSize: 54 }}>妹妹</div>
            <div className="q-pinyin" style={{ fontSize: 17 }}>mèimei</div>
            <button className="audio-btn" style={{ width: 46, height: 46, fontSize: 17, margin: "16px auto 6px" }}>🔊</button>
            <div className="answers" style={{ gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
              <button className="ans" style={{ padding: 12, fontSize: 13 }}><small>A</small>younger brother</button>
              <button className="ans correct" style={{ padding: 12, fontSize: 13 }}><small>B</small>younger sister</button>
              <button className="ans" style={{ padding: 12, fontSize: 13 }}><small>C</small>older sister</button>
              <button className="ans" style={{ padding: 12, fontSize: 13 }}><small>D</small>mom</button>
            </div>
            <div className="feedback ok" style={{ fontSize: 12.5, marginTop: 14 }}>✓ Correct! 妹妹 = younger sister</div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", margin: "16px 0 14px" }}>Next →</button>
          </div>
          <div className="ph-tabs">
            <div><span className="ti">🏠</span><span>Home</span></div>
            <div className="on"><span className="ti">📚</span><span>Courses</span></div>
            <div><span className="ti">🧠</span><span>Review</span></div>
            <div><span className="ti">🎓</span><span>HSK</span></div>
            <div><span className="ti">👤</span><span>Me</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
