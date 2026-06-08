"use client";

import { useI18n } from "@/lib/i18n";
import { LANGS, Lang } from "@/lib/dict";

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      style={{
        padding: "8px 10px", border: "1.5px solid var(--line)", borderRadius: 10,
        fontSize: 13, fontWeight: 600, background: "#fff", color: "var(--ink-2)", cursor: "pointer",
      }}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
