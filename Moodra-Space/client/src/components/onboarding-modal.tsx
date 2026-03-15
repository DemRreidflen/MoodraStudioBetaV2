import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { X, ArrowRight, ArrowLeft, Sparkles, Key, BookMarked, Flame, Check, ExternalLink, Loader2 } from "lucide-react";
import { type Lang } from "@/lib/translations";

interface OnboardingModalProps {
  lang: Lang;
  userId: string;
  onClose: () => void;
}

const COPY = {
  en: {
    stepOf: (s: number, t: number) => `Step ${s} of ${t}`,
    done: "Done, now you're ready to create!",
    close: "Start writing",
    next: "Next",
    skip: "Skip for now",
    steps: [
      {
        icon: Sparkles,
        iconColor: "#6366f1",
        iconBg: "rgba(99,102,241,0.12)",
        title: "Welcome to Moodra Beta",
        body: "Thank you for joining the beta. Every feature you see is experimental — built with care, but still evolving. Your writing, your feedback, and your patience help shape something real.\n\nThis platform exists because existing tools fell short. Moodra is the tool we wished we had. Use it freely. If something breaks, tell us.",
        cta: null,
        ctaLabel: null,
      },
      {
        icon: Key,
        iconColor: "#F96D1C",
        iconBg: "rgba(249,109,28,0.12)",
        title: "AI works better with your own key",
        body: "Moodra includes free AI out of the box — no key required. But for the full experience (GPT-4o mini, faster responses, no queue), connect your own OpenAI API key.\n\nIt takes two minutes. You pay OpenAI directly, $5 usually lasts several months.",
        cta: "settings",
        ctaLabel: "Add API key in settings",
        inputLabel: "Or paste your key here:",
        placeholder: "sk-...",
        learnMore: "See all AI models →",
        learnMorePath: "/models",
        guideLink: "What is an API key?",
        guidePath: "/api-key-guide",
      },
      {
        icon: BookMarked,
        iconColor: "#8B5CF6",
        iconBg: "rgba(139,92,246,0.12)",
        title: "AI is the instrument. You are the author.",
        body: "Codex is your persistent creative memory — characters, places, concepts, objects. Everything you add is automatically shared with the AI co-author.\n\nA word on how Moodra thinks: every sentence the AI helps you draft is yours to react to, revise, and own. AI does not write your book — you do. It offers a draft; what you make of it is entirely yours.",
        cta: "/codex",
        ctaLabel: "Open Codex",
      },
      {
        icon: Flame,
        iconColor: "#ef4444",
        iconBg: "rgba(239,68,68,0.10)",
        title: "Build a writing habit",
        body: "Writing is a daily act, not an occasional one. The Habits tracker helps you set a goal — words per day, chapters per week — and shows your streak calendar.\n\nConsistency beats inspiration. The platform tracks your sessions so you can see your progress, not just your product.",
        cta: "/habits",
        ctaLabel: "See Writing Habits",
      },
    ],
  },
  ru: {
    stepOf: (s: number, t: number) => `Шаг ${s} из ${t}`,
    done: "Готово, теперь вы готовы творить!",
    close: "Начать писать",
    next: "Далее",
    skip: "Пропустить",
    steps: [
      {
        icon: Sparkles,
        iconColor: "#6366f1",
        iconBg: "rgba(99,102,241,0.12)",
        title: "Добро пожаловать в Moodra Beta",
        body: "Спасибо, что присоединились к бета-тестированию. Каждая функция, которую вы видите, работает в экспериментальном режиме — создана с заботой, но всё ещё развивается. Ваше письмо, обратная связь и терпение помогают строить что-то настоящее.\n\nЭта платформа создана потому, что существующие инструменты не справлялись. Moodra — это инструмент, который мы сами хотели иметь. Пользуйтесь свободно. Если что-то сломается — напишите нам.",
        cta: null,
        ctaLabel: null,
      },
      {
        icon: Key,
        iconColor: "#F96D1C",
        iconBg: "rgba(249,109,28,0.12)",
        title: "ИИ работает лучше с вашим ключом",
        body: "Moodra включает бесплатный ИИ прямо из коробки — без ключа. Но для полного опыта (GPT-4o mini, быстрые ответы, без очередей) подключите собственный ключ OpenAI API.\n\nЭто займёт две минуты. Вы платите напрямую OpenAI — $5 обычно хватает на несколько месяцев.",
        cta: "settings",
        ctaLabel: "Добавить ключ в настройках",
        inputLabel: "Или вставьте ключ здесь:",
        placeholder: "sk-...",
        learnMore: "Посмотреть все модели ИИ →",
        learnMorePath: "/models",
        guideLink: "Что такое API ключ?",
        guidePath: "/api-key-guide",
      },
      {
        icon: BookMarked,
        iconColor: "#8B5CF6",
        iconBg: "rgba(139,92,246,0.12)",
        title: "ИИ — инструмент. Вы — автор.",
        body: "Кодекс — ваша постоянная творческая память: персонажи, места, концепции, объекты. Всё, что вы добавляете, автоматически передаётся ИИ-соавтору.\n\nО том, как думает Moodra: каждое предложение, которое ИИ набрасывает — ваше. Вы реагируете, редактируете, присваиваете. ИИ не пишет вашу книгу — пишете вы. Он даёт черновик — вы делаете из него текст.",
        cta: "/codex",
        ctaLabel: "Открыть Кодекс",
      },
      {
        icon: Flame,
        iconColor: "#ef4444",
        iconBg: "rgba(239,68,68,0.10)",
        title: "Сформируйте привычку писать",
        body: "Письмо — это ежедневный акт, а не случайный порыв. Трекер привычек помогает поставить цель — слов в день или глав в неделю — и показывает серию дней в календаре.\n\nПостоянство важнее вдохновения. Платформа фиксирует ваши сессии, чтобы вы видели прогресс, а не только результат.",
        cta: "/habits",
        ctaLabel: "Открыть трекер привычек",
      },
    ],
  },
  ua: {
    stepOf: (s: number, t: number) => `Крок ${s} з ${t}`,
    done: "Готово, тепер ви готові творити!",
    close: "Почати писати",
    next: "Далі",
    skip: "Пропустити",
    steps: [
      {
        icon: Sparkles,
        iconColor: "#6366f1",
        iconBg: "rgba(99,102,241,0.12)",
        title: "Ласкаво просимо до Moodra Beta",
        body: "Дякуємо, що приєдналися до бета-тестування. Кожна функція, яку ви бачите, працює в експериментальному режимі — створена з турботою, але ще розвивається. Ваше письмо, відгуки та терпіння допомагають будувати щось справжнє.\n\nЦя платформа створена тому, що існуючі інструменти не справлялись. Moodra — це інструмент, який ми самі хотіли мати. Використовуйте вільно. Якщо щось зламається — напишіть нам.",
        cta: null,
        ctaLabel: null,
      },
      {
        icon: Key,
        iconColor: "#F96D1C",
        iconBg: "rgba(249,109,28,0.12)",
        title: "ШІ працює краще з вашим ключем",
        body: "Moodra включає безплатний ШІ прямо з коробки — без ключа. Але для повного досвіду (GPT-4o mini, швидкі відповіді, без черг) підключіть власний ключ OpenAI API.\n\nЦе займе дві хвилини. Ви платите напряму OpenAI — $5 зазвичай вистачає на кілька місяців.",
        cta: "settings",
        ctaLabel: "Додати ключ у налаштуваннях",
        inputLabel: "Або вставте ключ тут:",
        placeholder: "sk-...",
        learnMore: "Переглянути всі моделі ШІ →",
        learnMorePath: "/models",
        guideLink: "Що таке API ключ?",
        guidePath: "/api-key-guide",
      },
      {
        icon: BookMarked,
        iconColor: "#8B5CF6",
        iconBg: "rgba(139,92,246,0.12)",
        title: "ШІ — інструмент. Ви — автор.",
        body: "Кодекс — ваша постійна творча пам'ять: персонажі, місця, концепції, об'єкти. Все, що ви додаєте, автоматично передається ШІ-співавтору.\n\nПро те, як думає Moodra: кожне речення, яке ШІ набросає — ваше. Ви реагуєте, редагуєте, привласнюєте. ШІ не пише вашу книгу — пишете ви. Він дає чернетку — ви робите з неї текст.",
        cta: "/codex",
        ctaLabel: "Відкрити Кодекс",
      },
      {
        icon: Flame,
        iconColor: "#ef4444",
        iconBg: "rgba(239,68,68,0.10)",
        title: "Сформуйте звичку писати",
        body: "Письмо — це щоденний акт, а не випадковий порив. Трекер звичок допомагає поставити ціль — слів на день або розділів на тиждень — і показує серію днів у календарі.\n\nСталість важливіша за натхнення. Платформа фіксує ваші сесії, щоб ви бачили прогрес, а не лише результат.",
        cta: "/habits",
        ctaLabel: "Відкрити трекер звичок",
      },
    ],
  },
  de: {
    stepOf: (s: number, t: number) => `Schritt ${s} von ${t}`,
    done: "Fertig, jetzt bist du bereit zu erschaffen!",
    close: "Mit Schreiben beginnen",
    next: "Weiter",
    skip: "Überspringen",
    steps: [
      {
        icon: Sparkles,
        iconColor: "#6366f1",
        iconBg: "rgba(99,102,241,0.12)",
        title: "Willkommen bei Moodra Beta",
        body: "Danke, dass du am Beta-Test teilnimmst. Jede Funktion, die du siehst, ist experimentell — mit Sorgfalt entwickelt, aber noch im Wandel. Dein Schreiben, dein Feedback und deine Geduld helfen, etwas Echtes zu gestalten.\n\nDiese Plattform entstand, weil bestehende Tools nicht ausreichten. Moodra ist das Werkzeug, das wir selbst haben wollten. Nutze es frei. Wenn etwas nicht klappt — sag uns Bescheid.",
        cta: null,
        ctaLabel: null,
      },
      {
        icon: Key,
        iconColor: "#F96D1C",
        iconBg: "rgba(249,109,28,0.12)",
        title: "KI funktioniert besser mit deinem Schlüssel",
        body: "Moodra enthält kostenlose KI direkt aus der Box — kein Schlüssel nötig. Für das volle Erlebnis (GPT-4o mini, schnellere Antworten, keine Warteschlange) verbinde deinen eigenen OpenAI-API-Schlüssel.\n\nDas dauert zwei Minuten. Du zahlst direkt an OpenAI — $5 reichen meist für mehrere Monate.",
        cta: "settings",
        ctaLabel: "API-Schlüssel in Einstellungen hinzufügen",
        inputLabel: "Oder Schlüssel hier einfügen:",
        placeholder: "sk-...",
        learnMore: "Alle KI-Modelle ansehen →",
        learnMorePath: "/models",
        guideLink: "Was ist ein API-Schlüssel?",
        guidePath: "/api-key-guide",
      },
      {
        icon: BookMarked,
        iconColor: "#8B5CF6",
        iconBg: "rgba(139,92,246,0.12)",
        title: "KI ist das Werkzeug. Du bist der Autor.",
        body: "Der Kodex ist dein dauerhaftes kreatives Gedächtnis — Charaktere, Orte, Konzepte, Objekte. Alles, was du hinzufügst, wird automatisch mit dem KI-Koautor geteilt.\n\nZur Denkweise von Moodra: Jeder Satz, den die KI entwirft, ist deiner. Du reagierst, überarbeitest, machst ihn zu deinem. KI schreibt dein Buch nicht — du tust es. Sie gibt dir einen Entwurf, du machst Text daraus.",
        cta: "/codex",
        ctaLabel: "Kodex öffnen",
      },
      {
        icon: Flame,
        iconColor: "#ef4444",
        iconBg: "rgba(239,68,68,0.10)",
        title: "Entwickle eine Schreibgewohnheit",
        body: "Schreiben ist ein täglicher Akt, kein gelegentlicher. Der Gewohnheitstracker hilft dir, ein Ziel zu setzen — Wörter pro Tag oder Kapitel pro Woche — und zeigt deinen Streak-Kalender.\n\nBeständigkeit schlägt Inspiration. Die Plattform verfolgt deine Sessions, damit du deinen Fortschritt siehst — nicht nur das Ergebnis.",
        cta: "/habits",
        ctaLabel: "Schreibgewohnheiten öffnen",
      },
    ],
  },
};

