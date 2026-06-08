"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";
import { LangSwitcher } from "./LangSwitcher";
import { api, ProgressDTO } from "@/lib/api";

type Nav = "learn" | "courses" | "review" | "hsk" | "account" | "settings" | "write";

const ITEMS: { key: Nav; href: string; i18n: string; fallback: string; icon: string }[] = [
  { key: "learn", href: "/dashboard", i18n: "nav_learn", fallback: "Learn", icon: "🏠" },
  { key: "courses", href: "/courses", i18n: "nav_courses2", fallback: "Courses", icon: "📚" },
  { key: "review", href: "/lesson", i18n: "nav_review", fallback: "Review", icon: "🧠" },
  { key: "hsk", href: "/hsk", i18n: "nav_hskprep", fallback: "HSK Prep", icon: "🎓" },
  { key: "account", href: "/billing", i18n: "nav_account", fallback: "Account", icon: "👤" },
];

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export function AppShell({ active, children }: { active: Nav; children: React.ReactNode }) {
  const { t } = useI18n();
  const [bell, setBell] = useState(false);
  const [p, setP] = useState<ProgressDTO | null>(null);
  const [avatar, setAvatar] = useState("·");

  useEffect(() => {
    api.getProgress().then(setP).catch(() => setP(null));
    api.getCurrentUser().then((u) => setAvatar(initials(u.name))).catch(() => {});
  }, []);

  const due = p?.reviewsDue ?? 0;

  return (
    <>
      <div className="appbar">
        <div className="wrap appbar-in">
          <Logo />
          <nav className="appnav">
            {ITEMS.map((it) => (
              <Link key={it.key} href={it.href} className={active === it.key ? "on" : ""}>
                {t(it.i18n, it.fallback)}
              </Link>
            ))}
          </nav>
          <div className="appbar-right">
            <LangSwitcher />
            {p && <span className="streak-pill">🔥 {p.streak}</span>}
            {p && <span className="chip teal">⭐ {p.xp.toLocaleString()} XP</span>}
            <span className="bell" onClick={() => setBell((b) => !b)}>🔔{due > 0 && <i>{due}</i>}</span>
            <div className={"bell-dd" + (bell ? " open" : "")}>
              <h5>Notifications</h5>
              {due > 0 ? (
                <Link href="/lesson" className="ntf" onClick={() => setBell(false)}>
                  <span className="ic">🧠</span>
                  <div><b>{due} word{due === 1 ? "" : "s"} due for review</b><small>Tap to clear your review queue</small></div>
                </Link>
              ) : (
                <div className="ntf"><span className="ic">✅</span><div><b>You&apos;re all caught up</b><small>No reviews due right now</small></div></div>
              )}
            </div>
            <Link href="/settings" className="avatar">{avatar}</Link>
          </div>
        </div>
      </div>
      {children}
      <div className="mobile-tabs-spacer" />
      <nav className="mobile-tabs">
        {ITEMS.map((it) => (
          <Link key={it.key} href={it.href} className={active === it.key ? "on" : ""}>
            <span className="ti">{it.icon}</span>{t(it.i18n, it.fallback)}
          </Link>
        ))}
      </nav>
    </>
  );
}
