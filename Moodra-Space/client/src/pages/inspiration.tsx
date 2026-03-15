import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/language-context";
import { SiteFooter } from "@/components/site-footer";
import { LanguagePicker } from "@/components/language-picker";
import { MArrowLeft, MBookOpen, MQuill } from "@/components/icons";
import { Check, Clock, ChevronDown, ChevronUp, Zap, BookMarked, Share2, ArrowRight, PenLine, Bot, Brain, Microscope, User, Scissors, Flame, MessageCircle } from "lucide-react";

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, "<h3 class='article-h3'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='article-h2'>$1</h2>")
    .replace(/^> (.+)$/gm, "<blockquote class='article-quote'>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li class='article-li'>$1</li>")
    .replace(/\n\n/g, "</p><p class='article-p'>")
    .replace(/\n/g, "<br/>");
}

function extractKeyPoints(content: string): string[] {
  const boldMatches = content.match(/\*\*(.*?)\*\*/g) || [];
  return boldMatches
    .map(m => m.replace(/\*\*/g, "").split(".")[0].trim())
    .filter(m => m.length > 10 && m.length < 100)
    .slice(0, 5);
}

function extractPullQuote(content: string): string | null {
  const sentences = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .split(/\n\n/)
    .filter(p => p.length > 80 && p.length < 220 && !p.startsWith("**"));
  return sentences[Math.floor(sentences.length * 0.4)] || null;
}

