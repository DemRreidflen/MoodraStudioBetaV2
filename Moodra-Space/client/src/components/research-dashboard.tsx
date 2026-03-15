import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useLang } from "@/contexts/language-context";
import type { Book, Draft, Chapter } from "@shared/schema";
import type { AuthorRoleModel } from "@shared/schema";
import {
  Search, Sparkles, BookOpen, FileEdit, Brain, Plus, ArrowRight,
  Loader2, ArrowDownToLine, CheckCircle2, Globe, FileText, BookMarked,
  Quote, Microscope, ExternalLink, ChevronDown, ChevronUp, X, Zap,
  Feather, Layers, Music2, Hash, Target, Heart, Wrench, AlignLeft, Eye,
  Save, ArrowLeft, Clock, AlignCenter, BarChart3, Lightbulb, RefreshCw,
  Check, Trash2, Link2, BookCopy, SendToBack, GitBranch, Wand2,
  Minus, ChevronsLeftRight, Timer, Keyboard,
} from "lucide-react";
import { BlockEditor, Block, blocksToPlainText } from "@/components/block-editor";
import { RoleModelsTab } from "@/components/role-models-tab";
import { AiPanel } from "@/components/ai-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const ROLE_MODEL_ANALYSIS_SECTIONS = [
  { key: "conceptualTendencies",  label: "Conceptual Tendencies",  icon: Brain,       color: "#8B5CF6" },
  { key: "stylePatterns",         label: "Style Patterns",         icon: Feather,     color: "#6366F1" },
  { key: "structurePatterns",     label: "Structure Patterns",     icon: Layers,      color: "#3B82F6" },
  { key: "rhythmObservations",    label: "Rhythm & Pacing",        icon: Music2,      color: "#0D9488" },
  { key: "vocabularyTendencies",  label: "Vocabulary Tendencies",  icon: Hash,        color: "#10B981" },
  { key: "argumentBehavior",      label: "Argument Behavior",      icon: Target,      color: "#F59E0B" },
  { key: "emotionalDynamics",     label: "Emotional Dynamics",     icon: Heart,       color: "#EC4899" },
  { key: "technicalDevices",      label: "Technical Devices",      icon: Wrench,      color: "#64748B" },
  { key: "pacing",                label: "Pacing",                 icon: AlignCenter, color: "#F96D1C" },
  { key: "perspectiveVoice",      label: "Perspective & Voice",    icon: Eye,         color: "#0EA5E9" },
  { key: "thematicPatterns",      label: "Thematic Patterns",      icon: AlignLeft,   color: "#84CC16" },
] as const;