export function OnboardingModal({ lang, userId, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [, navigate] = useLocation();
  const c = COPY[lang] || COPY.en;
  const TOTAL = c.steps.length;
  const stepData = c.steps[step];
  const Icon = stepData.icon;

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/me/api-key", { apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      goNext();
    },
  });

  const markDone = () => {
    localStorage.setItem(`moodra_onboarding_v1_${userId}`, "done");
    setDone(true);
  };

  const goNext = () => {
    if (step < TOTAL - 1) setStep(s => s + 1);
    else markDone();
  };

  const handleCta = () => {
    if (!stepData.cta) { goNext(); return; }
    if (stepData.cta === "settings") {
      if (apiKey.trim().startsWith("sk-")) {
        saveMutation.mutate();
      } else {
        navigate("/settings");
        localStorage.setItem(`moodra_onboarding_v1_${userId}`, "done");
        onClose();
      }
    } else {
      navigate(stepData.cta);
      localStorage.setItem(`moodra_onboarding_v1_${userId}`, "done");
      onClose();
    }
  };

  const isApiStep = step === 1;

  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-10 text-center flex flex-col items-center gap-5"
          style={{ background: "hsl(30,58%,97%)", boxShadow: "0 32px 96px rgba(0,0,0,0.22)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
            <Check className="w-8 h-8" style={{ color: "#10B981" }} strokeWidth={2.5} />
          </div>
          <p className="text-xl font-bold leading-snug" style={{ color: "#1a1a1a" }}>{c.done}</p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F96D1C, #FF9640)" }}
          >
            {c.close}
          </button>
        </div>
      </div>
    );
  }

  const progress = ((step) / TOTAL) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl relative overflow-hidden"
        style={{ background: "hsl(30,58%,97%)", boxShadow: "0 32px 96px rgba(0,0,0,0.22)" }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #F96D1C, #FF9640)" }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#b0a090" }}>
              {c.stepOf(step + 1, TOTAL)}
            </span>
            <button
              onClick={() => { markDone(); onClose(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
              style={{ background: "rgba(0,0,0,0.07)" }}
            >
              <X className="w-3 h-3" style={{ color: "#5a4a40" }} />
            </button>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {c.steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i <= step ? "#F96D1C" : "rgba(0,0,0,0.1)",
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: stepData.iconBg }}>
            <Icon className="w-5 h-5" style={{ color: stepData.iconColor }} strokeWidth={1.8} />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold mb-3 leading-snug" style={{ color: "#1a1a1a" }}>
            {stepData.title}
          </h2>

          {/* Body */}
          <div className="text-sm leading-relaxed mb-6 space-y-3" style={{ color: "#6a5a50" }}>
            {stepData.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* API key input for step 2 */}
          {isApiStep && (c.steps[1] as any).inputLabel && (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-medium" style={{ color: "#8a7a70" }}>{(c.steps[1] as any).inputLabel}</p>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={(c.steps[1] as any).placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(249,109,28,0.07)",
                  border: "1.5px solid rgba(249,109,28,0.15)",
                  color: "#1a1a1a",
                  fontFamily: "monospace",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(249,109,28,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(249,109,28,0.15)")}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                >
                  <ArrowLeft className="w-4 h-4" style={{ color: "#5a4a40" }} />
                </button>
              )}
              <button
                onClick={handleCta}
                disabled={saveMutation.isPending}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {stepData.ctaLabel || c.next}
                    {step < TOTAL - 1 ? <ArrowRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {isApiStep && (c.steps[1] as any).learnMore && (
                <button
                  onClick={() => { navigate((c.steps[1] as any).learnMorePath); localStorage.setItem(`moodra_onboarding_v1_${userId}`, "done"); onClose(); }}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: "#8a7a70" }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {(c.steps[1] as any).learnMore}
                </button>
              )}
              {isApiStep && (c.steps[1] as any).guideLink && (
                <button
                  onClick={() => { navigate((c.steps[1] as any).guidePath); localStorage.setItem(`moodra_onboarding_v1_${userId}`, "done"); onClose(); }}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: "#b0a090" }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {(c.steps[1] as any).guideLink}
                </button>
              )}
              {step > 0 && (
                <button
                  onClick={goNext}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "#b0a090" }}
                >
                  {c.skip}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
