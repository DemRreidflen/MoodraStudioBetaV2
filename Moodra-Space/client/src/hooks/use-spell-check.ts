import { useState, useCallback, useRef } from "react";
import {
  checkText,
  stripHtml,
  type SpellCheckMode,
  type SpellCheckLang,
  type LTMatch,
} from "@/lib/spell-check-service";

const STORAGE_KEY = "moodra_spell_check_settings";

interface SpellCheckSettings {
  mode: SpellCheckMode;
  lang: SpellCheckLang;
}

function loadSettings(): SpellCheckSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { mode: "basic", lang: "auto", ...JSON.parse(stored) };
  } catch {}
  return { mode: "basic", lang: "auto" };
}

export function useSpellCheck() {
  const [settings, setSettings] = useState<SpellCheckSettings>(loadSettings);
  const [matches, setMatches] = useState<LTMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [ignoredRules, setIgnoredRules] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAndSet = (next: SpellCheckSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };

  const setMode = useCallback((mode: SpellCheckMode) => {
    setSettings((prev) => saveAndSet({ ...prev, mode }));
    if (mode === "off") setMatches([]);
  }, []);

  const setLang = useCallback((lang: SpellCheckLang) => {
    setSettings((prev) => saveAndSet({ ...prev, lang }));
    setMatches([]);
  }, []);

  const check = useCallback(
    (html: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const text = stripHtml(html);
        if (!text || text.length < 4) {
          setMatches([]);
          return;
        }
        setIsChecking(true);
        try {
          const results = await checkText(text, settings.lang);
          setMatches(results.filter((m) => !ignoredRules.has(m.rule.id)));
        } finally {
          setIsChecking(false);
        }
      }, 600);
    },
    [settings.lang, ignoredRules]
  );

  const ignoreRule = useCallback((ruleId: string) => {
    setIgnoredRules((prev) => { const next = new Set(Array.from(prev)); next.add(ruleId); return next; });
    setMatches((prev) => prev.filter((m) => m.rule.id !== ruleId));
  }, []);

  const clearMatches = useCallback(() => setMatches([]), []);

  return {
    mode: settings.mode,
    lang: settings.lang,
    setMode,
    setLang,
    matches,
    isChecking,
    check,
    ignoreRule,
    clearMatches,
    spellCheckEnabled: settings.mode !== "off",
    langAttr: settings.lang === "auto" ? undefined : settings.lang.split("-")[0],
  };
}
