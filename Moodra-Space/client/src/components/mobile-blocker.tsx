import { useEffect, useState } from "react";
import { useLang } from "@/contexts/language-context";
import { MQuill } from "@/components/icons";

const MESSAGES: Record<string, { title: string; body: string; hint: string }> = {
  en: {
    title: "It's built for the full picture",
    body: "Writing a book means seeing your structure, notes, research, and AI all at once. That requires a real screen.",
    hint: "Open Moodra on a desktop or laptop for the full experience. Your account and books are already waiting.",
  },
  ru: {
    title: "Создана для полного погружения",
    body: "Писать книгу — значит видеть всё сразу: структуру, заметки, исследования и ИИ. Для этого нужен настоящий экран.",
    hint: "Откройте Moodra на компьютере или ноутбуке. Ваши книги и аккаунт уже ждут вас.",
  },
  ua: {
    title: "Створена для повного занурення",
    body: "Писати книгу — значить бачити все одразу: структуру, нотатки, дослідження та ШІ. Для цього потрібен справжній екран.",
    hint: "Відкрийте Moodra на комп'ютері або ноутбуці. Ваші книги й акаунт вже чекають.",
  },
  de: {
    title: "Für das große Bild gemacht",
    body: "Ein Buch schreiben bedeutet, alles auf einmal zu sehen — Struktur, Notizen, Recherche und KI. Dafür braucht man einen echten Bildschirm.",
    hint: "Öffne Moodra auf einem Desktop oder Laptop. Dein Konto und deine Bücher warten bereits.",
  },
};

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return <>{children}</>;

  const msg = MESSAGES[lang] ?? MESSAGES.en;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 text-center"
      style={{ background: "hsl(30, 58%, 97%)" }}
    >
      <div className="max-w-sm w-full flex flex-col items-center gap-6">
        <img
          src="/moodra-logo-full.png"
          alt="Moodra"
          style={{ height: "44px", width: "auto", objectFit: "contain" }}
        />

        <div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "#2d2520", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {msg.title}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#8a7a70" }}>
            {msg.body}
          </p>
        </div>

        <div
          className="w-full rounded-2xl p-4 text-left"
          style={{
            background: "#fff",
            border: "1px solid rgba(249,109,28,0.12)",
            boxShadow: "0 2px 16px rgba(249,109,28,0.06)",
          }}
        >
          <div className="flex items-start gap-3">
            <MQuill size={18} style={{ color: "#F96D1C", flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#5a4a40" }}>
              {msg.hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
