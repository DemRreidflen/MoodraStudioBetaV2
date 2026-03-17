export type SpellCheckMode = "off" | "basic" | "smart";
export type SpellCheckLang = "auto" | "en-US" | "ru-RU" | "uk-UA" | "de-DE";

export interface LTMatch {
  message: string;
  shortMessage: string;
  replacements: Array<{ value: string }>;
  offset: number;
  length: number;
  context: { text: string; offset: number; length: number };
  sentence: string;
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: { id: string; name: string };
  };
}

const IGNORED_RULE_IDS = new Set([
  "WHITESPACE_RULE",
  "UNLIKELY_OPENING_PUNCTUATION",
  "EN_QUOTES",
  "DOUBLE_PUNCTUATION",
]);

const cache = new Map<string, LTMatch[]>();
const MAX_CACHE = 200;

export async function checkText(
  text: string,
  lang: SpellCheckLang
): Promise<LTMatch[]> {
  if (!text.trim() || text.length < 4) return [];
  // Pass "auto" through to LanguageTool for server-side auto-detection
  const effLang = lang;
  const key = `${effLang}:${text}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch("/api/text-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: effLang }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const matches: LTMatch[] = (data.matches || []).filter(
      (m: LTMatch) => !IGNORED_RULE_IDS.has(m.rule.id)
    );
    if (cache.size >= MAX_CACHE) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    cache.set(key, matches);
    return matches;
  } catch {
    return [];
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export const LANG_LABELS: Record<SpellCheckLang, string> = {
  auto: "Auto",
  "en-US": "EN",
  "ru-RU": "RU",
  "uk-UA": "UK",
  "de-DE": "DE",
};

export const LANG_FULL_LABELS: Record<SpellCheckLang, string> = {
  auto: "Auto",
  "en-US": "English",
  "ru-RU": "Русский",
  "uk-UA": "Українська",
  "de-DE": "Deutsch",
};

export const LANG_BROWSER_ATTR: Record<SpellCheckLang, string | undefined> = {
  auto: undefined,
  "en-US": "en",
  "ru-RU": "ru",
  "uk-UA": "uk",
  "de-DE": "de",
};
