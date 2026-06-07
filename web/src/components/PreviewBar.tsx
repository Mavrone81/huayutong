"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LANGS, Lang } from "@/lib/dict";

const SCREENS: { href: string; label: string }[] = [
  { href: "/", label: "Landing" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/lesson", label: "Lesson" },
  { href: "/writing", label: "Writing" },
  { href: "/exam", label: "Mock Exam" },
  { href: "/hsk", label: "HSK Prep" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
  { href: "/mobile", label: "📱 Mobile" },
  { href: "/admin", label: "🛠 Admin" },
];

export function PreviewBar() {
  const pathname = usePathname();
  const { lang, setLang } = useI18n();
  return (
    <div className="proto-bar">
      <span className="pb-label">Prototype</span>
      {SCREENS.map((s) => (
        <Link key={s.href} href={s.href} className={pathname === s.href ? "active" : ""}>
          {s.label}
        </Link>
      ))}
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
