import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import {
  FileText, Plus, Trash2, Edit, Lightbulb, MessageSquare, Hash, BookOpen, Star,
  LayoutList, LayoutGrid, Paperclip, GripVertical, X, Check, Search, Zap,
  ChevronRight, Inbox, Pin, PinOff, FolderOpen, Tag, Filter, Eye, Archive,
  Sparkles, Brain, Target, HelpCircle, Telescope, Feather, Users, Microscope,
  ChevronDown, ChevronUp, StickyNote, Layers, RotateCcw, AlertTriangle, Download
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
import { cn } from "@/lib/utils";

// ─── i18n ─────────────────────────────────────────────────────────────
const NOTES_I18N = {
  en: {
    title: "Notes",
    inbox: "Inbox",
    pinned: "Pinned",
    allNotes: "All notes",
    collections: "Collections",
    noCollection: "Uncategorized",
    addCollection: "New collection…",
    count: (n: number) => `${n} note${n !== 1 ? "s" : ""}`,
    newBtn: "New",
    searchPlaceholder: "Search notes…",
    quickCapturePlaceholder: "Quick capture… Enter to save",
    quickCaptureExpand: "Expand",
    noResults: "No notes match your search",
    emptyTitle: "No notes yet",
    emptyDesc: "Capture ideas with the quick-capture bar above",
    emptyInbox: "Inbox is empty",
    emptyInboxDesc: "Quick-captured notes land here first",
    editTitle: "Edit note",
    newTitle: "New note",
    titlePlaceholder: "Note title…",
    contentPlaceholder: "Note content…",
    tagsPlaceholder: "tags, separated by commas…",
    collectionPlaceholder: "Collection name…",
    statusLabel: "Status",
    typeLabel: "Type",
    colorLabel: "Color",
    collectionLabel: "Collection",
    importanceLabel: "Importance",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    updated: "Note updated",
    created: "Note created",
    deleted: "Note deleted",
    toastPinned: "Pinned",
    toastUnpinned: "Unpinned",
    types: {
      idea: "Idea", note: "Note", quote: "Quote", concept: "Concept",
      question: "Question", scene: "Scene", insight: "Insight",
      observation: "Observation", reflection: "Reflection",
      argument: "Argument", character: "Character",
    },
    statuses: {
      inbox: "Inbox", active: "Active", developed: "Developed",
      used: "Used", archived: "Archived",
    },
    importance: { normal: "Normal", high: "High", core: "Core" },
    filterType: "Type",
    filterStatus: "Status",
    all: "All",
    trash: "Trash",
    trashDesc: "Deleted notes (30 days)",
    trashed: "Moved to Trash",
    restore: "Restore",
    restored: "Restored",
    deleteForever: "Delete forever",
    deletedForever: "Permanently deleted",
    attachments: "Attachments",
    addFile: "Add file",
    fileTooLarge: "File is too large (max 5 MB)",
    optional: "Optional fields",
    collectionDropdown: "No collection",
  },
  ru: {
    title: "Заметки",
    inbox: "Входящие",
    pinned: "Закреплённые",
    allNotes: "Все заметки",
    collections: "Коллекции",
    noCollection: "Без коллекции",
    addCollection: "Новая коллекция…",
    count: (n: number) => `${n} заметок`,
    newBtn: "Новая",
    searchPlaceholder: "Поиск заметок…",
    quickCapturePlaceholder: "Быстрая мысль… Enter для сохранения",
    quickCaptureExpand: "Развернуть",
    noResults: "Заметки не найдены",
    emptyTitle: "Нет заметок",
    emptyDesc: "Фиксируй идеи в строке быстрого захвата выше",
    emptyInbox: "Входящие пусты",
    emptyInboxDesc: "Быстро захваченные заметки попадают сюда",
    editTitle: "Редактировать заметку",
    newTitle: "Новая заметка",
    titlePlaceholder: "Заголовок заметки…",
    contentPlaceholder: "Содержание заметки…",
    tagsPlaceholder: "теги через запятую…",
    collectionPlaceholder: "Название коллекции…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Цвет",
    collectionLabel: "Коллекция",
    importanceLabel: "Важность",
    saving: "Сохраняю…",
    save: "Сохранить",
    cancel: "Отмена",
    updated: "Заметка обновлена",
    created: "Заметка создана",
    deleted: "Заметка удалена",
    toastPinned: "Закреплено",
    toastUnpinned: "Откреплено",
    types: {
      idea: "Идея", note: "Заметка", quote: "Цитата", concept: "Концепция",
      question: "Вопрос", scene: "Сцена", insight: "Инсайт",
      observation: "Наблюдение", reflection: "Рефлексия",
      argument: "Аргумент", character: "Персонаж",
    },
    statuses: {
      inbox: "Входящие", active: "Активная", developed: "Развита",
      used: "Использована", archived: "Архив",
    },
    importance: { normal: "Обычная", high: "Важная", core: "Ключевая" },
    filterType: "Тип",
    filterStatus: "Статус",
    all: "Все",
    trash: "Корзина",
    trashDesc: "Удалённые заметки (30 дней)",
    trashed: "Перемещено в корзину",
    restore: "Восстановить",
    restored: "Восстановлено",
    deleteForever: "Удалить навсегда",
    deletedForever: "Удалено навсегда",
    attachments: "Вложения",
    addFile: "Добавить файл",
    fileTooLarge: "Файл слишком большой (макс 5 МБ)",
    optional: "Дополнительные поля",
    collectionDropdown: "Без коллекции",
  },
  ua: {
    title: "Нотатки",
    inbox: "Вхідні",
    pinned: "Закріплені",
    allNotes: "Всі нотатки",
    collections: "Колекції",
    noCollection: "Без колекції",
    addCollection: "Нова колекція…",
    count: (n: number) => `${n} нотаток`,
    newBtn: "Нова",
    searchPlaceholder: "Пошук нотаток…",
    quickCapturePlaceholder: "Швидка думка… Enter для збереження",
    quickCaptureExpand: "Розгорнути",
    noResults: "Нотатки не знайдено",
    emptyTitle: "Немає нотаток",
    emptyDesc: "Фіксуй ідеї у рядку швидкого захоплення вище",
    emptyInbox: "Вхідні порожні",
    emptyInboxDesc: "Швидко захоплені нотатки потрапляють сюди",
    editTitle: "Редагувати нотатку",
    newTitle: "Нова нотатка",
    titlePlaceholder: "Назва нотатки…",
    contentPlaceholder: "Зміст нотатки…",
    tagsPlaceholder: "теги через кому…",
    collectionPlaceholder: "Назва колекції…",
    statusLabel: "Статус",
    typeLabel: "Тип",
    colorLabel: "Колір",
    collectionLabel: "Колекція",
    importanceLabel: "Важливість",
    saving: "Зберігаю…",
    save: "Зберегти",
    cancel: "Скасувати",
    updated: "Нотатку оновлено",
    created: "Нотатку створено",
    deleted: "Нотатку видалено",
    toastPinned: "Закріплено",
    toastUnpinned: "Відкріплено",
    types: {
      idea: "Ідея", note: "Нотатка", quote: "Цитата", concept: "Концепція",
      question: "Питання", scene: "Сцена", insight: "Інсайт",
      observation: "Спостереження", reflection: "Рефлексія",
      argument: "Аргумент", character: "Персонаж",
    },
    statuses: {
      inbox: "Вхідні", active: "Активна", developed: "Розвинена",
      used: "Використана", archived: "Архів",
    },
    importance: { normal: "Звичайна", high: "Важлива", core: "Ключова" },
    filterType: "Тип",
    filterStatus: "Статус",
    all: "Всі",
    trash: "Кошик",
    trashDesc: "Видалені нотатки (30 днів)",
    trashed: "Переміщено до кошика",
    restore: "Відновити",
    restored: "Відновлено",
    deleteForever: "Видалити назавжди",
    deletedForever: "Видалено назавжди",
    attachments: "Вкладення",
    addFile: "Додати файл",
    fileTooLarge: "Файл завеликий (макс 5 МБ)",
    optional: "Додаткові поля",
    collectionDropdown: "Без колекції",
  },
  de: {
    title: "Notizen",
    inbox: "Eingang",
    pinned: "Angeheftet",
    allNotes: "Alle Notizen",
    collections: "Sammlungen",
    noCollection: "Ohne Sammlung",
    addCollection: "Neue Sammlung…",
    count: (n: number) => `${n} Notiz${n !== 1 ? "en" : ""}`,
    newBtn: "Neu",
    searchPlaceholder: "Notizen suchen…",
    quickCapturePlaceholder: "Schneller Gedanke… Enter zum Speichern",
    quickCaptureExpand: "Erweitern",
    noResults: "Keine Notizen gefunden",
    emptyTitle: "Noch keine Notizen",
    emptyDesc: "Erfasse Ideen mit der Schnelleingabe oben",
    emptyInbox: "Eingang ist leer",
    emptyInboxDesc: "Schnell erfasste Notizen landen hier zuerst",
    editTitle: "Notiz bearbeiten",
    newTitle: "Neue Notiz",
    titlePlaceholder: "Notiztitel…",
    contentPlaceholder: "Notizinhalt…",
    tagsPlaceholder: "Tags durch Komma getrennt…",
    collectionPlaceholder: "Sammlungsname…",
    statusLabel: "Status",
    typeLabel: "Typ",
    colorLabel: "Farbe",
    collectionLabel: "Sammlung",
    importanceLabel: "Wichtigkeit",
    saving: "Speichere…",
    save: "Speichern",
    cancel: "Abbrechen",
    updated: "Notiz aktualisiert",
    created: "Notiz erstellt",
    deleted: "Notiz gelöscht",
    toastPinned: "Angeheftet",
    toastUnpinned: "Abgeheftet",
    types: {
      idea: "Idee", note: "Notiz", quote: "Zitat", concept: "Konzept",
      question: "Frage", scene: "Szene", insight: "Einsicht",
      observation: "Beobachtung", reflection: "Reflexion",
      argument: "Argument", character: "Figur",
    },
    statuses: {
      inbox: "Eingang", active: "Aktiv", developed: "Entwickelt",
      used: "Genutzt", archived: "Archiviert",
    },
    importance: { normal: "Normal", high: "Wichtig", core: "Kernidee" },
    filterType: "Typ",
    filterStatus: "Status",
    all: "Alle",
    trash: "Papierkorb",
    trashDesc: "Gelöschte Notizen (30 Tage)",
    trashed: "In Papierkorb verschoben",
    restore: "Wiederherstellen",
    restored: "Wiederhergestellt",
    deleteForever: "Endgültig löschen",
    deletedForever: "Endgültig gelöscht",
    attachments: "Anhänge",
    addFile: "Datei hinzufügen",
    fileTooLarge: "Datei zu groß (max 5 MB)",
    optional: "Optionale Felder",
    collectionDropdown: "Keine Sammlung",
  },
};

const DATE_LOCALES = { en: enUS, ru, ua: uk, de };

// ─── Note types ────────────────────────────────────────────────────────
const NOTE_TYPES = [
  { value: "idea",        icon: Lightbulb,    accent: "#F59E0B" },
  { value: "note",        icon: FileText,     accent: "#3B82F6" },
  { value: "quote",       icon: MessageSquare,accent: "#8B5CF6" },
  { value: "concept",     icon: Brain,        accent: "#10B981" },
  { value: "question",    icon: HelpCircle,   accent: "#F96D1C" },
  { value: "scene",       icon: BookOpen,     accent: "#EC4899" },
  { value: "insight",     icon: Sparkles,     accent: "#06B6D4" },
  { value: "observation", icon: Telescope,    accent: "#84CC16" },
  { value: "reflection",  icon: Feather,      accent: "#A78BFA" },
  { value: "argument",    icon: Target,       accent: "#EF4444" },
  { value: "character",   icon: Users,        accent: "#F97316" },
] as const;

const NOTE_STATUSES = [
  { value: "inbox",    color: "#94A3B8" },
  { value: "active",   color: "#F59E0B" },
  { value: "developed",color: "#3B82F6" },
  { value: "used",     color: "#22C55E" },
  { value: "archived", color: "#9CA3AF" },
] as const;

const NOTE_COLORS = [
  { value: "none",   bg: "hsl(var(--card))",       border: "hsl(var(--border))",    text: "hsl(var(--foreground))", clip: "hsl(var(--muted-foreground))" },
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
  return NOTE_STATUSES.find(s => s.value === value) || null;
}
function getType(value?: string | null) {
  if (!value) return null;
  return NOTE_TYPES.find(t => t.value === value) || null;
}
function getStatusOrDefault(value?: string | null) {
  return NOTE_STATUSES.find(s => s.value === value) || NOTE_STATUSES[0];
}
function getTypeOrDefault(value?: string | null) {
  return NOTE_TYPES.find(t => t.value === value) || NOTE_TYPES[0];
}

// ─── Note Card (square sticky, aspect-ratio 1/1) ────────────────────
function NoteCard({ note, onEdit, onTrash, onPin }: {
  note: Note; onEdit: (n: Note) => void; onTrash: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getType(note.type);
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;
  const noteStatus = getStatus((note as any).status);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, background: col.bg, border: `1px solid ${col.border}`, aspectRatio: "1/1" }}
      onClick={() => onEdit(note)}
      className="relative rounded-2xl p-3 group flex flex-col overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.985]"
    >
      {/* Drag handle */}
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity z-10"
      >
        <GripVertical className="h-3 w-3" style={{ color: col.clip }} />
      </div>

      {/* Top row: type icon (if set) + date + pin */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          {type && (
            <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${type.accent}18`, color: type.accent }}>
              <type.icon className="h-2 w-2" />
              {s.types[type.value as keyof typeof s.types]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPinned && <Pin className="h-2.5 w-2.5" style={{ color: col.clip }} />}
          <span className="text-[9px] font-medium" style={{ color: `${col.text}60` }}>
            {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-[12px] leading-snug line-clamp-2 flex-shrink-0" style={{ color: col.text }}>{note.title}</h4>

      {/* Content preview */}
      {note.content && (
        <p className="text-[10px] leading-relaxed line-clamp-3 flex-1 mt-1 min-h-0" style={{ color: `${col.text}85` }}>{note.content}</p>
      )}

      {/* Bottom pills: status + importance + tag (only when set) */}
      <div className="flex flex-wrap gap-0.5 mt-auto pt-1.5 flex-shrink-0">
        {noteStatus && (note as any).status && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: `${noteStatus.color}18`, color: noteStatus.color }}>
            {s.statuses[(note as any).status as keyof typeof s.statuses]}
          </span>
        )}
        {importance && importance !== "" && (
          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium"
            style={{ background: importance === "core" ? "#EF444418" : importance === "high" ? "#F59E0B18" : "#94A3B818", color: importance === "core" ? "#EF4444" : importance === "high" ? "#F59E0B" : "#94A3B8" }}>
            {s.importance[importance as keyof typeof s.importance]}
          </span>
        )}
        {note.tags && note.tags.split(",").slice(0, 1).map(t => t.trim()).filter(Boolean).map(tag => (
          <span key={tag} className="text-[8px] px-1 py-0.5 rounded-full font-medium" style={{ background: `${col.clip}14`, color: `${col.clip}CC` }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); onPin(note); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/10"
          style={{ color: isPinned ? col.clip : `${col.text}50` }}
          title={isPinned ? s.toastUnpinned : s.toastPinned}
        >
          {isPinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onTrash(note.id); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-red-100"
          style={{ color: `${col.text}50` }}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

// ─── List Row (Apple Notes style) ─────────────────────────────────────
function NoteRow({ note, onEdit, onTrash, onPin }: {
  note: Note; onEdit: (n: Note) => void; onTrash: (id: number) => void; onPin: (n: Note) => void;
}) {
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const col = getColor((note as any).color);
  const type = getTypeOrDefault(note.type);
  const Icon = type.icon;
  const isPinned = (note as any).isPinned === "true";
  const importance = (note as any).importance;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(note)}
      className="group flex items-stretch gap-0 cursor-pointer transition-colors hover:bg-secondary/40 rounded-xl border border-transparent hover:border-border/30"
    >
      {/* Color strip */}
      <div className="w-[3px] flex-shrink-0 rounded-l-xl my-2" style={{ background: col.clip }} />

      {/* Drag handle */}
      <div
        {...attributes} {...listeners}
        onClick={e => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-25 cursor-grab active:cursor-grabbing transition-opacity flex items-center px-1.5"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-2">
        {/* Title row */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <h4 className="font-semibold text-[13px] leading-snug truncate flex-1 text-foreground">{note.title}</h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPinned && <Pin className="h-2.5 w-2.5 text-muted-foreground/50" />}
            {importance === "core" && <span className="text-[8px] font-bold text-red-400">●</span>}
            {importance === "high" && <span className="text-[8px] font-bold text-amber-400">●</span>}
            <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
              {format(new Date(note.updatedAt), "d MMM", { locale: DATE_LOCALES[lang] })}
            </span>
          </div>
        </div>

        {/* Preview row: type + content */}
        <div className="flex items-center gap-1.5">
          <Icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color: type.accent }} />
          <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1">
            {note.content ? note.content : <span className="italic opacity-50">—</span>}
          </p>
        </div>

        {/* Tags + collection */}
        {(note.tags || (note as any).collection) && (
          <div className="flex items-center gap-2 mt-1">
            {(note as any).collection && (
              <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                <FolderOpen className="h-2 w-2" />{(note as any).collection}
              </span>
            )}
            {note.tags && (
              <div className="flex gap-1">
                {note.tags.split(",").slice(0, 2).map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0 rounded-full font-medium" style={{ background: `${col.clip}14`, color: `${col.clip}BB` }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions — hover only */}
      <div
        className="flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => onPin(note)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors">
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button onClick={() => onTrash(note.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Note Dialog (with optional fields + collection dropdown + attachments) ──
function NoteDialog({ open, onClose, bookId, note, prefillTitle, prefillStatus, collections }: {
  open: boolean; onClose: () => void; bookId: number; note?: Note;
  prefillTitle?: string; prefillStatus?: string; collections: string[];
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("yellow");
  const [status, setStatus] = useState("");
  const [collection, setCollection] = useState("");
  const [importance, setImportance] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showTypeAll, setShowTypeAll] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ name: string; type: string; size: number; content: string }[]>([]);
  const [attachments, setAttachments] = useState<{ id: number; fileName: string; fileType: string; fileSize: number }[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(note?.title || prefillTitle || "");
      setContent(note?.content || "");
      setType(note?.type || "");
      setTags(note?.tags || "");
      setColor((note as any)?.color || "yellow");
      setStatus((note as any)?.status || prefillStatus || "");
      setCollection((note as any)?.collection || "");
      setImportance((note as any)?.importance || "");
      setIsPinned((note as any)?.isPinned === "true");
      setPendingFiles([]);
      setShowOptional(!!(note?.type || (note as any)?.status || (note as any)?.importance));
      if (note?.id) {
        setLoadingAttachments(true);
        apiRequest("GET", `/api/notes/${note.id}/attachments`)
          .then((data: any) => setAttachments(Array.isArray(data) ? data : []))
          .catch(() => setAttachments([]))
          .finally(() => setLoadingAttachments(false));
      } else {
        setAttachments([]);
      }
    }
  }, [open, note?.id, prefillTitle, prefillStatus]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => note
      ? apiRequest("PATCH", `/api/notes/${note.id}`, data)
      : apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: async (savedNote: any) => {
      const noteId = note?.id || savedNote?.id;
      if (noteId && pendingFiles.length > 0) {
        for (const f of pendingFiles) {
          try {
            await apiRequest("POST", `/api/notes/${noteId}/attachments`, { fileName: f.name, fileType: f.type, fileSize: f.size, fileContent: f.content });
          } catch {}
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      onClose();
      toast({ title: note ? s.updated : s.created });
    },
  });

  const handleSave = () => {
    if (!title.trim()) return;
    mutation.mutate({ title: title.trim(), content, type, tags, color, status, collection, importance, isPinned: isPinned ? "true" : "false" });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast({ title: s.fileTooLarge, variant: "destructive" }); continue; }
      const reader = new FileReader();
      reader.onload = ev => {
        const raw = (ev.target?.result as string || "");
        const base64 = raw.split(",")[1] || raw;
        setPendingFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, content: base64 }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/attachments/${id}`);
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const col = getColor(color);
  const visibleTypes = showTypeAll ? NOTE_TYPES : NOTE_TYPES.slice(0, 6);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-card border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full" style={{ background: col.clip }} />
            <span className="font-bold text-sm">{note ? s.editTitle : s.newTitle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
              style={{ color: isPinned ? col.clip : "#94A3B8" }}
              title={s.toastPinned}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Color row */}
        <div className="px-5 pt-3 flex items-center gap-2 flex-shrink-0">
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className="transition-transform hover:scale-110"
              style={{
                width: color === c.value ? 22 : 17, height: color === c.value ? 22 : 17,
                borderRadius: "50%", background: c.bg,
                border: `2px solid ${color === c.value ? c.clip : c.border}`,
                outline: color === c.value ? `2px solid ${c.clip}40` : "none", outlineOffset: 1,
              }}
            />
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={s.titlePlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground transition-all bg-secondary/60 border border-border focus:border-primary/50"
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave(); }}
            autoFocus
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => { setContent(e.target.value); autoResize(); }}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); } }}
            rows={4}
            placeholder={s.contentPlaceholder}
            className="w-full rounded-xl px-3 py-2.5 outline-none text-sm resize-none placeholder:text-muted-foreground leading-relaxed transition-all bg-secondary/60 border border-border focus:border-primary/50"
            style={{ minHeight: "100px", maxHeight: "240px", overflow: "auto" }}
            onFocus={() => autoResize()}
          />

          {/* Tags */}
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder={s.tagsPlaceholder}
              className="w-full rounded-xl pl-7 pr-3 py-2.5 outline-none text-xs placeholder:text-muted-foreground bg-secondary/60 border border-border focus:border-primary/50 transition-all"
            />
          </div>

          {/* Collection — dropdown */}
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <select
              value={collection}
              onChange={e => setCollection(e.target.value)}
              className="w-full rounded-xl pl-7 pr-3 py-2.5 outline-none text-xs bg-secondary/60 border border-border focus:border-primary/50 transition-all appearance-none cursor-pointer text-foreground"
            >
              <option value="">{s.collectionDropdown}</option>
              {collections.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Optional fields toggle */}
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showOptional ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {s.optional}
            {(type || status || importance) && <span className="ml-1 text-[9px] px-1 py-0 rounded-full bg-primary/10 text-primary">●</span>}
          </button>

          {showOptional && (
            <div className="space-y-3 pl-2 border-l-2 border-border/40">
              {/* Type */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">{s.typeLabel}</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setType("")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: type === "" ? "hsl(var(--primary)/0.1)" : "hsl(var(--secondary))",
                      color: type === "" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${type === "" ? "hsl(var(--primary)/0.3)" : "transparent"}`,
                    }}
                  >—</button>
                  {visibleTypes.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: type === t.value ? `${t.accent}15` : "hsl(var(--secondary))",
                        color: type === t.value ? t.accent : "hsl(var(--muted-foreground))",
                        border: `1px solid ${type === t.value ? `${t.accent}40` : "transparent"}`,
                      }}
                    >
                      <t.icon className="h-2.5 w-2.5" />
                      {s.types[t.value as keyof typeof s.types]}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowTypeAll(!showTypeAll)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    {showTypeAll ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">{s.statusLabel}</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setStatus("")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: status === "" ? "hsl(var(--primary)/0.1)" : "hsl(var(--secondary))",
                      color: status === "" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${status === "" ? "hsl(var(--primary)/0.3)" : "transparent"}`,
                    }}
                  >—</button>
                  {NOTE_STATUSES.map(st => (
                    <button
                      key={st.value}
                      onClick={() => setStatus(st.value)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: status === st.value ? `${st.color}15` : "hsl(var(--secondary))",
                        color: status === st.value ? st.color : "hsl(var(--muted-foreground))",
                        border: `1px solid ${status === st.value ? `${st.color}40` : "transparent"}`,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: status === st.value ? st.color : "hsl(var(--muted-foreground))" }} />
                      {s.statuses[st.value as keyof typeof s.statuses]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Importance */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">{s.importanceLabel}</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setImportance("")}
                    className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: importance === "" ? "hsl(var(--primary)/0.1)" : "hsl(var(--secondary))",
                      color: importance === "" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${importance === "" ? "hsl(var(--primary)/0.3)" : "transparent"}`,
                    }}
                  >—</button>
                  {(["normal", "high", "core"] as const).map(imp => {
                    const colors = { normal: "#94A3B8", high: "#F59E0B", core: "#EF4444" };
                    return (
                      <button
                        key={imp}
                        onClick={() => setImportance(imp)}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={{
                          background: importance === imp ? `${colors[imp]}15` : "hsl(var(--secondary))",
                          color: importance === imp ? colors[imp] : "hsl(var(--muted-foreground))",
                          border: `1px solid ${importance === imp ? `${colors[imp]}40` : "transparent"}`,
                        }}
                      >
                        {s.importance[imp]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Paperclip className="h-2.5 w-2.5" />
                {s.attachments}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
              >
                <Plus className="h-2.5 w-2.5" />
                {s.addFile}
              </button>
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
            {/* Existing attachments */}
            {!loadingAttachments && attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary/50 mb-1">
                <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-xs truncate">{att.fileName}</span>
                <a href={`/api/attachments/${att.id}/download`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Download">
                  <Download className="h-3 w-3" />
                </a>
                <button onClick={() => removeAttachment(att.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Pending (unsaved) files */}
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-primary/5 border border-primary/20 mb-1">
                <Paperclip className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="flex-1 text-xs truncate text-primary">{f.name}</span>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-muted-foreground hover:bg-secondary transition-colors"
          >
            {s.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-white"
            style={{ background: "linear-gradient(135deg, #F96D1C, #FB923C)" }}
          >
            {mutation.isPending ? s.saving : <><Check className="h-3.5 w-3.5" /> {s.save}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function NotesPanel({ bookId, aiPanelOpen }: { bookId: number; aiPanelOpen?: boolean }) {
  const { toast } = useToast();
  const { lang } = useLang();
  const s = NOTES_I18N[lang];

  const [showDialog, setShowDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | undefined>();
  const [dialogPrefill, setDialogPrefill] = useState("");
  const [dialogPrefillStatus, setDialogPrefillStatus] = useState("active");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [search, setSearch] = useState("");
  const [quickCapture, setQuickCapture] = useState("");
  const [quickCaptureType, setQuickCaptureType] = useState(0);
  const [sidebarView, setSidebarView] = useState<string>("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [customCollections, setCustomCollections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`moodra_custom_cols_${bookId}`) || "[]"); } catch { return []; }
  });
  const [sidebarWidth, setSidebarWidth] = useState(160);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSidebar = useRef(false);
  const quickCaptureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingSidebar.current || !sidebarContainerRef.current) return;
      const parentLeft = sidebarContainerRef.current.getBoundingClientRect().left;
      const w = Math.max(120, Math.min(300, e.clientX - parentLeft));
      setSidebarWidth(w);
    };
    const onUp = () => { isDraggingSidebar.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes`),
  });

  const { data: trashedNotes = [], isLoading: isLoadingTrash } = useQuery<Note[]>({
    queryKey: ["/api/books", bookId, "notes", "trash"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/notes/trash`),
    enabled: sidebarView === "trash",
  });

  const trashMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notes/${id}/trash`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: s.trashed });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notes/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes", "trash"] });
      toast({ title: s.restored });
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes", "trash"] });
      toast({ title: s.deletedForever });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: number; isPinned: string }) =>
      apiRequest("PATCH", `/api/notes/${id}`, { isPinned }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      toast({ title: vars.isPinned === "true" ? s.toastPinned : s.toastUnpinned });
    },
  });

  const quickCaptureMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
      setQuickCapture("");
      quickCaptureRef.current?.focus();
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const orderedNotes = localOrder
    ? localOrder.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[]
    : notes;

  const noteCollections = Array.from(new Set(
    notes.map(n => (n as any).collection).filter(Boolean)
  )) as string[];
  const collections = Array.from(new Set([...customCollections, ...noteCollections]));

  const addCustomCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || collections.includes(trimmed)) return;
    const updated = [...customCollections, trimmed];
    setCustomCollections(updated);
    try { localStorage.setItem(`moodra_custom_cols_${bookId}`, JSON.stringify(updated)); } catch {}
    setSidebarView(trimmed);
    setCollectionsOpen(true);
  };

  const deleteCollection = async (col: string) => {
    const updated = customCollections.filter(c => c !== col);
    setCustomCollections(updated);
    try { localStorage.setItem(`moodra_custom_cols_${bookId}`, JSON.stringify(updated)); } catch {}
    try {
      await apiRequest("POST", `/api/books/${bookId}/notes/trash-collection`, { collection: col });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "notes"] });
    } catch {}
    if (sidebarView === col) setSidebarView("all");
  };

  const inboxCount = notes.filter(n => (n as any).status === "inbox").length;
  const pinnedCount = notes.filter(n => (n as any).isPinned === "true").length;

  const searchLower = search.toLowerCase();
  const filtered = orderedNotes.filter(n => {
    if (sidebarView === "inbox" && (n as any).status !== "inbox") return false;
    if (sidebarView === "pinned" && (n as any).isPinned !== "true") return false;
    if (sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" && sidebarView !== "trash") {
      if ((n as any).collection !== sidebarView) return false;
    }
    if (filterType !== "all" && n.type !== filterType) return false;
    if (searchLower && !(
      n.title.toLowerCase().includes(searchLower) ||
      (n.content || "").toLowerCase().includes(searchLower) ||
      (n.tags || "").toLowerCase().includes(searchLower)
    )) return false;
    return true;
  });

  const sorted = sidebarView === "all"
    ? [...filtered].sort((a, b) => {
        const pa = (a as any).isPinned === "true" ? 1 : 0;
        const pb = (b as any).isPinned === "true" ? 1 : 0;
        return pb - pa;
      })
    : filtered;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedNotes.map(n => n.id);
    setLocalOrder(arrayMove(ids, ids.indexOf(active.id as number), ids.indexOf(over.id as number)));
  }, [orderedNotes]);

  const currentQcType = NOTE_TYPES[quickCaptureType % NOTE_TYPES.length];
  const QcIcon = currentQcType.icon;

  const handleQuickCapture = () => {
    const t = quickCapture.trim();
    if (!t) return;
    quickCaptureMutation.mutate({
      title: t, content: "", type: "",
      tags: "", color: "yellow", status: "inbox",
      collection: sidebarView !== "all" && sidebarView !== "inbox" && sidebarView !== "pinned" && sidebarView !== "trash" ? sidebarView : "",
    });
  };

  const isTrashView = sidebarView === "trash";
  const isEmptyView = filtered.length === 0 && notes.length === 0;
  const isEmptySearch = filtered.length === 0 && notes.length > 0;
  const gridCols = aiPanelOpen ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <StickyNote className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <h2 className="font-bold text-sm flex-1">{s.title}</h2>
        <span className="text-[11px] text-muted-foreground/50">{s.count(notes.length)}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground"
          >
            {viewMode === "cards" ? <LayoutList className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
          </button>
          {!isTrashView && (
            <button
              onClick={() => { setEditNote(undefined); setDialogPrefill(""); setDialogPrefillStatus("active"); setShowDialog(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C", border: "1px solid rgba(249,109,28,0.2)" }}
            >
              <Plus className="h-3 w-3" />
              {s.newBtn}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" ref={sidebarContainerRef}>
        {/* Left sidebar — resizable */}
        <div className="flex-shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-background/50 py-2 relative" style={{ width: sidebarWidth }}>
          {[
            { id: "all", label: s.allNotes, icon: Layers, count: notes.length },
            { id: "pinned", label: s.pinned, icon: Pin, count: pinnedCount },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSidebarView(item.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors rounded-none",
                sidebarView === item.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count > 0 && (
                <span className="text-[9px] px-1 rounded-full bg-muted text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}

          {/* Collections */}
          <div className="mt-1 border-t border-border/40 pt-1">
            <div className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <button
                onClick={() => setCollectionsOpen(!collectionsOpen)}
                className="flex items-center gap-1.5 flex-1 hover:text-muted-foreground transition-colors"
              >
                <FolderOpen className="h-2.5 w-2.5" />
                <span className="flex-1 text-left">{s.collections}</span>
                {collectionsOpen ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              <button
                onClick={() => { setShowNewColInput(true); setCollectionsOpen(true); setNewColName(""); }}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
            {collectionsOpen && (
              <div>
                {showNewColInput && (
                  <div className="flex items-center gap-1 px-3 py-1">
                    <input
                      autoFocus
                      value={newColName}
                      onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); }
                        if (e.key === "Escape") { setShowNewColInput(false); setNewColName(""); }
                      }}
                      placeholder="Collection name…"
                      className="flex-1 text-[11px] bg-secondary/60 border border-primary/40 rounded-md px-2 py-0.5 outline-none"
                    />
                    <button
                      onClick={() => { addCustomCollection(newColName); setShowNewColInput(false); setNewColName(""); }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {collections.map(col => (
                  <div
                    key={col}
                    className={cn(
                      "group w-full flex items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors",
                      sidebarView === col
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => setSidebarView(col)}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F96D1C" }} />
                      <span className="truncate flex-1">{col}</span>
                      <span className="text-[9px] text-muted-foreground/50">
                        {notes.filter(n => (n as any).collection === col).length}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteCollection(col)}
                      className="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {collections.length === 0 && !showNewColInput && (
                  <p className="px-4 py-2 text-[10px] text-muted-foreground/50">{s.noCollection}</p>
                )}
              </div>
            )}
          </div>

          {/* Trash */}
          <div className="mt-auto border-t border-border/40 pt-1">
            <button
              onClick={() => setSidebarView("trash")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                sidebarView === "trash"
                  ? "bg-destructive/10 text-destructive font-semibold"
                  : "text-muted-foreground/50 hover:bg-secondary/60 hover:text-muted-foreground"
              )}
            >
              <Trash2 className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{s.trash}</span>
            </button>
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={e => { isDraggingSidebar.current = true; e.preventDefault(); }}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-border/60 group-hover:bg-primary/40 transition-colors" />
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Trash view */}
          {isTrashView ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{s.trashDesc}</span>
                </div>
                {isLoadingTrash ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
                ) : trashedNotes.length === 0 ? (
                  <div className="text-center py-10">
                    <Trash2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-sm">{s.emptyInbox}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {trashedNotes.map(note => (
                      <div key={note.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-secondary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[12px] truncate text-foreground">{note.title}</h4>
                          {(note as any).deletedAt && (
                            <p className="text-[10px] text-muted-foreground/60">
                              {format(new Date((note as any).deletedAt), "d MMM yyyy", { locale: DATE_LOCALES[lang] })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => restoreMutation.mutate(note.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          {s.restore}
                        </button>
                        <button
                          onClick={() => hardDeleteMutation.mutate(note.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          {s.deleteForever}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Search + filter */}
              <div className="px-3 pt-2.5 pb-1.5 flex flex-col gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={s.searchPlaceholder}
                    className="w-full rounded-lg pl-7 pr-7 py-1.5 outline-none text-xs bg-secondary/60 border border-transparent focus:border-primary/25 transition-all placeholder:text-muted-foreground/50"
                  />
                  {search ? (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <button onClick={() => setShowFilters(!showFilters)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
                      <Filter className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {showFilters && (
                  <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
                    <button
                      onClick={() => setFilterType("all")}
                      className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 transition-colors"
                      style={{ background: filterType === "all" ? "#F96D1C" : "transparent", color: filterType === "all" ? "#fff" : "#888", border: "1px solid", borderColor: filterType === "all" ? "#F96D1C" : "#e5e7eb" }}
                    >
                      {s.all}
                    </button>
                    {NOTE_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setFilterType(t.value)}
                        className="text-[9px] px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0 flex items-center gap-0.5 transition-colors"
                        style={{
                          background: filterType === t.value ? `${t.accent}15` : "transparent",
                          color: filterType === t.value ? t.accent : "#888",
                          border: "1px solid", borderColor: filterType === t.value ? `${t.accent}40` : "#e5e7eb",
                        }}
                      >
                        <t.icon className="h-2 w-2" />
                        {s.types[t.value as keyof typeof s.types]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick capture */}
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 transition-all" style={{ borderColor: "#F96D1C22", background: "#FFF7F0" }}>
                  <button
                    onClick={() => setQuickCaptureType(prev => prev + 1)}
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ background: `${currentQcType.accent}18`, color: currentQcType.accent }}
                  >
                    <QcIcon className="h-2.5 w-2.5" />
                  </button>
                  <input
                    ref={quickCaptureRef}
                    value={quickCapture}
                    onChange={e => setQuickCapture(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && quickCapture.trim()) handleQuickCapture();
                      else if (e.key === "Tab" && quickCapture.trim()) {
                        e.preventDefault();
                        setDialogPrefill(quickCapture);
                        setDialogPrefillStatus("inbox");
                        setQuickCapture("");
                        setEditNote(undefined);
                        setShowDialog(true);
                      }
                      else if (e.key === "Escape") setQuickCapture("");
                    }}
                    placeholder={s.quickCapturePlaceholder}
                    className="flex-1 bg-transparent outline-none text-xs placeholder:text-orange-300/70 text-orange-900"
                  />
                  {quickCapture.trim() ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setDialogPrefill(quickCapture); setDialogPrefillStatus("inbox"); setQuickCapture(""); setEditNote(undefined); setShowDialog(true); }}
                        className="w-5 h-5 flex items-center justify-center rounded text-orange-400 hover:bg-orange-100 transition-colors"
                        title={s.quickCaptureExpand}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={handleQuickCapture}
                        disabled={quickCaptureMutation.isPending}
                        className="w-5 h-5 flex items-center justify-center rounded text-white transition-colors"
                        style={{ background: "#F96D1C" }}
                      >
                        <Zap className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-orange-300/50 flex-shrink-0">↵</span>
                  )}
                </div>
              </div>

              {/* Notes list/grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  {isLoading ? (
                    <div className={viewMode === "cards" ? `grid ${gridCols} gap-2` : "space-y-2"}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={viewMode === "cards" ? "bg-muted animate-pulse rounded-xl aspect-square" : "h-14 bg-muted animate-pulse rounded-xl"} />
                      ))}
                    </div>
                  ) : isEmptyView ? (
                    <div className="text-center py-10">
                      <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                      <h3 className="font-semibold text-sm mb-1">{s.emptyTitle}</h3>
                      <p className="text-muted-foreground text-xs max-w-[180px] mx-auto">{s.emptyDesc}</p>
                    </div>
                  ) : sidebarView === "inbox" && sorted.length === 0 ? (
                    <div className="text-center py-10">
                      <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                      <h3 className="font-semibold text-sm mb-1">{s.emptyInbox}</h3>
                      <p className="text-muted-foreground text-xs max-w-[180px] mx-auto">{s.emptyInboxDesc}</p>
                    </div>
                  ) : isEmptySearch ? (
                    <div className="text-center py-10">
                      <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-muted-foreground text-sm">{s.noResults}</p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sorted.map(n => n.id)} strategy={rectSortingStrategy}>
                        {viewMode === "cards" ? (
                          <div className={`grid ${gridCols} gap-2`}>
                            {sorted.map(note => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                                onTrash={id => trashMutation.mutate(id)}
                                onPin={n => pinMutation.mutate({ id: n.id, isPinned: (n as any).isPinned === "true" ? "false" : "true" })}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {sorted.map(note => (
                              <NoteRow
                                key={note.id}
                                note={note}
                                onEdit={n => { setEditNote(n); setDialogPrefill(""); setShowDialog(true); }}
                                onTrash={id => trashMutation.mutate(id)}
                                onPin={n => pinMutation.mutate({ id: n.id, isPinned: (n as any).isPinned === "true" ? "false" : "true" })}
                              />
                            ))}
                          </div>
                        )}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <NoteDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditNote(undefined); setDialogPrefill(""); }}
        bookId={bookId}
        note={editNote}
        prefillTitle={dialogPrefill}
        prefillStatus={dialogPrefillStatus}
        collections={collections}
      />
    </div>
  );
}