// ─── i18n ─────────────────────────────────────────────────────────────────────
const RESEARCH_I18N = {
  ru: {
    analysisDone: "Анализ завершён", newRoleModel: "Новая ролевая модель",
    authorNameLabel: "Имя автора *", authorNamePlaceholder: "Например: Умберто Эко, Стивен Пинкер…",
    sourceLabel: "Источник (книга / статья)", sourcePlaceholder: "Название произведения для анализа…",
    fileLabel: "Файл для анализа (EPUB / FB2 / TXT)", fileRemove: "Убрать",
    fileDrop: "Перетащите файл или нажмите для выбора", fileFormats: "EPUB, FB2, TXT — до 30 MB",
    fileError: "Поддерживаются: EPUB, FB2, TXT", extractError: "Не удалось извлечь текст из файла",
    customInstrLabel: "Особые указания для анализа",
    customInstrPlaceholder: "Например: сосредоточься на структуре аргументации, игнорируй стилистику…",
    extractingText: "Извлекаю текст из файла…", analyzingText: "Глубокий анализ стиля…",
    analyzingDims: (a: string) => `ИИ изучает ${a} по 11 измерениям`,
    modelCreated: "Ролевая модель создана", modelCreatedDesc: (a: string) => `Анализ ${a} доступен в разделе Ролевые модели`,
    styleLabel: "Стиль", conceptLabel: "Концептуальные тенденции",
    cancelBtn: "Отмена", closeBtn: "Закрыть", analyzeBtn: "Анализировать",
    roleModelsTitle: "Ролевые Модели", roleModelsDesc: "Изучите стиль авторов-ориентиров — нажмите на карточку для полного анализа",
    addBtn: "Добавить", addRoleModel: "Добавить ролевую модель", noRoleModels: "Добавьте автора-ориентира для анализа стиля",
    notAnalyzed: "Не проанализирован", isAnalyzed: "Проанализирован", openCard: "Открыть →",
    analyzeShort: "Анализ", analyzeDone: "Анализ завершён", analyzeError: "Ошибка анализа", aiError: "Ошибка AI",
    notAnalyzedDesc: "Анализ ещё не проведён. Запустите глубокий анализ чтобы получить полный стилистический профиль.",
    runAnalysis: "Запустить анализ", stylePrompt: "ИИ-промпт стиля", sourceText: "Исходный текст",
    draftsTitle: "Черновики", draftsDesc: "Пишите черновики свободно — без вёрстки. Готовый текст переносится в книгу одной кнопкой",
    newDraft: "Новый", createDraft: "Создать черновик", noDrafts: "Создайте первый черновик для свободного письма",
    draftDeleted: "Черновик удалён",
    draftsBack: "Черновики", titlePlaceholder: "Название черновика…",
    words: (n: number) => `${n} сл.`, wordsTotal: (n: number) => `${n} слов`,
    lessThanMin: "< 1 мин", minLabel: "мин", reading: "чтения",
    newDraftTitle: "Новый черновик",
    noChapter: "Без главы", saveBtn: "Сохранить", toBookBtn: "В книгу",
    aiTipBtn: "Совет ИИ", aiPanelBtn: "ИИ",
    moveToBook: "Перенести в книгу", moveDesc: "Текст черновика станет частью основного редактора",
    newChapterOpt: "Создать новую главу", newChapterDesc: "Черновик станет новой главой в редакторе",
    appendOpt: "Добавить в существующую главу", appendDesc: "Текст добавляется в конец выбранной главы",
    selectChapter: "Выберите главу…", moveBtn: "Перенести", movingBtn: "Переносим…",
    moveSuccessNew: "Создана новая глава в редакторе", moveSuccessAppend: "Текст добавлен в главу", moveError: "Ошибка переноса",
    linkChapter: "Привязать главу",
    moreDrafts: (n: number) => `Ещё ${n} черновиков…`,
  },
  en: {
    analysisDone: "Analysis complete", newRoleModel: "New Role Model",
    authorNameLabel: "Author name *", authorNamePlaceholder: "e.g. Umberto Eco, Steven Pinker…",
    sourceLabel: "Source (book / article)", sourcePlaceholder: "Title of the work to analyze…",
    fileLabel: "File to analyze (EPUB / FB2 / TXT)", fileRemove: "Remove",
    fileDrop: "Drop a file here or click to choose", fileFormats: "EPUB, FB2, TXT — up to 30 MB",
    fileError: "Supported: EPUB, FB2, TXT", extractError: "Failed to extract text from file",
    customInstrLabel: "Custom analysis instructions",
    customInstrPlaceholder: "e.g. focus on argumentation structure, ignore stylistics…",
    extractingText: "Extracting text from file…", analyzingText: "Deep style analysis…",
    analyzingDims: (a: string) => `AI is studying ${a} across 11 dimensions`,
    modelCreated: "Role model created", modelCreatedDesc: (a: string) => `Analysis of ${a} is available in Role Models`,
    styleLabel: "Style", conceptLabel: "Conceptual Tendencies",
    cancelBtn: "Cancel", closeBtn: "Close", analyzeBtn: "Analyze",
    roleModelsTitle: "Role Models", roleModelsDesc: "Study the style of reference authors — click a card for full analysis",
    addBtn: "Add", addRoleModel: "Add role model", noRoleModels: "Add a reference author for style analysis",
    notAnalyzed: "Not analyzed", isAnalyzed: "Analyzed", openCard: "Open →",
    analyzeShort: "Analyze", analyzeDone: "Analysis complete", analyzeError: "Analysis error", aiError: "AI error",
    notAnalyzedDesc: "Analysis not yet performed. Run deep analysis to get a full stylistic profile.",
    runAnalysis: "Run analysis", stylePrompt: "AI style prompt", sourceText: "Source text",
    draftsTitle: "Drafts", draftsDesc: "Write drafts freely — without layout. Move finished text to the book in one click",
    newDraft: "New", createDraft: "Create draft", noDrafts: "Create your first draft for free writing",
    draftDeleted: "Draft deleted",
    draftsBack: "Drafts", titlePlaceholder: "Draft title…",
    words: (n: number) => `${n} w.`, wordsTotal: (n: number) => `${n} words`,
    lessThanMin: "< 1 min", minLabel: "min", reading: "read",
    newDraftTitle: "New draft",
    noChapter: "No chapter", saveBtn: "Save", toBookBtn: "To book",
    aiTipBtn: "AI tip", aiPanelBtn: "AI",
    moveToBook: "Move to book", moveDesc: "The draft text will become part of the main editor",
    newChapterOpt: "Create new chapter", newChapterDesc: "Draft will become a new chapter in the editor",
    appendOpt: "Append to existing chapter", appendDesc: "Text is added to the end of the selected chapter",
    selectChapter: "Select chapter…", moveBtn: "Move", movingBtn: "Moving…",
    moveSuccessNew: "New chapter created in editor", moveSuccessAppend: "Text added to chapter", moveError: "Move error",
    linkChapter: "Link chapter",
    moreDrafts: (n: number) => `${n} more drafts…`,
  },
  ua: {
    analysisDone: "Аналіз завершено", newRoleModel: "Нова рольова модель",
    authorNameLabel: "Ім'я автора *", authorNamePlaceholder: "Наприклад: Умберто Еко, Стівен Пінкер…",
    sourceLabel: "Джерело (книга / стаття)", sourcePlaceholder: "Назва твору для аналізу…",
    fileLabel: "Файл для аналізу (EPUB / FB2 / TXT)", fileRemove: "Прибрати",
    fileDrop: "Перетягніть файл або натисніть для вибору", fileFormats: "EPUB, FB2, TXT — до 30 МБ",
    fileError: "Підтримуються: EPUB, FB2, TXT", extractError: "Не вдалося витягти текст з файлу",
    customInstrLabel: "Особливі вказівки для аналізу",
    customInstrPlaceholder: "Наприклад: зосередься на структурі аргументації…",
    extractingText: "Витягую текст з файлу…", analyzingText: "Глибокий аналіз стилю…",
    analyzingDims: (a: string) => `ШІ вивчає ${a} за 11 вимірами`,
    modelCreated: "Рольова модель створена", modelCreatedDesc: (a: string) => `Аналіз ${a} доступний у розділі Рольові моделі`,
    styleLabel: "Стиль", conceptLabel: "Концептуальні тенденції",
    cancelBtn: "Скасувати", closeBtn: "Закрити", analyzeBtn: "Аналізувати",
    roleModelsTitle: "Рольові Моделі", roleModelsDesc: "Вивчіть стиль авторів-орієнтирів — натисніть на картку для повного аналізу",
    addBtn: "Додати", addRoleModel: "Додати рольову модель", noRoleModels: "Додайте автора-орієнтир для аналізу стилю",
    notAnalyzed: "Не проаналізований", isAnalyzed: "Проаналізований", openCard: "Відкрити →",
    analyzeShort: "Аналіз", analyzeDone: "Аналіз завершено", analyzeError: "Помилка аналізу", aiError: "Помилка ШІ",
    notAnalyzedDesc: "Аналіз ще не проведений. Запустіть глибокий аналіз для повного стилістичного профілю.",
    runAnalysis: "Запустити аналіз", stylePrompt: "ШІ-промпт стилю", sourceText: "Вихідний текст",
    draftsTitle: "Чернетки", draftsDesc: "Пишіть чернетки вільно — без верстки. Готовий текст переноситься в книгу одним натисканням",
    newDraft: "Нова", createDraft: "Створити чернетку", noDrafts: "Створіть першу чернетку для вільного письма",
    draftDeleted: "Чернетку видалено",
    draftsBack: "Чернетки", titlePlaceholder: "Назва чернетки…",
    words: (n: number) => `${n} сл.`, wordsTotal: (n: number) => `${n} слів`,
    lessThanMin: "< 1 хв", minLabel: "хв", reading: "читання",
    newDraftTitle: "Нова чернетка",
    noChapter: "Без розділу", saveBtn: "Зберегти", toBookBtn: "До книги",
    aiTipBtn: "Порада ШІ", aiPanelBtn: "ШІ",
    moveToBook: "Перенести в книгу", moveDesc: "Текст чернетки стане частиною основного редактора",
    newChapterOpt: "Створити новий розділ", newChapterDesc: "Чернетка стане новим розділом у редакторі",
    appendOpt: "Додати до існуючого розділу", appendDesc: "Текст додається в кінець обраного розділу",
    selectChapter: "Оберіть розділ…", moveBtn: "Перенести", movingBtn: "Переносимо…",
    moveSuccessNew: "Новий розділ створено в редакторі", moveSuccessAppend: "Текст додано до розділу", moveError: "Помилка переносу",
    linkChapter: "Прив'язати розділ",
    moreDrafts: (n: number) => `Ще ${n} чернеток…`,
  },
  de: {
    analysisDone: "Analyse abgeschlossen", newRoleModel: "Neues Rollenmodell",
    authorNameLabel: "Autorenname *", authorNamePlaceholder: "z.B. Umberto Eco, Steven Pinker…",
    sourceLabel: "Quelle (Buch / Artikel)", sourcePlaceholder: "Titel des zu analysierenden Werks…",
    fileLabel: "Datei zur Analyse (EPUB / FB2 / TXT)", fileRemove: "Entfernen",
    fileDrop: "Datei hierher ziehen oder klicken", fileFormats: "EPUB, FB2, TXT — bis 30 MB",
    fileError: "Unterstützt: EPUB, FB2, TXT", extractError: "Text konnte nicht extrahiert werden",
    customInstrLabel: "Besondere Analyseanweisungen",
    customInstrPlaceholder: "z.B. Fokus auf Argumentationsstruktur…",
    extractingText: "Text wird extrahiert…", analyzingText: "Tiefenanalyse des Stils…",
    analyzingDims: (a: string) => `KI analysiert ${a} in 11 Dimensionen`,
    modelCreated: "Rollenmodell erstellt", modelCreatedDesc: (a: string) => `Analyse von ${a} in Rollenmodelle verfügbar`,
    styleLabel: "Stil", conceptLabel: "Konzeptionelle Tendenzen",
    cancelBtn: "Abbrechen", closeBtn: "Schließen", analyzeBtn: "Analysieren",
    roleModelsTitle: "Rollenmodelle", roleModelsDesc: "Untersuchen Sie den Stil von Referenzautoren — klicken für vollständige Analyse",
    addBtn: "Hinzufügen", addRoleModel: "Rollenmodell hinzufügen", noRoleModels: "Referenzautor für Stilanalyse hinzufügen",
    notAnalyzed: "Nicht analysiert", isAnalyzed: "Analysiert", openCard: "Öffnen →",
    analyzeShort: "Analyse", analyzeDone: "Analyse abgeschlossen", analyzeError: "Analysefehler", aiError: "KI-Fehler",
    notAnalyzedDesc: "Analyse noch nicht durchgeführt. Tiefenanalyse starten für vollständiges Stilprofil.",
    runAnalysis: "Analyse starten", stylePrompt: "KI-Stilprompt", sourceText: "Quelltext",
    draftsTitle: "Entwürfe", draftsDesc: "Schreiben Sie Entwürfe frei — ohne Layout. Per Klick in das Buch übertragen",
    newDraft: "Neu", createDraft: "Entwurf erstellen", noDrafts: "Ersten Entwurf zum freien Schreiben erstellen",
    draftDeleted: "Entwurf gelöscht",
    draftsBack: "Entwürfe", titlePlaceholder: "Entwurfstitel…",
    words: (n: number) => `${n} W.`, wordsTotal: (n: number) => `${n} Wörter`,
    lessThanMin: "< 1 Min", minLabel: "Min", reading: "Lesen",
    newDraftTitle: "Neuer Entwurf",
    noChapter: "Kein Kapitel", saveBtn: "Speichern", toBookBtn: "Ins Buch",
    aiTipBtn: "KI-Tipp", aiPanelBtn: "KI",
    moveToBook: "In Buch übertragen", moveDesc: "Der Entwurfstext wird Teil des Haupteditors",
    newChapterOpt: "Neues Kapitel erstellen", newChapterDesc: "Entwurf wird ein neues Kapitel im Editor",
    appendOpt: "An bestehendes Kapitel anhängen", appendDesc: "Text am Ende des Kapitels eingefügt",
    selectChapter: "Kapitel auswählen…", moveBtn: "Übertragen", movingBtn: "Übertrage…",
    moveSuccessNew: "Neues Kapitel im Editor erstellt", moveSuccessAppend: "Text zum Kapitel hinzugefügt", moveError: "Übertragungsfehler",
    linkChapter: "Kapitel verknüpfen",
    moreDrafts: (n: number) => `${n} weitere Entwürfe…`,
  },
} as const;
type ResearchT = typeof RESEARCH_I18N.ru;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, color, title, description, action, actionLabel, actionIcon: ActionIcon,
}: {
  icon: any; color: string; title: string; description: string;
  action?: () => void; actionLabel?: string; actionIcon?: any;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action && (
        <button onClick={action}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: `${color}12`, color }}>
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Role Model Creation Dialog ───────────────────────────────────────────────

