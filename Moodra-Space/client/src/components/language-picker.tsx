import { useState, useRef, useEffect } from "react";
import { useLang } from "@/contexts/language-context";
import type { Lang } from "@/lib/translations";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ua", flag: "🇺🇦", label: "Українська" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "ru", flag: "", label: "Харківський" },
];

export function LanguagePicker({ size = "md" }: { size?: "sm" | "md" }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isSm = size === "sm";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl transition-all select-none"
        style={{
          height: isSm ? "32px" : "34px",
          padding: isSm ? "0 10px" : "0 12px",
          background: open ? "rgba(249,109,28,0.1)" : "rgba(249,109,28,0.06)",
          border: "1px solid",
          borderColor: open ? "rgba(249,109,28,0.25)" : "rgba(249,109,28,0.12)",
          color: "#5a4a40",
        }}
        title="Language / Язык"
      >
        {current.flag && (
          <span style={{ fontSize: isSm ? "14px" : "15px", lineHeight: 1 }}>{current.flag}</span>
        )}
        <span
          className="font-semibold tracking-wide uppercase"
          style={{ fontSize: isSm ? "10px" : "11px", color: "#8a7a70" }}
        >
          {current.code}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 rounded-2xl overflow-hidden z-[200]"
          style={{
            background: "#fff",
            border: "1px solid rgba(249,109,28,0.14)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            minWidth: "160px",
            top: "100%",
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{
                background: l.code === lang ? "rgba(249,109,28,0.08)" : "transparent",
                borderBottom: "1px solid rgba(249,109,28,0.06)",
              }}
              onMouseEnter={(e) => {
                if (l.code !== lang) (e.currentTarget as HTMLElement).style.background = "rgba(249,109,28,0.05)";
              }}
              onMouseLeave={(e) => {
                if (l.code !== lang) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "18px", lineHeight: 1, minWidth: "20px", display: "inline-block" }}>
                {l.flag || ""}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: l.code === lang ? "#F96D1C" : "#2d2520" }}>
                  {l.label}
                </span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "#c2a897" }}>
                  {l.code}
                </span>
              </div>
              {l.code === lang && (
                <span className="ml-auto text-xs" style={{ color: "#F96D1C" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
