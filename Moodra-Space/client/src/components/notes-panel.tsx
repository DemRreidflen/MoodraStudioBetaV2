import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import {
  FileText, Plus, Trash2, Edit, Lightbulb, MessageSquare, Hash, BookOpen, Star,
  LayoutList, LayoutGrid, Paperclip, GripVertical, X, Check, Search, Zap, ChevronRight
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ru, uk, de, enUS } from "date-fns/locale";

const NOTES_I18N = {
  en: {
    title: "Notes & Ideas",
    count: (n: number) => `${n} note${n !== 1 ? "s" : ""}`,
    newBtn: "New",
    all: "All",
    emptyTitle: "No notes yet",
    emptyDesc: "Capture ideas with the quick-capture bar above, or create a detailed note",
    createNote: "+ Create note",
    editTitle: "Edit note",
    newTitle: "New note",
    titlePlaceholder: "Note title…",
    contentPlaceholder: "Note content…",
    tagsPlaceholder: "tags separated by commas…",
    statusLabel: "Status",
    typeLabel: "Type",
    colorLabel: "Color",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    updated: "Note updated",
    created: "Note created",
    deleted: "Note deleted",
    types: { idea: "Idea", note: "Note", quote: "Quote", concept: "Concept", question: "Question", scene: "Scene" },
    statuses: { idea: "Idea", draft: "Draft", wip: "In Progress", done: "Done" },
    searchPlaceholder: "Search notes…",
    quickCapturePlaceholder: "Quick idea… press Enter to save",
    quickCaptureExpand: "More options",
    noResults: "No notes match your search",
  },
  ru: {
    title: "Заметки и идеи",
    count: (n: number) => `${n} заметок`,
    newBtn: "Новая",
    all: "Все",
    emptyTitle: "Нет заметок",
    emptyDesc: "Фиксируй идеи в строке быстрого захвата выше или создай подробную заметку",
    createNote: "+ Создать заметку",
    editTitle: "Редактировать заметку",
    newTitle: "Новая заметка",
    titlePlaceholder: "Заголовок заметки…",
    contentPlaceholder: "Содержание заметки…",
    tagsPlaceholder: "теги через запятую…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Цвет",
    saving: "Сохраняю…",
    save: "Сохранить",
    cancel: "Отмена",
    updated: "Заметка обновлена",
    created: "Заметка создана",
    deleted: "Заметка удалена",
    types: { idea: "Идея", note: "Заметка", quote: "Цитата", concept: "Концепция", question: "Вопрос", scene: "Сцена" },
    statuses: { idea: "Идея", draft: "Черновик", wip: "В работе", done: "Готово" },
    searchPlaceholder: "Поиск заметок…",
    quickCapturePlaceholder: "Быстрая идея… Enter для сохранения",
    quickCaptureExpand: "Подробнее",
    noResults: "Заметки не найдены",
  },
  ua: {
    title: "Нотатки та ідеї",
    count: (n: number) => `${n} нотаток`,
    newBtn: "Нова",
    all: "Всі",
    emptyTitle: "Немає нотаток",
    emptyDesc: "Фіксуй ідеї у рядку швидкого захоплення або створи детальну нотатку",
    createNote: "+ Створити нотатку",
    editTitle: "Редагувати нотатку",
    newTitle: "Нова нотатка",
    titlePlaceholder: "Назва нотатки…",
    contentPlaceholder: "Зміст нотатки…",
    tagsPlaceholder: "теги через кому…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Колір",
    saving: "Зберігаю…",
    save: "Зберегти",
    cancel: "Скасувати",
    updated: "Нотатку оновлено",
    created: "Нотатку створено",
    deleted: "Нотатку видалено",
    types: { idea: "Ідея", note: "Нотатка", quote: "Цитата", concept: "Концепція", question: "Питання", scene: "Сцена" },
    statuses: { idea: "Ідея", draft: "Чернетка", wip: "У роботі", done: "Готово" },
    searchPlaceholder: "Пошук нотаток…",
    quickCapturePlaceholder: "Швидка ідея… Enter для збереження",
    quickCaptureExpand: "Детальніше",
    noResults: "Нотатки не знайдено",
  },
  de: {
    title: "Notizen & Ideen",
    count: (n: number) => `${n} Notiz${n !== 1 ? "en" : ""}`,
    newBtn: "Neu",
    all: "Alle",
    emptyTitle: "Noch keine Notizen",
    emptyDesc: "Erfasse Ideen mit der Schnelleingabe oben oder erstelle eine detaillierte Notiz",
    createNote: "+ Notiz erstellen",
    editTitle: "Notiz bearbeiten",
    newTitle: "Neue Notiz",
    titlePlaceholder: "Notiztitel…",
    contentPlaceholder: "Notizinhalt…",
    tagsPlaceholder: "Tags durch Komma getrennt…",
    statusLabel: "Status",
    typeLabel: "Typ",
    colorLabel: "Farbe",
    saving: "Speichere…",
    save: "Speichern",
    cancel: "Abbrechen",
    updated: "Notiz aktualisiert",
    created: "Notiz erstellt",
    deleted: "Notiz gelöscht",
    types: { idea: "Idee", note: "Notiz", quote: "Zitat", concept: "Konzept", question: "Frage", scene: "Szene" },
    statuses: { idea: "Idee", draft: "Entwurf", wip: "In Arbeit", done: "Fertig" },
    searchPlaceholder: "Notizen suchen…",
    quickCapturePlaceholder: "Schnelle Idee… Enter zum Speichern",
    quickCaptureExpand: "Mehr Optionen",
    noResults: "Keine Notizen gefunden",
  },
};