const ARTICLE_ICONS = [PenLine, Bot, Brain, Microscope, User, Scissors, Flame, MessageCircle];
const ARTICLE_COLORS = [
  { bg: "rgba(249,109,28,0.08)", border: "rgba(249,109,28,0.2)", accent: "#F96D1C" },
  { bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.2)", accent: "#3B82F6" },
  { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", accent: "#10B981" },
  { bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.2)", accent: "#8B5CF6" },
  { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", accent: "#F59E0B" },
  { bg: "rgba(236,72,153,0.07)", border: "rgba(236,72,153,0.2)", accent: "#EC4899" },
  { bg: "rgba(249,109,28,0.08)", border: "rgba(249,109,28,0.2)", accent: "#F96D1C" },
  { bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.2)", accent: "#64748B" },
];

const CHALLENGES: Record<number, { en: string; ru: string; ua: string; de: string }> = {
  0: {
    en: "Open Moodra right now and create 3 chapter titles for your current project — even rough ones. Do it before closing this tab.",
    ru: "Откройте Moodra прямо сейчас и создайте 3 названия глав для вашего проекта — даже приблизительные. Сделайте это до того, как закроете эту вкладку.",
    ua: "Відкрийте Moodra зараз і створіть 3 назви розділів для вашого проекту — навіть приблизні. Зробіть це до того, як закриєте цю вкладку.",
    de: "Öffne Moodra jetzt und erstelle 3 Kapiteltitel für dein Projekt — auch grobe. Tue es, bevor du diesen Tab schließt.",
  },
  1: {
    en: "Write one paragraph yourself right now — about anything. Then go to the AI panel and ask it to continue. Compare your voice to the AI's output.",
    ru: "Напишите один абзац прямо сейчас — о чём угодно. Затем откройте панель ИИ и попросите продолжить. Сравните свой голос с выводом ИИ.",
    ua: "Напишіть один абзац прямо зараз — про що завгодно. Потім відкрийте панель ІІ і попросіть продовжити. Порівняйте свій голос з виводом ІІ.",
    de: "Schreibe jetzt sofort einen Absatz — über irgendetwas. Dann öffne das KI-Panel und bitte es, weiterzuschreiben. Vergleiche deine Stimme mit der Ausgabe.",
  },
  2: {
    en: "Set a 25-minute timer. Open your book in Moodra, enable Deep Writing Mode, and write without stopping until the timer goes off.",
    ru: "Поставьте таймер на 25 минут. Откройте книгу в Moodra, включите режим глубокого письма и пишите без остановки до сигнала.",
    ua: "Поставте таймер на 25 хвилин. Відкрийте книгу в Moodra, увімкніть режим глибокого письма та пишіть без зупинки до сигналу.",
    de: "Stelle einen 25-Minuten-Timer. Öffne dein Buch in Moodra, aktiviere den Tiefschreib-Modus und schreibe ohne Pause bis zum Klingeln.",
  },
  3: {
    en: "Take one chapter you're planning and write its central claim as a hypothesis block. Then add two arguments for it and one counterargument.",
    ru: "Возьмите одну запланированную главу и запишите её центральный тезис как блок гипотезы. Затем добавьте два аргумента за и один против.",
    ua: "Візьміть один запланований розділ і запишіть його центральну тезу як блок гіпотези. Потім додайте два аргументи за і один проти.",
    de: "Nimm ein geplantes Kapitel und schreibe seine zentrale These als Hypothesenblock. Füge dann zwei Argumente dafür und eines dagegen hinzu.",
  },
  4: {
    en: "Pick a character from your current book (or invent one). Answer: what do they want most? What do they secretly fear? What do they believe that isn't true?",
    ru: "Выберите персонажа из вашей книги (или придумайте нового). Ответьте: чего они больше всего хотят? Чего тайно боятся? Во что верят, хотя это неправда?",
    ua: "Виберіть персонажа з вашої книги (або вигадайте нового). Відповідайте: чого вони найбільше хочуть? Чого таємно бояться? У що вірять, хоча це неправда?",
    de: "Wähle eine Figur aus deinem Buch (oder erfinde eine). Antworte: Was wollen sie am meisten? Was fürchten sie heimlich? Was glauben sie, das nicht stimmt?",
  },
  5: {
    en: "Take the last thing you wrote. Read it out loud. Mark every sentence that doesn't sound like you — they're candidates to cut or rewrite.",
    ru: "Возьмите последнее написанное. Прочтите вслух. Отметьте каждое предложение, которое не звучит как вы — это кандидаты на удаление или переработку.",
    ua: "Візьміть останнє написане. Прочитайте вголос. Позначте кожне речення, яке не звучить як ви — це кандидати на видалення або переробку.",
    de: "Nimm das Letzte, was du geschrieben hast. Lies es laut vor. Markiere jeden Satz, der nicht nach dir klingt — das sind Kandidaten zum Kürzen oder Umschreiben.",
  },
  6: {
    en: "Write tomorrow's writing session into your calendar right now. Specific time, specific location. Treat it like a meeting you can't cancel.",
    ru: "Прямо сейчас внесите завтрашнюю сессию письма в календарь. Конкретное время, конкретное место. Относитесь к ней как к встрече, которую нельзя отменить.",
    ua: "Прямо зараз внесіть завтрашню сесію письма в календар. Конкретний час, конкретне місце. Ставтеся до неї як до зустрічі, яку не можна скасувати.",
    de: "Schreibe die morgige Schreibsession jetzt sofort in deinen Kalender. Konkrete Zeit, konkreter Ort. Behandle sie wie ein Meeting, das du nicht absagen kannst.",
  },
  7: {
    en: "Take one idea you've been turning over in your head. Open a new chapter, drop in a Hypothesis block, and write it out — even if it's messy and incomplete.",
    ru: "Возьмите одну идею, которую вы обдумываете. Откройте новую главу, добавьте блок гипотезы и запишите её — даже если получится грубо и неполно.",
    ua: "Візьміть одну ідею, яку ви обмірковуєте. Відкрийте новий розділ, додайте блок гіпотези та запишіть її — навіть якщо вийде грубо і неповно.",
    de: "Nimm eine Idee, über die du nachgedacht hast. Öffne ein neues Kapitel, füge einen Hypothesenblock ein und schreibe sie auf — auch wenn es unfertig wirkt.",
  },
};

const CHAPTER_LABELS = {
  en: { prev: "Previous", next: "Next", read: "Mark as read", unread: "Unread", readTime: "min read", challenge: "5-min challenge", challengeDesc: "Apply this article right now", keyPoints: "Key takeaways", pullQuote: "From the article", copied: "Copied!", share: "Share" },
  ru: { prev: "Назад", next: "Вперёд", read: "Прочитано", unread: "Не прочитано", readTime: "мин. чтения", challenge: "Задание на 5 минут", challengeDesc: "Применить статью прямо сейчас", keyPoints: "Ключевые мысли", pullQuote: "Из статьи", copied: "Скопировано!", share: "Поделиться" },
  ua: { prev: "Назад", next: "Далі", read: "Прочитано", unread: "Не прочитано", readTime: "хв читання", challenge: "Завдання на 5 хвилин", challengeDesc: "Застосуйте статтю прямо зараз", keyPoints: "Ключові думки", pullQuote: "З статті", copied: "Скопійовано!", share: "Поділитися" },
  de: { prev: "Zurück", next: "Weiter", read: "Gelesen", unread: "Ungelesen", readTime: "Min. Lesezeit", challenge: "5-Minuten-Aufgabe", challengeDesc: "Wende diesen Artikel jetzt an", keyPoints: "Kernaussagen", pullQuote: "Aus dem Artikel", copied: "Kopiert!", share: "Teilen" },
};

export default function InspirationPage() {
  const { t, lang } = useLang();
  const L = CHAPTER_LABELS[lang as keyof typeof CHAPTER_LABELS] || CHAPTER_LABELS.en;

  const [active, setActive] = useState(0);
  const [readArticles, setReadArticles] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("moodra_read_articles");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [expandedChallenge, setExpandedChallenge] = useState(false);
  const [expandedPoints, setExpandedPoints] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const article = t.inspiration.articles[active];
  const color = ARTICLE_COLORS[active % ARTICLE_COLORS.length];
  const ArticleIcon = ARTICLE_ICONS[active % ARTICLE_ICONS.length];
  const readTime = Math.ceil(article.content.split(" ").length / 180);
  const keyPoints = extractKeyPoints(article.content);
  const pullQuote = extractPullQuote(article.content);
  const challenge = CHALLENGES[active]?.[lang as keyof typeof CHALLENGES[0]] ?? CHALLENGES[active]?.en ?? "";
  const isRead = readArticles.has(active);

  const readCount = readArticles.size;
  const totalCount = t.inspiration.articles.length;
  const progressPct = Math.round((readCount / totalCount) * 100);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setScrollPct(max > 0 ? Math.round((scrollTop / max) * 100) : 0);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [active]);

  useEffect(() => {
    articleRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setExpandedChallenge(false);
    setExpandedPoints(true);
    setScrollPct(0);
  }, [active]);

  const markRead = useCallback(() => {
    setReadArticles(prev => {
      const next = new Set(prev);
      if (next.has(active)) next.delete(active);
      else next.add(active);
      localStorage.setItem("moodra_read_articles", JSON.stringify(Array.from(next)));
      return next;
    });
  }, [active]);

  const handleShare = () => {
    navigator.clipboard.writeText(article.title + " — Moodra Inspiration").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(30, 58%, 97%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b" style={{
        background: "rgba(250,242,234,0.92)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(249,109,28,0.12)",
      }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/">
            <button
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "#8a7a70" }}
            >
              <MArrowLeft size={16} />
              {t.common.back}
            </button>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs" style={{ color: "#c2a897" }}>
            <BookMarked className="w-3.5 h-3.5" />
            <span>{readCount}/{totalCount}</span>
          </div>
          <LanguagePicker size="sm" />
        </div>
        {/* Reading progress bar */}
        <div className="h-0.5 w-full" style={{ background: "rgba(249,109,28,0.08)" }}>
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${scrollPct}%`,
              background: `linear-gradient(90deg, ${color.accent}, #FF9640)`,
            }}
          />
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto w-full px-6 pt-10 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C" }}>
              <MQuill size={12} />
              {t.inspiration.title}
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#2d2520", letterSpacing: "-0.02em" }}>
              {t.inspiration.title}
            </h1>
            <p className="text-base" style={{ color: "#8a7a70" }}>{t.inspiration.subtitle}</p>
          </div>
          {/* Progress pill */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "#F96D1C" }}>
                {readCount}/{totalCount}
              </span>
              <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "rgba(249,109,28,0.12)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #F96D1C, #FF9640)" }}
                />
              </div>
            </div>
            <span className="text-xs" style={{ color: "#c2a897" }}>
              {progressPct}% read
            </span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pb-12">
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 sticky top-20">
            <div className="flex flex-col gap-1">
              {t.inspiration.articles.map((a, i) => {
                const c = ARTICLE_COLORS[i % ARTICLE_COLORS.length];
                const Ic = ARTICLE_ICONS[i % ARTICLE_ICONS.length];
                return (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className="text-left px-3 py-3 rounded-xl transition-all relative group"
                    style={{
                      background: active === i ? c.bg : "transparent",
                      border: active === i ? `1px solid ${c.border}` : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Ic className="w-3 h-3 flex-shrink-0" style={{ color: active === i ? c.accent : "#b0a090" }} strokeWidth={1.8} />
                      <div className="text-[10px] font-semibold uppercase tracking-wider truncate"
                        style={{ color: active === i ? c.accent : "#b0a090" }}>
                        {a.tag}
                      </div>
                      {readArticles.has(i) && (
                        <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${c.accent}20` }}>
                          <Check className="w-2.5 h-2.5" style={{ color: c.accent }} />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium leading-snug line-clamp-2"
                      style={{ color: active === i ? "#2d2520" : "#5a4a40" }}>
                      {a.title}
                    </div>
                    <div className="text-[10px] mt-1 flex items-center gap-1"
                      style={{ color: "#c2a897" }}>
                      <Clock className="w-2.5 h-2.5" />
                      {Math.ceil(a.content.split(" ").length / 180)} {t.inspiration.readMin}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Article */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#fff",
                border: `1px solid ${color.border}`,
                boxShadow: `0 2px 24px ${color.accent}10`,
              }}
            >
              {/* Colored top bar */}
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.accent}80)` }}
              />

              {/* Article header */}
              <div className="px-8 pt-7 pb-0">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: color.bg }}
                    >
                      <ArticleIcon className="w-4 h-4" style={{ color: color.accent }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: color.bg, color: color.accent }}>
                        {article.tag}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: "#b0a090" }}>
                        <Clock className="w-3 h-3" />
                        {readTime} {t.inspiration.readMin}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-black/5"
                      style={{ color: "#aaa" }}
                      title={L.share}
                    >
                      {copied
                        ? <><Check className="w-3 h-3 text-green-500" /> <span style={{ color: "#10b981" }}>{L.copied}</span></>
                        : <><Share2 className="w-3 h-3" /> <span className="hidden sm:inline">{L.share}</span></>
                      }
                    </button>
                    <button
                      onClick={markRead}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: isRead ? `${color.accent}15` : "rgba(249,109,28,0.05)",
                        color: isRead ? color.accent : "#aaa",
                        border: `1px solid ${isRead ? `${color.accent}30` : "rgba(0,0,0,0.06)"}`,
                      }}
                    >
                      <Check className="w-3 h-3" />
                      {isRead ? L.read : L.unread}
                    </button>
                  </div>
                </div>

                <h2 className="text-[1.65rem] font-bold mb-2 leading-tight" style={{ color: "#2d2520", letterSpacing: "-0.025em" }}>
                  {article.title}
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "#8a7a70", maxWidth: "520px" }}>
                  {article.desc}
                </p>
              </div>

              {/* Key takeaways */}
              {keyPoints.length > 0 && (
                <div className="mx-8 mb-6 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${color.border}`, background: color.bg }}>
                  <button
                    onClick={() => setExpandedPoints(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" style={{ color: color.accent }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: color.accent }}>
                        {L.keyPoints}
                      </span>
                    </div>
                    {expandedPoints
                      ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#c2a897" }} />
                      : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#c2a897" }} />
                    }
                  </button>
                  {expandedPoints && (
                    <div className="px-4 pb-4 flex flex-col gap-2.5">
                      {keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                            style={{ background: `${color.accent}20`, color: color.accent }}
                          >
                            {i + 1}
                          </div>
                          <span className="text-[13px] leading-snug" style={{ color: "#3d2e26" }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="mx-8 h-px mb-6" style={{ background: "rgba(0,0,0,0.05)" }} />

              {/* Article body */}
              <div
                ref={articleRef}
                className="px-8 pb-2 article-body overflow-y-auto"
                style={{ color: "#3d2e26", lineHeight: "1.85", maxHeight: "520px" }}
              >
                <style>{`
                  .article-body p, .article-body .article-p {
                    font-size: 0.9375rem;
                    margin-bottom: 1.3em;
                    color: #3d2e26;
                  }
                  .article-body strong {
                    color: #1a0d06;
                    font-weight: 700;
                  }
                  .article-body .article-h2 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #2d1a0e;
                    margin: 1.6em 0 0.5em;
                    letter-spacing: -0.01em;
                  }
                  .article-body .article-h3 {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #4d3a2e;
                    margin: 1.2em 0 0.4em;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    font-size: 0.78rem;
                  }
                  .article-body .article-quote {
                    border-left: 3px solid;
                    padding: 0.6em 1em;
                    margin: 1.2em 0;
                    font-style: italic;
                    border-radius: 0 8px 8px 0;
                    background: rgba(249,109,28,0.05);
                    border-color: rgba(249,109,28,0.35);
                    color: #5a3a28;
                  }
                  .article-body .article-li {
                    list-style: none;
                    padding-left: 1.4em;
                    position: relative;
                    margin-bottom: 0.5em;
                    font-size: 0.9rem;
                    color: #4d3a2e;
                  }
                  .article-body .article-li::before {
                    content: "→";
                    position: absolute;
                    left: 0;
                    color: rgba(249,109,28,0.6);
                  }
                `}</style>
                <div
                  dangerouslySetInnerHTML={{
                    __html: `<p class="article-p">${parseMarkdown(article.content)}</p>`,
                  }}
                />
              </div>

              {/* Pull quote */}
              {pullQuote && (
                <div className="mx-8 mt-4 mb-5 px-6 py-4 rounded-2xl"
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                  }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: color.accent }}>
                    {L.pullQuote}
                  </p>
                  <p className="text-sm font-medium italic leading-relaxed" style={{ color: "#5a3a28" }}>
                    "{pullQuote.replace(/\*\*/g, "").slice(0, 180)}..."
                  </p>
                </div>
              )}

              {/* Challenge box */}
              {challenge && (
                <div className="mx-8 mb-8 rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(249,109,28,0.25)", background: "rgba(249,109,28,0.04)" }}>
                  <button
                    onClick={() => setExpandedChallenge(v => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: "rgba(249,109,28,0.15)" }}>
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#F96D1C" }}>
                        {L.challenge}
                      </div>
                      <div className="text-xs" style={{ color: "#8a7a70" }}>
                        {L.challengeDesc}
                      </div>
                    </div>
                    {expandedChallenge
                      ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#c2a897" }} />
                      : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#c2a897" }} />
                    }
                  </button>
                  {expandedChallenge && (
                    <div className="px-5 pb-5">
                      <div className="h-px mb-4" style={{ background: "rgba(249,109,28,0.1)" }} />
                      <p className="text-sm leading-relaxed" style={{ color: "#3d2e26" }}>
                        {challenge}
                      </p>
                      <Link href="/">
                        <button
                          className="mt-4 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                          style={{
                            background: "linear-gradient(135deg, #F96D1C, #FF9640)",
                            color: "#fff",
                          }}
                        >
                          <MBookOpen size={12} />
                          Open Moodra
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom navigation */}
              <div
                className="flex items-center justify-between px-8 py-5 border-t"
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              >
                <button
                  onClick={() => active > 0 && setActive(active - 1)}
                  disabled={active === 0}
                  className="flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-70"
                  style={{ color: "#F96D1C" }}
                >
                  <MArrowLeft size={14} />
                  {L.prev}
                </button>

                <div className="flex gap-1.5 items-center">
                  {t.inspiration.articles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: active === i ? "20px" : "6px",
                        height: "6px",
                        background: active === i
                          ? ARTICLE_COLORS[i % ARTICLE_COLORS.length].accent
                          : readArticles.has(i)
                          ? `${ARTICLE_COLORS[i % ARTICLE_COLORS.length].accent}50`
                          : "rgba(0,0,0,0.10)",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => active < t.inspiration.articles.length - 1 && setActive(active + 1)}
                  disabled={active === t.inspiration.articles.length - 1}
                  className="flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-70"
                  style={{ color: "#F96D1C" }}
                >
                  {L.next}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
