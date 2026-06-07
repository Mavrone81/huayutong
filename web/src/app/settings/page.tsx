"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { LANGS, Lang } from "@/lib/dict";

function Toggle({ on, locked, onClick }: { on: boolean; locked?: boolean; onClick?: () => void }) {
  return <div className={"toggle" + (on ? " on" : "")} style={locked ? { opacity: 0.5, pointerEvents: "none" } : undefined} onClick={onClick} />;
}

export default function Settings() {
  const { lang, setLang } = useI18n();
  return (
    <AppShell active="settings">
      <div className="set">
        <div className="card panel">
          <h3>Profile</h3>
          <div className="set-row">
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 17 }}>PL</div>
            <div className="l"><b>Ploy Suwannarat</b><small>ploy@example.com · joined June 2026</small></div>
            <button className="btn btn-ghost btn-sm">Edit</button>
          </div>
        </div>

        <div className="card panel">
          <h3>Learning</h3>
          <div className="set-row">
            <div className="l"><b>App &amp; teaching language</b><small>Everything is taught in this language</small></div>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} style={{ padding: "9px 14px", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 13.5 }}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label.replace("🌐 ", "")}</option>)}
            </select>
          </div>
          <div className="set-row">
            <div className="l"><b>Daily goal</b><small>Used for streaks and reminders</small></div>
            <select defaultValue="10 min" style={{ padding: "9px 14px", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 13.5 }}>
              <option>5 min</option><option>10 min</option><option>20 min</option><option>30 min</option>
            </select>
          </div>
          <div className="set-row"><div className="l"><b>Character set</b><small>Simplified is used by the HSK exam</small></div><span className="chip navy">Simplified 简体</span></div>
          <div className="set-row"><div className="l"><b>Offline lessons</b><small>Download units for low-connectivity study</small></div><ToggleRow defaultOn /></div>
        </div>

        <div className="card panel">
          <h3>Notifications</h3>
          <div className="set-row"><div className="l"><b>Daily reminder</b><small>19:00 · local time</small></div><ToggleRow defaultOn /></div>
          <div className="set-row"><div className="l"><b>Review-due alerts</b><small>When 10+ cards are waiting</small></div><ToggleRow defaultOn /></div>
          <div className="set-row"><div className="l"><b>Trial &amp; billing reminders</b><small>3 days and 24 hours before any charge — always on</small></div><Toggle on locked /></div>
          <div className="set-row"><div className="l"><b>Leaderboards</b><small>Weekly leagues with other learners</small></div><ToggleRow defaultOn /></div>
          <div className="set-row"><div className="l"><b>Tips &amp; offers</b><small>Occasional learning tips by email</small></div><ToggleRow /></div>
        </div>

        <div className="card panel">
          <h3>Account &amp; data</h3>
          <div className="set-row"><div className="l"><b>Export my data</b><small>Progress, vocabulary and billing history (JSON/CSV)</small></div><button className="btn btn-ghost btn-sm">Export</button></div>
          <div className="set-row"><div className="l"><b>Change password</b><small>••••••••</small></div><button className="btn btn-ghost btn-sm">Change</button></div>
          <div className="set-row"><div className="l"><b style={{ color: "var(--red)" }}>Delete account</b><small>Permanently removes all data within 30 days</small></div><button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "var(--red-soft)" }}>Delete…</button></div>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return <Toggle on={on} onClick={() => setOn(!on)} />;
}