const DATE_LOCALES = { en: enUS, ru, ua: uk, de };

const NOTE_TYPES = [
  { value: "idea",     icon: Lightbulb,    accent: "#F59E0B" },
  { value: "note",     icon: FileText,     accent: "#3B82F6" },
  { value: "quote",    icon: MessageSquare,accent: "#8B5CF6" },
  { value: "concept",  icon: Star,         accent: "#10B981" },
  { value: "question", icon: Hash,         accent: "#F96D1C" },
  { value: "scene",    icon: BookOpen,     accent: "#EC4899" },
] as const;

const NOTE_STATUSES = [
  { value: "idea",  color: "#94A3B8" },
  { value: "draft", color: "#F59E0B" },
  { value: "wip",   color: "#3B82F6" },
  { value: "done",  color: "#22C55E" },
] as const;

const NOTE_COLORS = [
  { value: "yellow", bg: "#FEFBEE", border: "#EDD98C", text: "#5C4A1E", clip: "#C4900A" },
  { value: "blue",   bg: "#F0F6FF", border: "#BCCEEA", text: "#2A3F5E", clip: "#4272A6" },
  { value: "purple", bg: "#F5F2FF", border: "#C9C0E8", text: "#3B2760", clip: "#6A52A8" },
  { value: "green",  bg: "#F2FBF5", border: "#A8DCBA", text: "#1E4A2E", clip: "#3D8054" },
  { value: "pink",   bg: "#FEF3FA", border: "#DCAECF", text: "#5C2848", clip: "#A04C86" },
  { value: "orange", bg: "#FFF7F0", border: "#E8C4A0", text: "#5C3420", clip: "#B45C28" },
  { value: "gray",   bg: "#F7F7F7", border: "#CCCCCC", text: "#3A3A3A", clip: "#707070" },
];

function getColor(value?: string | null) {
  return NOTE_COLORS.find(c => c.value === value) || NOTE_COLORS[0];
}

function getStatus(value?: string | null) {
  return NOTE_STATUSES.find(s => s.value === value) || NOTE_STATUSES[0];
}

function getType(value?: string | null) {
  return NOTE_TYPES.find(t => t.value === value) || NOTE_TYPES[0];
}

