"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { T, Lang } from "./dict";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key; falls back to English, then to the provided literal. */
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k, fb) => fb ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      (localStorage.getItem("mm_lang") as Lang | null)) || null;
    if (saved && ["en", "th", "vi", "ms"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mm_lang", l);
  };

  const t = (key: string, fallback?: string) =>
    T[lang][key] ?? T.en[key] ?? fallback ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
