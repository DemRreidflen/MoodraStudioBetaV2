import { Link } from "wouter";
import { useLang } from "@/contexts/language-context";

interface SiteFooterProps {
  dark?: boolean;
}

export function SiteFooter({ dark = false }: SiteFooterProps) {
  const { t, lang } = useLang();

  const missionLabel =
    lang === "ru" ? "Миссия" :
    lang === "ua" ? "Місія" :
    lang === "de" ? "Mission" :
    "Mission";

  const linkColor = dark ? "rgba(148,163,184,0.55)" : "#8a7a70";
  const taglineColor = dark ? "rgba(129,140,248,0.55)" : "#c2a897";

  return (
    <footer
      className="w-full border-t mt-auto"
      style={{
        borderColor: dark ? "rgba(129,140,248,0.14)" : "rgba(249,109,28,0.12)",
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(250,242,234,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: taglineColor }}>
          {t.footer.tagline}
        </span>

        <nav className="flex items-center gap-5 flex-wrap justify-center">
          <Link
            href="/mission"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
          >
            {missionLabel}
          </Link>
          <Link
            href="/inspiration"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
            data-testid="footer-inspiration"
          >
            {t.footer.inspiration}
          </Link>
          <Link
            href="/codex"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
            data-testid="footer-codex"
          >
            {t.footer.codex}
          </Link>
          <Link
            href="/features"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
            data-testid="footer-features"
          >
            {t.footer.features}
          </Link>
          <Link
            href="/faq"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
            data-testid="footer-faq"
          >
            {t.footer.faq}
          </Link>
          <Link
            href="/api-key-guide"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: linkColor, opacity: 0.85 }}
            data-testid="footer-api-guide"
          >
            {t.footer.apiGuide}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