// ─── Sticker Card ───────────────────────────────────────────────────
function StickerCard({ note, onEdit, onDelete, isDragging }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: number) => void; isDragging?: boolean;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const status = getStatus((note as any).status);
  const type = getType(note.type);
  const Icon = type.icon;
  const typeLabel = s.types[type.value as keyof typeof s.types] ?? type.value;
  const statusLabel = s.statuses[status.value as keyof typeof s.statuses] ?? status.value;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: col.bg, borderColor: col.border }}
      className="relative rounded-xl border-2 p-4 group flex flex-col min-h-[160px] transition-shadow hover:shadow-md"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity"
        style={{ color: col.clip }}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div className="absolute -top-2 right-4" style={{ color: col.clip }}>
        <Paperclip className="h-4 w-4 rotate-[-20deg]" />
      </div>

      <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(note)}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: `${col.clip}20`, color: col.clip }}
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors hover:bg-red-100"
          style={{ color: "#ef4444" }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5 mt-0.5">
        <Icon className="h-3.5 w-3.5" style={{ color: type.accent }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: type.accent }}>{typeLabel}</span>
      </div>

      <h4 className="font-semibold text-sm mb-1.5 leading-tight pr-10" style={{ color: col.text }}>{note.title}</h4>

      {note.content && (
        <p className="text-[11px] leading-relaxed flex-1 line-clamp-4" style={{ color: `${col.text}BB` }}>{note.content}</p>
      )}

      {note.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: `${col.clip}18`, color: col.clip }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${col.border}` }}>
        <span className="text-[10px]" style={{ color: `${col.text}70` }}>
          {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
          <span className="text-[10px] font-medium" style={{ color: status.color }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ────────────────────────────────────────────────────────
function ListRow({ note, onEdit, onDelete }: {
  note: Note; onEdit: (n: Note) => void; onDelete: (id: number) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const status = getStatus((note as any).status);
  const type = getType(note.type);
  const Icon = type.icon;
  const statusLabel = s.statuses[status.value as keyof typeof s.statuses] ?? status.value;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style }}
      className="group flex items-start gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary/25 bg-card transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity pt-0.5 flex-shrink-0"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="w-1.5 flex-shrink-0 self-stretch rounded-full mt-0.5" style={{ background: col.clip }} />
      <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0" style={{ background: `${type.accent}18` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: type.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <h4 className="font-semibold text-sm truncate">{note.title}</h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
            <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
          </div>
        </div>
        {note.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
        )}
        {note.tags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {note.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(note)}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Note Dialog ─────────────────────────────────────────────────────
function NoteDialog({ open, onClose, bookId, note, prefillTitle }: {
  open: boolean; onClose: () => void; bookId: number; note?: Note; prefillTitle?: string;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(note?.title || prefillTitle || "");
  const [content, setContent] = useState(note?.content || "");
  const [type, setType] = useState(note?.type || "idea");
  const [tags, setTags] = useState(note?.tags || "");
  const [color, setColor] = useState<string>((note as any)?.color || "yellow");
  const [status, setStatus] = useState<string>((note as any)?.status || "idea");

  useEffect(() => {
    if (open) {
      setTitle(note?.title || prefillTitle || "");
      setContent(note?.content || "");
      setType(note?.type || "idea");
      setTags(note?.tags || "");
      setColor((note as any)?.color || "yellow");
      setStatus((note as any)?.status || "idea");
    }
  }, [open, note?.id, prefillTitle]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => note
      ? apiRequest("PATCH", `/api/notes/${note.id}`, data)
      : apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      onClose();
      toast({ title: note ? s.updated : s.created });
    },
  });

  const col = getColor(color);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-6 rounded-full" style={{ background: col.clip }} />
            <span className="font-bold text-sm text-foreground">
              {note ? s.editTitle : s.newTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 rotate-[-20deg]" style={{ color: col.clip }} />
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Color row */}
        <div className="px-5 pt-3 pb-0 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">{s.colorLabel}</span>
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className="transition-all hover:scale-110"
              style={{
                width: color === c.value ? 22 : 18,
                height: color === c.value ? 22 : 18,
                borderRadius: "50%",
                background: c.bg,
                border: `2px solid ${color === c.value ? c.clip : c.border}`,
                outline: color === c.value ? `2px solid ${c.clip}40` : "none",
                outlineOffset: 1,
              }}
              title={c.value}
            />
          ))}
        </div>

        <div className="p-5 space-y-3.5">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={s.titlePlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground transition-all"
            style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.text }}
            onFocus={e => { e.currentTarget.style.borderColor = col.clip; }}
            onBlur={e => { e.currentTarget.style.borderColor = col.border; }}
            autoFocus
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => { setContent(e.target.value); autoResizeTextarea(); }}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (title.trim()) mutation.mutate({ title: title.trim(), content, type, tags, color, status });
              }
            }}
            rows={5}
            placeholder={s.contentPlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm resize-none placeholder:text-muted-foreground leading-relaxed transition-all"
            style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.text, minHeight: "120px", maxHeight: "320px", overflow: "auto" }}
            onFocus={e => { e.currentTarget.style.borderColor = col.clip; autoResizeTextarea(); }}
            onBlur={e => { e.currentTarget.style.borderColor = col.border; }}
          />

          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder={s.tagsPlaceholder}
              className="w-full rounded-xl pl-7 pr-3 py-2.5 outline-none text-sm placeholder:text-muted-foreground transition-all"
              style={{ background: "hsl(var(--secondary))", border: "1.5px solid transparent", color: "hsl(var(--foreground))" }}
              onFocus={e => { e.currentTarget.style.borderColor = col.clip; }}
              onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">{s.typeLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: type === t.value ? `${t.accent}18` : "hsl(var(--secondary))",
                    color: type === t.value ? t.accent : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${type === t.value ? `${t.accent}50` : "transparent"}`,
                  }}
                >
                  <t.icon className="h-3 w-3" />
                  {s.types[t.value as keyof typeof s.types]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">{s.statusLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_STATUSES.map(st => (
                <button
                  key={st.value}
                  onClick={() => setStatus(st.value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: status === st.value ? `${st.color}15` : "hsl(var(--secondary))",
                    color: status === st.value ? st.color : "hsl(var(--muted-foreground))",
                    border: `1.5px solid ${status === st.value ? `${st.color}45` : "transparent"}`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: status === st.value ? st.color : "hsl(var(--muted-foreground))" }} />
                  {s.statuses[st.value as keyof typeof s.statuses]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-muted-foreground hover:bg-secondary transition-colors"
          >
            {s.cancel}
          </button>
          <button
            onClick={() => mutation.mutate({ title: title.trim(), content, type, tags, color, status })}
            disabled={!title.trim() || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-white"
            style={{ background: col.clip }}
          >
            {mutation.isPending ? s.saving : <><Check className="h-3.5 w-3.5" /> {s.save}</>}
          </button>
          <div className="absolute bottom-[72px] right-5 text-[10px] text-muted-foreground/40 pointer-events-none select-none">
            Ctrl+Enter
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────
export function NotesPanel({ bookId }: { bookId: number }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];

  const [showDialog, setShowDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | undefined>();
  const [dialogPrefill, setDialogPrefill] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [search, setSearch] = useState("");
  const [quickCapture, setQuickCapture] = useState("");
  const [quickCaptureType, setQuickCaptureType] = useState(0);
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  const quickCaptureMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      setQuickCapture("");
      quickCaptureRef.current?.focus();
    },
  });

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: s.deleted });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const orderedNotes = localOrder
    ? localOrder.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[]
    : notes;

  const searchLower = search.toLowerCase();
  const filtered = orderedNotes
    .filter(n => filter === "all" || n.type === filter)
    .filter(n => !searchLower || (
      n.title.toLowerCase().includes(searchLower) ||
      (n.content || "").toLowerCase().includes(searchLower) ||
      (n.tags || "").toLowerCase().includes(searchLower)
    ));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedNotes.map(n => n.id);
    const oldIdx = ids.indexOf(active.id as number);
    const newIdx = ids.indexOf(over.id as number);
    setLocalOrder(arrayMove(ids, oldIdx, newIdx));
  }, [orderedNotes]);

  const currentQcType = NOTE_TYPES[quickCaptureType % NOTE_TYPES.length];
  const QcIcon = currentQcType.icon;

  const handleQuickCapture = () => {
    const title = quickCapture.trim();
    if (!title) return;
    quickCaptureMutation.mutate({ title, content: "", type: currentQcType.value, tags: "", color: "yellow", status: "idea" });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            {s.title}
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground/60 flex-shrink-0">{s.count(notes.length)}</span>
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className="p-1.5 transition-colors"
            style={{ background: viewMode === "list" ? "rgba(249,109,28,0.1)" : "transparent", color: viewMode === "list" ? "#F96D1C" : "#888" }}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className="p-1.5 transition-colors"
            style={{ background: viewMode === "cards" ? "rgba(249,109,28,0.1)" : "transparent", color: viewMode === "cards" ? "#F96D1C" : "#888" }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={() => { setEditNote(undefined); setDialogPrefill(""); setShowDialog(true); }}
          data-testid="button-add-note"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
          style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.2)" }}
        >
          <Plus className="h-3 w-3" />
          {s.newBtn}
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-2.5 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={s.searchPlaceholder}
            className="w-full rounded-xl pl-8 pr-3 py-2 outline-none text-xs bg-secondary/60 border border-transparent focus:border-primary/25 transition-all placeholder:text-muted-foreground/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className="text-[10px] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap font-medium"
          style={{ background: filter === "all" ? "#F96D1C" : "transparent", color: filter === "all" ? "#fff" : "#888", border: "1px solid", borderColor: filter === "all" ? "#F96D1C" : "#e5e7eb" }}
        >
          {s.all}
        </button>
        {NOTE_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className="text-[10px] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap font-medium flex items-center gap-1"
            style={{
              background: filter === t.value ? `${t.accent}18` : "transparent",
              color: filter === t.value ? t.accent : "#888",
              border: "1px solid",
              borderColor: filter === t.value ? `${t.accent}40` : "#e5e7eb",
            }}
          >
            <t.icon className="h-2.5 w-2.5" />
            {s.types[t.value as keyof typeof s.types]}
          </button>
        ))}
      </div>

      {/* Quick capture bar */}
      <div className="px-4 pb-2.5">
        <div
          className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all"
          style={{ borderColor: "#F96D1C22", background: "#FFF7F0" }}
        >
          <button
            onClick={() => setQuickCaptureType(prev => prev + 1)}
            title="Click to change type"
            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: `${currentQcType.accent}18`, color: currentQcType.accent }}
          >
            <QcIcon className="h-3.5 w-3.5" />
          </button>
          <input
            ref={quickCaptureRef}
            value={quickCapture}
            onChange={e => setQuickCapture(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && quickCapture.trim()) {
                handleQuickCapture();
              } else if (e.key === "Tab" && quickCapture.trim()) {
                e.preventDefault();
                setDialogPrefill(quickCapture);
                setQuickCapture("");
                setEditNote(undefined);
                setShowDialog(true);
              } else if (e.key === "Escape") {
                setQuickCapture("");
              }
            }}
            placeholder={s.quickCapturePlaceholder}
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-orange-300/70 text-orange-900"
          />
          {quickCapture.trim() ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => { setDialogPrefill(quickCapture); setQuickCapture(""); setEditNote(undefined); setShowDialog(true); }}
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium transition-colors flex items-center gap-0.5"
                style={{ color: "#F96D1C", background: "rgba(249,109,28,0.1)" }}
                title={s.quickCaptureExpand + " (Tab)"}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                onClick={handleQuickCapture}
                disabled={quickCaptureMutation.isPending}
                className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-0.5 text-white"
                style={{ background: "#F96D1C" }}
              >
                <Zap className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <span className="text-[9px] text-orange-300/50 flex-shrink-0 hidden sm:block">Enter ↵</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto border-t border-border/50">
        <div className={viewMode === "cards" ? "p-3" : "p-3"}>
          {isLoading ? (
            <div className={viewMode === "cards" ? "grid grid-cols-2 gap-3" : "space-y-2"}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 && notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl overflow-hidden">
                <img src="/moodra-app-icon.png" alt="Moodra" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{s.emptyTitle}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[200px] mx-auto">{s.emptyDesc}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">{s.noResults}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map(n => n.id)} strategy={rectSortingStrategy}>
                {viewMode === "cards" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map(note => (
                      <StickerCard
                        key={note.id}
                        note={note}
                        onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                        onDelete={id => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(note => (
                      <ListRow
                        key={note.id}
                        note={note}
                        onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                        onDelete={id => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <NoteDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditNote(undefined); setDialogPrefill(""); }}
        bookId={bookId}
        note={editNote}
        prefillTitle={dialogPrefill}
      />
    </div>
  );
}
