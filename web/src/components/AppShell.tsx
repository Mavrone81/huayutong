"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";

type Nav = "learn" | "courses" | "review" | "hsk" | "account" | "settings" | "write";

const ITEMS: { key: Nav; href: string; i18n: string; fallback: string }[] = [
  { key: "learn", href: "/dashboard", i18n: "nav_learn", fallback: "Learn" },
  { key: "courses", href: "/courses", i18n: "nav_courses2", fallback: "Courses" },
  { key: "review", href: "/lesson", i18n: "nav_review", fallback: "Review" },
  { key: "hsk", href: "/hsk", i18n: "nav_hskprep", fallback: "HSK Prep" },
  { key: "account", href: "/billing", i18n: "nav_account", fallback: "Account" },
];

export function AppShell({ active, children }: { active: Nav; children: React.ReactNode }) {
  const { t } = useI18n();
  const [bell, setBell] = useState(false);
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
            <span className="streak-pill">🔥 12</span>
            <span className="chip teal">⭐ 2,340 XP</span>
            <span className="bell" onClick={() => setBell((b) => !b)}>🔔<i>3</i></span>
            <div className={"bell-dd" + (bell ? " open" : "")}>
              <h5>Notifications</h5>
              <div className="ntf"><span className="ic">🧠</span><div><b>14 words are due for review</b><small>Clear them in ~6 minutes · 9:00</small></div></div>
              <div className="ntf"><span className="ic">⏳</span><div><b>Trial reminder</b><small>Your free month ends 6 July — 30 days left</small></div></div>
              <div className="ntf"><span className="ic">🏆</span><div><b>You entered the Gold league</b><small>Weekly leaderboard reset · yesterday</small></div></div>
            </div>
            <Link href="/settings" className="avatar">PL</Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