const AVATAR_COLORS = ["#8B5CF6","#6366F1","#0EA5E9","#10B981","#F59E0B","#EC4899","#F96D1C","#64748B"];

function CreateRoleModelDialog({ open, onClose, bookId, book }: {
  open: boolean; onClose: () => void; bookId: number; book: Book;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;

  const [step, setStep] = useState<"form"|"analyzing"|"done">("form");
  const [authorName, setAuthorName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setStep("form"); setAuthorName(""); setSourceName(""); setCustomInstruction(""); setFile(null); setFileError(""); setAnalysis(null); }
  }, [open]);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!["epub","fb2","txt","md"].includes(ext)) { setFileError(t.fileError); return; }
    setFile(f); setFileError("");
  };

  const extractText = async (f: File): Promise<string> => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (ext === "txt" || ext === "md") return f.text();
    if (ext === "fb2") {
      const raw = await f.text();
      return raw.replace(/<binary[^>]*>[\s\S]*?<\/binary>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s{2,}/g," ").trim();
    }
    // For EPUB, use server extraction
    const fd = new FormData(); fd.append("file", f);
    const resp = await fetch("/api/extract-file-text", { method: "POST", body: fd });
    if (!resp.ok) throw new Error(t.extractError);
    const data = await resp.json();
    return data.text || "";
  };

  const handleSubmit = async () => {
    if (!authorName.trim()) return;
    setStep("analyzing"); setFileError("");
    try {
      let rawSourceText = "";
      if (file) {
        setExtracting(true);
        try { rawSourceText = await extractText(file); } catch (e: any) { setFileError(e.message); setStep("form"); setExtracting(false); return; }
        setExtracting(false);
      }

      // Create role model record
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const model: any = await apiRequest("POST", `/api/books/${bookId}/role-models`, {
        name: authorName.trim(),
        authorName: authorName.trim(),
        sourceTitle: sourceName.trim() || undefined,
        avatarColor,
      });

      // Deep analyze
      const result: any = await apiRequest("POST", `/api/role-models/${model.id}/deep-analyze`, {
        rawSourceText: rawSourceText || `Стиль автора: ${authorName}`,
        lang,
        bookTitle: book.title,
        bookMode: book.mode,
        customInstruction: customInstruction.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setAnalysis(result);
      setStep("done");
    } catch (e: any) {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setStep("form");
      onClose();
      toast({
        title: lang === "ru" ? "Модель думает и ищет паттерны…" : lang === "ua" ? "Модель думає і шукає патерни…" : lang === "de" ? "Modell analysiert im Hintergrund…" : "Model is thinking and finding patterns…",
        description: lang === "ru" ? "Рекомендуем перезагрузить страницу через минуту, чтобы увидеть результат." : lang === "ua" ? "Радимо перезавантажити сторінку за хвилину, щоб побачити результат." : lang === "de" ? "Laden Sie die Seite in einer Minute neu, um die Ergebnisse zu sehen." : "We recommend reloading the page in a minute to see the results.",
        duration: 8000,
      });
    }
  };

  if (!open) return null;
  const color = "#8B5CF6";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-background"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Brain className="h-4 w-4" style={{ color }} />
            </div>
            <span className="font-bold text-sm">
              {step === "done" ? t.analysisDone : t.newRoleModel}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "form" && (
            <>
              {/* Author name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.authorNameLabel}</label>
                <input
                  value={authorName} onChange={e => setAuthorName(e.target.value)} autoFocus
                  placeholder={t.authorNamePlaceholder}
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>

              {/* Source title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.sourceLabel}</label>
                <input
                  value={sourceName} onChange={e => setSourceName(e.target.value)}
                  placeholder={t.sourcePlaceholder}
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>

              {/* File upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fileLabel}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onDragOver={e => e.preventDefault()}
                  className="w-full rounded-xl border-2 border-dashed border-border/50 hover:border-violet-400/50 transition-colors p-5 flex flex-col items-center gap-2 cursor-pointer text-center"
                >
                  {file ? (
                    <>
                      <FileText className="h-8 w-8" style={{ color }} />
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline">{t.fileRemove}</button>
                    </>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">{t.fileDrop}</p>
                      <p className="text-[11px] text-muted-foreground/50">{t.fileFormats}</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".epub,.fb2,.txt,.md" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
              </div>

              {/* Custom instruction */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.customInstrLabel}</label>
                <textarea
                  value={customInstruction} onChange={e => setCustomInstruction(e.target.value)}
                  rows={3}
                  placeholder={t.customInstrPlaceholder}
                  className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm resize-none outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 transition-all"
                />
              </div>
            </>
          )}

          {step === "analyzing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${color}12` }}>
                <Brain className="h-8 w-8 animate-pulse" style={{ color }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{extracting ? t.extractingText : t.analyzingText}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.analyzingDims(authorName)}</p>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: color, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {step === "done" && analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200/40">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t.modelCreated}</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/60 mt-0.5">{t.modelCreatedDesc(authorName)}</p>
                </div>
              </div>
              {analysis.stylePatterns && (
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.styleLabel}</p>
                  <p className="text-sm leading-relaxed">{analysis.stylePatterns}</p>
                </div>
              )}
              {analysis.conceptualTendencies && (
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.conceptLabel}</p>
                  <p className="text-sm leading-relaxed">{analysis.conceptualTendencies}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "analyzing" && (
          <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border/50 flex-shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-muted-foreground hover:bg-secondary transition-colors">
              {step === "done" ? t.closeBtn : t.cancelBtn}
            </button>
            {step === "form" && (
              <button
                onClick={handleSubmit}
                disabled={!authorName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${color}, #6366F1)` }}>
                <Wand2 className="h-4 w-4" /> {t.analyzeBtn}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Role Models Section ─────────────────────────────────────────────────────

function RoleModelsSection({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;
  const [selectedModel, setSelectedModel] = useState<AuthorRoleModel | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("stylePatterns");
  const [showCreate, setShowCreate] = useState(false);

  const { data: models = [] } = useQuery<AuthorRoleModel[]>({
    queryKey: ["/api/books", bookId, "role-models"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/role-models`),
  });

  const useInBookMutation = useMutation({
    mutationFn: (model: AuthorRoleModel) =>
      apiRequest("PATCH", `/api/books/${bookId}`, {
        narrativeContext: {
          ...(book.narrativeContext || {}),
          writingStyleNotes: model.styleInstruction || model.stylePatterns || "",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId] });
      toast({ title: lang === "ru" ? "Стиль добавлен в контекст книги" : lang === "ua" ? "Стиль додано до контексту книги" : "Style added to book context" });
      setSelectedModel(null);
    },
  });

  const deepAnalyzeMutation = useMutation({
    mutationFn: ({ id, rawSourceText }: { id: number; rawSourceText?: string }) =>
      apiRequest("POST", `/api/role-models/${id}/deep-analyze`, {
        lang, bookTitle: book.title, bookMode: book.mode,
        rawSourceText: rawSourceText || `Analyze the writing style of this author for the book "${book.title}". Infer stylistic patterns based on the author name and context.`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      setAnalyzing(null);
      toast({ title: t.analyzeDone });
    },
    onError: (_e: any) => {
      setAnalyzing(null);
      setSelectedModel(null);
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "role-models"] });
      toast({
        title: lang === "ru" ? "Модель думает и ищет паттерны…" : lang === "ua" ? "Модель думає і шукає патерни…" : lang === "de" ? "Modell analysiert im Hintergrund…" : "Model is thinking and finding patterns…",
        description: lang === "ru" ? "Рекомендуем перезагрузить страницу через минуту, чтобы увидеть результат." : lang === "ua" ? "Радимо перезавантажити сторінку за хвилину, щоб побачити результат." : lang === "de" ? "Laden Sie die Seite in einer Minute neu, um die Ergebnisse zu sehen." : "We recommend reloading the page in a minute to see the results.",
        duration: 8000,
      });
    },
  });

  const analyzed = models.filter(m => m.analysisStatus === "analyzed");
  const notAnalyzed = models.filter(m => m.analysisStatus !== "analyzed");

  return (
    <>
      <CreateRoleModelDialog open={showCreate} onClose={() => setShowCreate(false)} bookId={bookId} book={book} />
      <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
        <SectionHeader
          icon={Brain} color="#8B5CF6"
          title={t.roleModelsTitle}
          description={t.roleModelsDesc}
          action={() => setShowCreate(true)}
          actionLabel={t.addBtn}
          actionIcon={Plus}
        />

        {models.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Brain className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <p className="text-sm text-muted-foreground">{t.noRoleModels}</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
              <Plus className="h-4 w-4" /> {t.addRoleModel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {models.map(model => {
              const isAnalyzed = model.analysisStatus === "analyzed";
              const color = model.avatarColor || "#8B5CF6";
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="text-left p-4 rounded-xl border border-border/50 hover:border-violet-300/50 hover:shadow-md transition-all group"
                  style={{ background: `${color}06` }}
                >
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
                      {getInitials(model.name || model.authorName || "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate leading-tight">{model.name}</p>
                      {model.authorName && <p className="text-xs text-muted-foreground truncate">{model.authorName}</p>}
                    </div>
                  </div>
                  {/* Status */}
                  {isAnalyzed ? (
                    <div className="space-y-2">
                      {model.stylePatterns && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {model.stylePatterns.slice(0, 100)}…
                        </p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 flex-1 rounded-full overflow-hidden bg-muted/40">
                          <div className="h-full rounded-full transition-all" style={{ width: `${model.influencePercent || 0}%`, background: color }} />
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color }}>{model.influencePercent || 0}%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">{t.isAnalyzed}</span>
                        <span className="ml-auto text-[10px] text-violet-500 group-hover:underline">{t.openCard}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t.notAnalyzed}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setAnalyzing(model.id); deepAnalyzeMutation.mutate({ id: model.id, rawSourceText: model.rawSourceText || undefined }); }}
                        disabled={analyzing === model.id || deepAnalyzeMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{ background: `${color}15`, color }}>
                        {analyzing === model.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Wand2 className="h-3 w-3" />}
                        {t.analyzeShort}
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
            {/* Add more tile */}
            <button
              onClick={() => setShowCreate(true)}
              className="p-4 rounded-xl border-2 border-dashed border-border/40 hover:border-violet-300/50 hover:bg-violet-50/20 dark:hover:bg-violet-950/10 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-violet-400"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-medium">{t.addBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Model Popup */}
      <Dialog open={!!selectedModel} onOpenChange={open => !open && setSelectedModel(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          {selectedModel && (
            <>
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${selectedModel.avatarColor || "#8B5CF6"}, ${selectedModel.avatarColor || "#8B5CF6"}99)` }}>
                  {getInitials(selectedModel.name || selectedModel.authorName || "?")}
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{selectedModel.name}</h2>
                  {selectedModel.authorName && (
                    <p className="text-sm text-muted-foreground">{selectedModel.authorName}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selectedModel.analysisStatus === "analyzed" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200/40">
                      <CheckCircle2 className="h-3 w-3" />{t.isAnalyzed}
                    </div>
                  )}
                  <button onClick={() => setSelectedModel(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* If not analyzed */}
                {selectedModel.analysisStatus !== "analyzed" && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground mb-3">{t.notAnalyzedDesc}</p>
                    <button
                      onClick={() => { setAnalyzing(selectedModel.id); deepAnalyzeMutation.mutate({ id: selectedModel.id, rawSourceText: selectedModel.rawSourceText || undefined }); }}
                      disabled={analyzing === selectedModel.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mx-auto"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                      {analyzing === selectedModel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {t.runAnalysis}
                    </button>
                  </div>
                )}

                {/* Style instruction */}
                {selectedModel.styleInstruction && (
                  <div className="p-4 rounded-xl border border-violet-200/40 bg-violet-50/30 dark:bg-violet-950/15">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-violet-500" />
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{t.stylePrompt}</p>
                    </div>
                    <p className="text-sm italic text-violet-700/80 dark:text-violet-300/70 leading-relaxed whitespace-pre-wrap">
                      "{selectedModel.styleInstruction}"
                    </p>
                  </div>
                )}

                {/* Analysis sections */}
                {ROLE_MODEL_ANALYSIS_SECTIONS.map(sec => {
                  const value = (selectedModel as any)[sec.key] as string | undefined;
                  if (!value) return null;
                  const SIcon = sec.icon;
                  const isOpen = openSection === sec.key;
                  return (
                    <div key={sec.key} className="rounded-xl border border-border/50 overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setOpenSection(isOpen ? null : sec.key)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sec.color}12` }}>
                          <SIcon className="h-3.5 w-3.5" style={{ color: sec.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{sec.label}</p>
                          {!isOpen && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{value.slice(0, 80)}</p>}
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-border/30">
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mt-3">{value}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Use in book */}
                {selectedModel.analysisStatus === "analyzed" && (selectedModel.styleInstruction || selectedModel.stylePatterns) && (
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground flex-1">{lang === "ru" ? "Применить стиль этого автора к вашей книге как ориентир для ИИ." : lang === "ua" ? "Застосувати стиль цього автора до вашої книги як орієнтир для ІІ." : "Apply this author's style to your book as an AI reference."}</p>
                    <button
                      onClick={() => useInBookMutation.mutate(selectedModel)}
                      disabled={useInBookMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}
                    >
                      {useInBookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookCopy className="h-4 w-4" />}
                      {lang === "ru" ? "Использовать в книге" : lang === "ua" ? "Використати в книзі" : "Use in book"}
                    </button>
                  </div>
                )}

                {/* Raw source */}
                {selectedModel.rawSourceText && (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => setOpenSection(openSection === "__raw" ? null : "__raw")}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/40">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold flex-1">{t.sourceText}</p>
                      {openSection === "__raw" ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
                    </button>
                    {openSection === "__raw" && (
                      <div className="px-4 pb-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap mt-3 font-mono">{selectedModel.rawSourceText.slice(0, 2000)}{selectedModel.rawSourceText.length > 2000 ? "…" : ""}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Draft Card ──────────────────────────────────────────────────────────────

function DraftCard({ draft, chapters, onClick, onDelete }: {
  draft: Draft; chapters: Chapter[];
  onClick: () => void; onDelete: () => void;
}) {
  const linkedChapter = chapters.find(c => c.id === draft.linkedChapterId);
  const preview = draft.content
    ? (() => {
        try {
          const parsed = JSON.parse(draft.content);
          if (Array.isArray(parsed)) return parsed.map((b: any) => b.content).filter(Boolean).join(" ").slice(0, 120);
        } catch {}
        return draft.content.slice(0, 120);
      })()
    : "";

  return (
    <div
      className="group p-4 rounded-xl border border-border/50 bg-background hover:border-violet-300/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileEdit className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          <p className="font-semibold text-sm truncate">{draft.title}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{preview}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        {linkedChapter && (
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{linkedChapter.title}</span>
          </div>
        )}
        {(draft.wordCount || 0) > 0 && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{draft.wordCount} сл.</span>
          </div>
        )}
        <span className="ml-auto">{draft.updatedAt ? format(new Date(draft.updatedAt), "d MMM") : ""}</span>
      </div>
    </div>
  );
}

// ─── Drafts Section ──────────────────────────────────────────────────────────

function DraftsSection({ bookId, book, onOpenDraft }: {
  bookId: number; book: Book;
  onOpenDraft: (draft: Draft | null) => void;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;

  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ["/api/books", bookId, "drafts"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/drafts`),
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/drafts`, data),
    onSuccess: (d: Draft) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      onOpenDraft(d);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/drafts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      toast({ title: t.draftDeleted });
    },
  });

  const activeDrafts = drafts.filter(d => d.status !== "archived");

  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-6 shadow-sm">
      <SectionHeader
        icon={FileEdit} color="#F96D1C"
        title={t.draftsTitle}
        description={t.draftsDesc}
        action={() => createMutation.mutate({ title: t.newDraftTitle, content: "" })}
        actionLabel={t.newDraft}
        actionIcon={Plus}
      />

      {activeDrafts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.1)" }}>
            <FileEdit className="h-6 w-6" style={{ color: "#F96D1C" }} />
          </div>
          <p className="text-sm text-muted-foreground">{t.noDrafts}</p>
          <button
            onClick={() => createMutation.mutate({ title: t.newDraftTitle, content: "" })}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
            <Plus className="h-4 w-4" /> {t.createDraft}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDrafts.slice(0, 5).map(d => (
            <DraftCard
              key={d.id}
              draft={d}
              chapters={chapters}
              onClick={() => onOpenDraft(d)}
              onDelete={() => deleteMutation.mutate(d.id)}
            />
          ))}
          {activeDrafts.length > 5 && (
            <button className="w-full py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border transition-colors">
              {t.moreDrafts(activeDrafts.length - 5)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Draft Editor ────────────────────────────────────────────────────────────

function DraftEditor({ draft, bookId, book, chapters, onBack }: {
  draft: Draft; bookId: number; book: Book; chapters: Chapter[]; onBack: () => void;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const t = (RESEARCH_I18N[lang as keyof typeof RESEARCH_I18N] ?? RESEARCH_I18N.ru) as ResearchT;
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [title, setTitle] = useState(draft.title);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [linkedChapterId, setLinkedChapterId] = useState<number | null>(draft.linkedChapterId ?? null);
  const [wordCount, setWordCount] = useState(draft.wordCount || 0);
  const [isDirty, setIsDirty] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveMode, setMoveMode] = useState<"append" | "new">("new");
  const [moveTargetChapterId, setMoveTargetChapterId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [aiTip, setAiTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const [sprintGoal, setSprintGoal] = useState("500");
  const [sprintMin, setSprintMin] = useState("25");
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintSecondsLeft, setSprintSecondsLeft] = useState(0);
  const sprintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fontScale, setFontScaleRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorFontScale")); return v >= 70 && v <= 160 ? v : 100; } catch { return 100; }
  });
  const [maxWidth, setMaxWidthRaw] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("moodra_editorMaxWidth")); return v >= 480 && v <= 1010 ? v : 1010; } catch { return 1010; }
  });
  const setFontScale = (u: number | ((v: number) => number)) => setFontScaleRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorFontScale", String(n)); } catch {} return n; });
  const setMaxWidth = (u: number | ((v: number) => number)) => setMaxWidthRaw(prev => { const n = typeof u === "function" ? u(prev) : u; try { localStorage.setItem("moodra_editorMaxWidth", String(n)); } catch {} return n; });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/drafts/${draft.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "drafts"] });
      setIsDirty(false);
    },
  });

  const save = useCallback(() => {
    const plainText = blocksToPlainText(blocks);
    const wc = plainText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(wc);
    updateMutation.mutate({
      title,
      content: JSON.stringify(blocks),
      wordCount: wc,
      linkedChapterId: linkedChapterId ?? null,
    });
  }, [blocks, title, linkedChapterId]);

  useEffect(() => {
    if (isDirty) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(save, 2000);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [isDirty, save]);

  const startSprint = () => {
    const mins = parseInt(sprintMin) || 25;
    setSprintSecondsLeft(mins * 60);
    setSprintActive(true);
    setSprintExpanded(false);
    sprintTimerRef.current = setInterval(() => {
      setSprintSecondsLeft(v => {
        if (v <= 1) { clearInterval(sprintTimerRef.current!); sprintTimerRef.current = null; setSprintActive(false); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const stopSprint = () => {
    if (sprintTimerRef.current) { clearInterval(sprintTimerRef.current); sprintTimerRef.current = null; }
    setSprintActive(false);
    setSprintSecondsLeft(0);
  };

  useEffect(() => { return () => { if (sprintTimerRef.current) clearInterval(sprintTimerRef.current); }; }, []);

  useEffect(() => {
    if (!isTypewriterMode) return;
    const handleKey = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.top === 0) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const delta = rect.top - (containerRect.top + containerRect.height / 2);
      container.scrollBy({ top: delta, behavior: "smooth" });
    };
    document.addEventListener("keyup", handleKey);
    return () => document.removeEventListener("keyup", handleKey);
  }, [isTypewriterMode]);

  const getReadingTime = () => {
    const mins = Math.ceil(wordCount / 200);
    return mins < 1 ? t.lessThanMin : `${mins} ${t.minLabel}`;
  };

  const handleGetAiTip = async () => {
    const text = blocksToPlainText(blocks);
    if (!text.trim()) return;
    setTipLoading(true);
    try {
      const data = await apiRequest("POST", "/api/ai/improve", {
        text: text.slice(0, 1000),
        mode: "advice",
        bookTitle: book.title,
        bookMode: book.mode,
        lang,
        customInstruction: "Give one short, concrete writing tip for this draft. Max 2 sentences.",
      });
      setAiTip(data.improved || data.text || "");
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: t.aiError, variant: "destructive" });
    } finally {
      setTipLoading(false);
    }
  };

  const handleMoveToChapter = async () => {
    if (!moveMode) return;
    setMoving(true);
    try {
      const draftContent = JSON.stringify(blocks);
      if (moveMode === "new") {
        await apiRequest("POST", `/api/books/${bookId}/chapters`, {
          title,
          content: draftContent,
          bookId,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
        toast({ title: t.moveSuccessNew });
      } else if (moveMode === "append" && moveTargetChapterId) {
        const ch = chapters.find(c => c.id === moveTargetChapterId);
        if (ch) {
          let existingBlocks: Block[] = [];
          try {
            const parsed = JSON.parse(ch.content || "[]");
            if (Array.isArray(parsed)) existingBlocks = parsed;
          } catch {}
          const merged = [...existingBlocks, ...blocks];
          await apiRequest("PATCH", `/api/chapters/${moveTargetChapterId}`, {
            content: JSON.stringify(merged),
          });
          queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
          toast({ title: t.moveSuccessAppend });
        }
      }
      setShowMoveModal(false);
    } catch (e: any) {
      toast({ title: t.moveError, variant: "destructive" });
    } finally {
      setMoving(false);
    }
  };

  const readingTime = getReadingTime();

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Draft editor header */}
      <div className="flex-shrink-0 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (isDirty) save(); onBack(); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.draftsBack}
          </button>
          <span className="text-muted-foreground/30">·</span>

          {/* Title inline edit */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="flex-1 text-sm font-semibold bg-transparent outline-none focus:ring-0 border-0 placeholder:text-muted-foreground/40 min-w-0"
            placeholder={t.titlePlaceholder}
          />

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 flex-shrink-0">
            <span>{t.words(wordCount)}</span>
            {isDirty && <span className="text-amber-500">●</span>}
            {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <div className="w-px h-4 bg-border/60" />

          {/* Font scale */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setFontScale(v => Math.max(70, v - 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">–</sup></button>
            <button onClick={() => setFontScale(100)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-7 text-center tabular-nums">{fontScale}%</button>
            <button onClick={() => setFontScale(v => Math.min(160, v + 5))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">A<sup className="text-[7px]">+</sup></button>
          </div>

          {/* Max width */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMaxWidth(v => Math.max(480, v - 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-3 w-3" /></button>
            <button onClick={() => setMaxWidth(1010)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"><ChevronsLeftRight className="h-3 w-3" /><span className="tabular-nums w-7 text-center">{maxWidth}</span></button>
            <button onClick={() => setMaxWidth(v => Math.min(1010, v + 60))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-3 w-3" /></button>
          </div>

          {/* Typewriter */}
          <button onClick={() => setIsTypewriterMode(v => !v)} className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${isTypewriterMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`} title={t.typewriterMode ?? "Typewriter"}>
            <Keyboard className="h-3 w-3" />
          </button>

          {/* Sprint */}
          <div className="relative">
            <button onClick={() => { if (sprintActive) return; setSprintExpanded(v => !v); }} className={`h-6 flex items-center gap-1 px-1.5 rounded transition-colors text-xs ${sprintActive ? "text-orange-500 bg-orange-50 dark:bg-orange-950/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`} title={t.sprintLabel ?? "Sprint"}>
              {sprintActive ? (<><Clock className="h-3 w-3 animate-pulse" /><span className="font-mono text-[10px]">{String(Math.floor(sprintSecondsLeft / 60)).padStart(2,"0")}:{String(sprintSecondsLeft % 60).padStart(2,"0")}</span></>) : (<Timer className="h-3 w-3" />)}
            </button>
            {sprintActive && (<button onClick={stopSprint} className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive transition-colors"><X className="h-2 w-2" /></button>)}
            {sprintExpanded && !sprintActive && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border bg-background shadow-xl p-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t.sprintLabel ?? "Sprint"}</p>
                <div className="flex gap-2">
                  <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">{t.sprintGoalPlaceholder ?? "Words"}</p><input type="number" min={50} max={10000} step={50} value={sprintGoal} onChange={e => setSprintGoal(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none" /></div>
                  <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Min</p><select value={sprintMin} onChange={e => setSprintMin(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs outline-none">{[5,10,15,20,25,30,45,60].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                </div>
                <button onClick={startSprint} className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: "#F96D1C" }}><Zap className="h-3 w-3" /> {t.sprintStart ?? "Start"}</button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-border/60" />

          {/* Chapter link */}
          <Select
            value={linkedChapterId ? String(linkedChapterId) : "none"}
            onValueChange={v => { setLinkedChapterId(v === "none" ? null : Number(v)); setIsDirty(true); }}
          >
            <SelectTrigger className="w-36 h-7 text-xs rounded-lg border-border/50 bg-secondary/50 [&>span]:truncate">
              <Link2 className="h-3 w-3 mr-1 flex-shrink-0 text-muted-foreground/60" />
              <SelectValue placeholder={t.linkChapter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.noChapter}</SelectItem>
              {chapters.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
              <SendToBack className="h-3.5 w-3.5" />
              {t.toBookBtn}
            </button>
            <button
              onClick={save}
              disabled={!isDirty || updateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-border/50 hover:bg-secondary disabled:opacity-40">
              <Save className="h-3.5 w-3.5" />
              {t.saveBtn}
            </button>
          </div>
        </div>
      </div>

      {/* AI tip bar */}
      {aiTip && (
        <div className="flex-shrink-0 flex items-start gap-2.5 px-5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/30">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed flex-1">{aiTip}</p>
          <button onClick={() => setAiTip("")} className="text-muted-foreground/40 hover:text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Block editor + optional AI panel */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ zoom: fontScale / 100 }}>
          <div style={{ maxWidth, margin: "0 auto" }}>
            <BlockEditor
              key={draft.id}
              initialContent={draft.content || ""}
              onChange={newBlocks => { setBlocks(newBlocks); setIsDirty(true); }}
            />
          </div>
        </div>
        {showAiPanel && (
          <AiPanel
            book={book}
            chapter={null}
            context={blocksToPlainText(blocks)}
            chapters={chapters}
            onInsert={null}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 border-t border-border/30 px-5 py-2 flex items-center gap-4 bg-background/50">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
          <span>{t.wordsTotal(wordCount)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime} {t.reading}</span>
        </div>
        <button
          onClick={handleGetAiTip}
          disabled={tipLoading || wordCount === 0}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-amber-500 transition-colors disabled:opacity-40">
          {tipLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {t.aiTipBtn}
        </button>
      </div>

      {/* Move to chapter modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,109,28,0.1)" }}>
                <SendToBack className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">{t.moveToBook}</h3>
                <p className="text-xs text-muted-foreground">{t.moveDesc}</p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 mb-5">
              {/* New chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "new" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("new")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.newChapterOpt}</p>
                    <p className="text-xs text-muted-foreground">{t.newChapterDesc}</p>
                  </div>
                  {moveMode === "new" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {/* Append to chapter option */}
              <button
                className={cn("w-full p-4 rounded-xl border-2 text-left transition-all", moveMode === "append" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border")}
                onClick={() => setMoveMode("append")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t.appendOpt}</p>
                    <p className="text-xs text-muted-foreground">{t.appendDesc}</p>
                  </div>
                  {moveMode === "append" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
                </div>
              </button>

              {moveMode === "append" && (
                <Select value={moveTargetChapterId ? String(moveTargetChapterId) : ""} onValueChange={v => setMoveTargetChapterId(Number(v))}>
                  <SelectTrigger className="w-full rounded-xl h-10 text-sm">
                    <SelectValue placeholder={t.selectChapter} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                {t.cancelBtn}
              </button>
              <button
                onClick={handleMoveToChapter}
                disabled={moving || (moveMode === "append" && !moveTargetChapterId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}>
                {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendToBack className="h-4 w-4" />}
                {moving ? t.movingBtn : t.moveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Models Editor redirect ─────────────────────────────────────────────
// (Kept for the "Add model" button — opens the full role-models-tab)

// ─── Main Workspace ───────────────────────────────────────────────────────────

export function ResearchWorkspace({ bookId, book }: { bookId: number; book: Book }) {
  const [view, setView] = useState<"workspace" | "draft-editor">("workspace");
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/chapters`),
  });

  const handleOpenDraft = (draft: Draft | null) => {
    setActiveDraft(draft);
    setView("draft-editor");
  };

  if (view === "draft-editor" && activeDraft) {
    return (
      <DraftEditor
        key={activeDraft.id}
        draft={activeDraft}
        bookId={bookId}
        book={book}
        chapters={chapters}
        onBack={() => { setActiveDraft(null); setView("workspace"); }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 50 / 50 split — each panel independently scrollable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Role Models */}
        <div className="flex-1 overflow-y-auto border-r border-border/30 p-4">
          <RoleModelsSection bookId={bookId} book={book} />
        </div>

        {/* Right: Drafts */}
        <div className="flex-1 overflow-y-auto p-4">
          <DraftsSection bookId={bookId} book={book} onOpenDraft={handleOpenDraft} />
        </div>
      </div>
    </div>
  );
}

// Keep old ResearchDashboard name for backward compat during transition
export { ResearchWorkspace as ResearchDashboard };
