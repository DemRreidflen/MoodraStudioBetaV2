import { X, Key, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { type Lang } from "@/lib/translations";

export type AiErrorType = "no_key" | "quota" | "invalid_key";
export type FeatureCtx = "ai_panel" | "style" | "improve" | "codex" | "habits" | "general";

interface AiErrorModalProps {
  type: AiErrorType;
  lang: Lang;
  featureCtx?: FeatureCtx;
  onClose: () => void;
}

const FEATURE_LABELS: Record<FeatureCtx, Record<Lang, string>> = {
  ai_panel: { en: "AI co-author", ru: "ИИ-соавтор", ua: "ШІ-співавтор", de: "KI-Koautor" },
  style: { en: "style analysis", ru: "анализ стиля", ua: "аналіз стилю", de: "Stilanalyse" },
  improve: { en: "chapter improvement", ru: "улучшение главы", ua: "покращення розділу", de: "Kapitelverbesserung" },
  codex: { en: "Codex AI", ru: "ИИ в Кодексе", ua: "ШІ в Кодексі", de: "Kodex-KI" },
  habits: { en: "writing insights", ru: "аналитика письма", ua: "аналітика письма", de: "Schreibanalyse" },
  general: { en: "this AI feature", ru: "эта функция ИИ", ua: "ця функція ШІ", de: "diese KI-Funktion" },
};

type Config = {
  icon: typeof Key | typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  title: Record<Lang, string>;
  body: (featureLabel: string, lang: Lang) => string;
  cta: Record<Lang, string>;
  ctaPath?: string;
  ctaUrl?: string;
  linkText: Record<Lang, string>;
  linkPath?: string;
  linkUrl?: string;
};

const CONFIG: Record<AiErrorType, Config> = {
  no_key: {
    icon: Key,
    iconBg: "rgba(249,109,28,0.12)",
    iconColor: "#F96D1C",
    title: {
      en: "API key required",
      ru: "Необходим API ключ",
      ua: "Потрібен API ключ",
      de: "API-Schlüssel erforderlich",
    },
    body: (fl, lang) => ({
      en: `${fl.charAt(0).toUpperCase() + fl.slice(1)} requires your OpenAI API key. Moodra itself is free — but GPT models are paid through your own OpenAI account. Add a key, top up $5, and all AI features activate. One key covers everything.`,
      ru: `Для работы функции «${fl}» нужен ключ OpenAI API. Moodra бесплатна — но сами модели GPT работают через ваш аккаунт OpenAI. Добавьте ключ, пополните баланс на $5 — и все функции ИИ активируются. Один ключ на всё.`,
      ua: `Для роботи функції «${fl}» потрібен ключ OpenAI API. Moodra безплатна — але самі моделі GPT працюють через ваш акаунт OpenAI. Додайте ключ, поповніть баланс на $5 — і всі функції ШІ активуються.`,
      de: `${fl.charAt(0).toUpperCase() + fl.slice(1)} benötigt deinen OpenAI-API-Schlüssel. Moodra selbst ist kostenlos — aber GPT-Modelle laufen über dein OpenAI-Konto. Schlüssel hinzufügen, $5 aufladen, und alle KI-Funktionen sind aktiv.`,
    }[lang]),
    cta: { en: "Add key in settings", ru: "Добавить ключ в настройках", ua: "Додати ключ у налаштуваннях", de: "Schlüssel in Einstellungen hinzufügen" },
    ctaPath: "/settings",
    linkText: { en: "What is an API key? →", ru: "Что такое API ключ →", ua: "Що таке API ключ →", de: "Was ist ein API-Schlüssel? →" },
    linkPath: "/api-key-guide",
  },
  invalid_key: {
    icon: Key,
    iconBg: "rgba(249,109,28,0.12)",
    iconColor: "#F96D1C",
    title: {
      en: "API key not working",
      ru: "Ключ не работает",
      ua: "Ключ не працює",
      de: "API-Schlüssel funktioniert nicht",
    },
    body: (_fl, lang) => ({
      en: "Check that your key was copied completely and starts with sk-. If you just created it, wait a minute and try again. Keys sometimes take a moment to activate.",
      ru: "Проверьте, что ключ скопирован полностью и начинается с sk-. Если вы только что создали ключ — подождите минуту и попробуйте снова. Иногда ключи активируются не сразу.",
      ua: "Перевірте, що ключ скопійований повністю і починається з sk-. Якщо ви щойно створили ключ — зачекайте хвилину і спробуйте знову.",
      de: "Prüfe, ob der Schlüssel vollständig kopiert wurde und mit sk- beginnt. Wenn du ihn gerade erstellt hast, warte eine Minute und versuche es erneut.",
    }[lang]),
    cta: { en: "Update key in settings", ru: "Обновить ключ в настройках", ua: "Оновити ключ у налаштуваннях", de: "Schlüssel in Einstellungen aktualisieren" },
    ctaPath: "/settings",
    linkText: { en: "How to get a working key →", ru: "Как получить рабочий ключ →", ua: "Як отримати робочий ключ →", de: "So erhältst du einen gültigen Schlüssel →" },
    linkPath: "/api-key-guide",
  },
  quota: {
    icon: AlertTriangle,
    iconBg: "rgba(234,88,12,0.10)",
    iconColor: "#ea8c0c",
    title: {
      en: "OpenAI balance exhausted",
      ru: "Баланс OpenAI исчерпан",
      ua: "Баланс OpenAI вичерпано",
      de: "OpenAI-Guthaben erschöpft",
    },
    body: (_fl, lang) => ({
      en: "Your OpenAI account has run out of credits. Top up your balance — even $5 usually lasts several months of active writing. AI requests will resume immediately after.",
      ru: "На вашем аккаунте OpenAI закончились средства. Пополните баланс — даже $5 обычно хватает на несколько месяцев активной работы. ИИ-запросы возобновятся сразу после пополнения.",
      ua: "На вашому акаунті OpenAI закінчилися кошти. Поповніть баланс — навіть $5 зазвичай вистачає на кілька місяців активної роботи.",
      de: "Dein OpenAI-Konto hat kein Guthaben mehr. Lade es auf — schon $5 reichen meist für mehrere Monate aktiven Schreibens.",
    }[lang]),
    cta: { en: "Top up on platform.openai.com", ru: "Пополнить на platform.openai.com", ua: "Поповнити на platform.openai.com", de: "Auf platform.openai.com aufladen" },
    ctaUrl: "https://platform.openai.com/settings/billing/overview",
    linkText: { en: "Check account status →", ru: "Проверить состояние аккаунта →", ua: "Перевірити стан акаунту →", de: "Kontostatus prüfen →" },
    linkUrl: "https://platform.openai.com/usage",
  },
};

export function AiErrorModal({ type, lang, featureCtx = "general", onClose }: AiErrorModalProps) {
  const [, navigate] = useLocation();
  const c = CONFIG[type];
  const Icon = c.icon;
  const featureLabel = FEATURE_LABELS[featureCtx][lang];

  const handleCta = () => {
    if (c.ctaUrl) {
      window.open(c.ctaUrl, "_blank");
    } else if (c.ctaPath) {
      navigate(c.ctaPath);
      onClose();
    }
  };

  const handleLink = () => {
    if (c.linkUrl) {
      window.open(c.linkUrl, "_blank");
    } else if (c.linkPath) {
      navigate(c.linkPath);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 relative"
        style={{ background: "hsl(30, 58%, 97%)", boxShadow: "0 32px 96px rgba(0,0,0,0.20)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ background: "rgba(0,0,0,0.07)" }}
        >
          <X className="w-3.5 h-3.5" style={{ color: "#5a4a40" }} />
        </button>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: c.iconBg }}>
          <Icon className="w-5 h-5" style={{ color: c.iconColor }} strokeWidth={1.8} />
        </div>

        <h2 className="text-lg font-bold mb-3 leading-snug" style={{ color: "#1a1a1a" }}>
          {c.title[lang]}
        </h2>

        <p className="text-sm leading-relaxed mb-6" style={{ color: "#6a5a50" }}>
          {c.body(featureLabel, lang)}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCta}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
          >
            {c.cta[lang]}
            <ArrowRight className="w-4 h-4" />
          </button>

          {(c.linkPath || c.linkUrl) && (
            <button
              onClick={handleLink}
              className="flex items-center justify-center gap-1.5 text-sm py-2 transition-opacity hover:opacity-70"
              style={{ color: "#8a7a70" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {c.linkText[lang]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
