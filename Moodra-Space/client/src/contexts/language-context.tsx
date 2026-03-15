import { createContext, useContext, useState, useEffect } from "react";
import type { Lang } from "@/lib/translations";
import translations from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations["en"];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

/**
 * Detect browser language and map it to a supported Lang code.
 * Called only as a first-run fallback when no saved preference exists.
 */
function detectBrowserLang(): Lang {
  const raw = (navigator.languages?.[0] ?? navigator.language ?? "en").toLowerCase();
  if (raw.startsWith("ru")) return "ru";
  if (raw.startsWith("uk")) return "ua";
  if (raw.startsWith("de")) return "de";
  return "en"; // default / fallback for all unsupported locales
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("moodra_lang") as Lang | null;
    if (saved && ["en", "ru", "ua", "de"].includes(saved)) return saved;
    // No saved preference → auto-detect from browser
    return detectBrowserLang();
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("moodra_lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.lang = lang === "ua" ? "uk" : lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export function getLangInstruction(lang: Lang): string {
  const map: Record<Lang, string> = {
    en: "Write in English.",
    ru: "Пиши на русском языке.",
    ua: "Пиши українською мовою.",
    de: "Schreibe auf Deutsch.",
  };
  return map[lang];
}
