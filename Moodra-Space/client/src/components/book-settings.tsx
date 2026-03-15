import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import { Settings, Save, Trash2, FlaskConical, Feather, Check, ImagePlus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const BOOKSETTINGS_I18N = {
  en: {
    title: "Book Settings",
    subtitle: "General parameters",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    save: "Save",
    untitled: "Untitled",
    fiction: "Fiction",
    nonfiction: "Non-fiction",
    basicInfo: "Basic Information",
    bookTitle: "Book title",
    titlePlaceholder: "Title…",
    descLabel: "Description",
    descPlaceholder: "Brief description of the book…",
    typeAndGenre: "Type & Genre",
    bookMode: "Book mode",
    modeScientific: "Non-fic.",
    modeFiction: "Fiction",
    genreLabel: "Genre",
    genrePlaceholder: "Book genre",
    languageSection: "Writing Language",
    coverSection: "Cover",
    coverImageLabel: "Cover image",
    uploadCover: "Upload\ncover",
    replaceCover: "Replace",
    removeCover: "Remove",
    coverColorLabel: "Cover colour",
    dangerZone: "Danger zone",
    deleteBook: "Delete book",
    deleteDesc: "This action is irreversible. All chapters and data will be deleted.",
    deleteBtn: "Delete",
    deleteDialogTitle: "Delete book?",
    deleteDialogDesc: (title: string) => `The book "${title}" and all its chapters will be permanently deleted. This cannot be undone.`,
    cancel: "Cancel",
    deleteForever: "Delete forever",
    settingsSaved: "Settings saved",
    saveError: "Save error",
    coverError: "Cover upload error",
  },
  ru: {
    title: "Настройки книги",
    subtitle: "Основные параметры",
    unsaved: "Есть изменения",
    saving: "Сохраняю…",
    save: "Сохранить",
    untitled: "Без названия",
    fiction: "Художественная",
    nonfiction: "Научная",
    basicInfo: "Основная информация",
    bookTitle: "Название книги",
    titlePlaceholder: "Название…",
    descLabel: "Описание",
    descPlaceholder: "Краткое описание книги…",
    typeAndGenre: "Тип и жанр",
    bookMode: "Режим книги",
    modeScientific: "Научная",
    modeFiction: "Худож.",
    genreLabel: "Жанр",
    genrePlaceholder: "Жанр книги",
    languageSection: "Язык",
    coverSection: "Обложка",
    coverImageLabel: "Изображение обложки",
    uploadCover: "Загрузить\nобложку",
    replaceCover: "Заменить",
    removeCover: "Удалить",
    coverColorLabel: "Цвет обложки",
    dangerZone: "Опасная зона",
    deleteBook: "Удалить книгу",
    deleteDesc: "Это действие необратимо. Все главы и данные будут удалены.",
    deleteBtn: "Удалить",
    deleteDialogTitle: "Удалить книгу?",
    deleteDialogDesc: (title: string) => `Книга «${title}» и все её главы будут удалены навсегда. Это действие нельзя отменить.`,
    cancel: "Отмена",
    deleteForever: "Удалить навсегда",
    settingsSaved: "Настройки сохранены",
    saveError: "Ошибка сохранения",
    coverError: "Ошибка загрузки обложки",
  },
  ua: {
    title: "Налаштування книги",
    subtitle: "Основні параметри",
    unsaved: "Є зміни",
    saving: "Зберігаю…",
    save: "Зберегти",
    untitled: "Без назви",
    fiction: "Художня",
    nonfiction: "Наукова",
    basicInfo: "Основна інформація",
    bookTitle: "Назва книги",
    titlePlaceholder: "Назва…",
    descLabel: "Опис",
    descPlaceholder: "Короткий опис книги…",
    typeAndGenre: "Тип та жанр",
    bookMode: "Режим книги",
    modeScientific: "Наукова",
    modeFiction: "Худож.",
    genreLabel: "Жанр",
    genrePlaceholder: "Жанр книги",
    languageSection: "Мова",
    coverSection: "Обкладинка",
    coverImageLabel: "Зображення обкладинки",
    uploadCover: "Завантажити\nобкладинку",
    replaceCover: "Замінити",
    removeCover: "Видалити",
    coverColorLabel: "Колір обкладинки",
    dangerZone: "Небезпечна зона",
    deleteBook: "Видалити книгу",
    deleteDesc: "Ця дія незворотна. Всі розділи і дані будуть видалені.",
    deleteBtn: "Видалити",
    deleteDialogTitle: "Видалити книгу?",
    deleteDialogDesc: (title: string) => `Книга «${title}» та всі її розділи будуть видалені назавжди. Цю дію не можна скасувати.`,
    cancel: "Скасувати",
    deleteForever: "Видалити назавжди",
    settingsSaved: "Налаштування збережено",
    saveError: "Помилка збереження",
    coverError: "Помилка завантаження обкладинки",
  },
  de: {
    title: "Bucheinstellungen",
    subtitle: "Allgemeine Parameter",
    unsaved: "Ungespeicherte Änderungen",
    saving: "Speichere…",
    save: "Speichern",
    untitled: "Ohne Titel",
    fiction: "Belletristik",
    nonfiction: "Sachbuch",
    basicInfo: "Grundinformationen",
    bookTitle: "Buchtitel",
    titlePlaceholder: "Titel…",
    descLabel: "Beschreibung",
    descPlaceholder: "Kurzbeschreibung des Buches…",
    typeAndGenre: "Typ & Genre",
    bookMode: "Buchmodus",
    modeScientific: "Sachbuch",
    modeFiction: "Belletr.",
    genreLabel: "Genre",
    genrePlaceholder: "Buchgenre",
    languageSection: "Sprache",
    coverSection: "Cover",
    coverImageLabel: "Coverbild",
    uploadCover: "Cover\nhochladen",
    replaceCover: "Ersetzen",
    removeCover: "Entfernen",
    coverColorLabel: "Coverfarbe",
    dangerZone: "Gefahrenzone",
    deleteBook: "Buch löschen",
    deleteDesc: "Diese Aktion ist unwiderruflich. Alle Kapitel und Daten werden gelöscht.",
    deleteBtn: "Löschen",
    deleteDialogTitle: "Buch löschen?",
    deleteDialogDesc: (title: string) => `Das Buch „${title}" und alle seine Kapitel werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.`,
    cancel: "Abbrechen",
    deleteForever: "Für immer löschen",
    settingsSaved: "Einstellungen gespeichert",
    saveError: "Speicherfehler",
    coverError: "Cover-Upload-Fehler",
  },
};

const COVER_COLORS = [
  "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#FF3B30",
  "#FF9500", "#FFCC00", "#34C759", "#00C7BE", "#30B0C7",
  "#1C1C1E", "#2C2C2E", "#48484A", "#636366",
];

const BOOK_LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

export function BookSettings({ book }: { book: Book }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { lang } = useLang();
  const s = BOOKSETTINGS_I18N[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(book.title);
  const [description, setDescription] = useState(book.description || "");
  const [mode, setMode] = useState(book.mode || "scientific");
  const [genre, setGenre] = useState(book.genre || "");
  const [language, setLanguage] = useState(book.language || "ru");
  const [coverColor, setCoverColor] = useState(book.coverColor || "#007AFF");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const updated = await apiRequest("PATCH", `/api/books/${book.id}`, data);
      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        const res = await fetch(`/api/books/${book.id}/cover`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(s.coverError);
      }
      return updated;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/books", book.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDirty(false);
      setCoverFile(null);
      setCoverPreview(null);
      toast({ title: s.settingsSaved });
    },
    onError: () => toast({ title: s.saveError, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/books/${book.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      navigate("/");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ title: title.trim(), description, mode, genre, language, coverColor });
  };

  const mark = () => setIsDirty(true);

  const handleFile = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const clearCoverImage = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setIsDirty(true);
    updateMutation.mutate({ title: title.trim(), description, mode, genre, language, coverColor, coverImage: "" });
  };

  const currentCover = coverPreview || book.coverImage || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2 tracking-tight">
            <Settings className="h-5 w-5 text-primary" />
            {s.title}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{s.subtitle}</p>
        </div>
        <div className="flex gap-2 items-center">
          {isDirty && (
            <Badge variant="secondary" className="text-xs h-7 px-2">{s.unsaved}</Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="gap-2 rounded-xl"
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? s.saving : s.save}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Book preview */}
          <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
            <div
              className="w-16 h-20 rounded-xl flex items-center justify-center shadow-apple overflow-hidden flex-shrink-0"
              style={currentCover ? {} : { background: `linear-gradient(145deg, ${coverColor}99, ${coverColor})` }}
            >
              {currentCover ? (
                <img src={currentCover} alt={title} className="w-full h-full object-cover" />
              ) : mode === "fiction" ? (
                <Feather className="h-7 w-7 text-white/80" />
              ) : (
                <FlaskConical className="h-7 w-7 text-white/80" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">{title || s.untitled}</h3>
              {description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{description}</p>}
              <Badge variant="secondary" className="text-xs mt-2">
                {mode === "fiction" ? s.fiction : s.nonfiction}
              </Badge>
            </div>
          </div>

          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">{s.basicInfo}</h3>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{s.bookTitle}</Label>
              <Input
                data-testid="input-settings-title"
                value={title}
                onChange={e => { setTitle(e.target.value); mark(); }}
                placeholder={s.titlePlaceholder}
                className="bg-background rounded-xl h-11 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{s.descLabel}</Label>
              <Textarea
                value={description}
                onChange={e => { setDescription(e.target.value); mark(); }}
                placeholder={s.descPlaceholder}
                rows={3}
                className="bg-background rounded-xl resize-none border-border"
              />
            </div>
          </div>

          {/* Mode & Genre */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">{s.typeAndGenre}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{s.bookMode}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "scientific", label: s.modeScientific, icon: FlaskConical },
                    { value: "fiction",    label: s.modeFiction,    icon: Feather },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => { setMode(m.value); mark(); }}
                        data-testid={`settings-mode-${m.value}`}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                          mode === m.value ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {m.label}
                        {mode === m.value && <Check className="h-3 w-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{s.genreLabel}</Label>
                <Input
                  value={genre}
                  onChange={e => { setGenre(e.target.value); mark(); }}
                  placeholder={s.genrePlaceholder}
                  className="bg-background rounded-xl h-11 border-border"
                />
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">{s.languageSection}</h3>
            <Select value={language} onValueChange={v => { setLanguage(v); mark(); }}>
              <SelectTrigger className="bg-background rounded-xl h-11" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOK_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">{s.coverSection}</h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{s.coverImageLabel}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              {currentCover ? (
                <div className="relative w-32 h-40 rounded-2xl overflow-hidden shadow-apple">
                  <img src={currentCover} alt={s.coverSection} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition-all opacity-0 hover:opacity-100">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-white/90 text-black px-2.5 py-1 rounded-full font-medium"
                    >
                      {s.replaceCover}
                    </button>
                    <button
                      onClick={clearCoverImage}
                      className="text-xs bg-red-500/90 text-white px-2.5 py-1 rounded-full font-medium"
                    >
                      {s.removeCover}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-cover-settings"
                  className="w-32 h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium text-center leading-tight whitespace-pre-line">{s.uploadCover}</span>
                </button>
              )}
            </div>

            {!currentCover && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{s.coverColorLabel}</Label>
                <div className="flex gap-2 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full transition-all ${
                        coverColor === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c, outlineColor: c }}
                      onClick={() => { setCoverColor(c); mark(); }}
                      data-testid={`color-${c.replace("#", "")}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-xs text-destructive uppercase tracking-widest">{s.dangerZone}</h3>
            <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <div>
                <p className="font-medium text-sm">{s.deleteBook}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.deleteDesc}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2 ml-4 rounded-xl" data-testid="button-delete-book">
                    <Trash2 className="h-4 w-4" />
                    {s.deleteBtn}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-card-border rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{s.deleteDialogTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {s.deleteDialogDesc(book.title)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">{s.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                      onClick={() => deleteMutation.mutate()}
                      data-testid="button-confirm-delete-book"
                    >
                      {s.deleteForever}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
