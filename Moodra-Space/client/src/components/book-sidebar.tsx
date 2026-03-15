import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, BookOpen, Layers, AlignLeft, Eye,
  BookMarked, List, GripVertical
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CHAPTER_TYPES = [
  { value: "prologue",    label: "Пролог",       icon: BookMarked, indent: 0, color: "#a78bfa" },
  { value: "part",        label: "Часть",        icon: Layers,     indent: 0, color: "#8b5cf6" },
  { value: "chapter",     label: "Глава",        icon: BookOpen,   indent: 1, color: "#F96D1C" },
  { value: "subchapter",  label: "Подглава",     icon: AlignLeft,  indent: 2, color: "#f97316" },
  { value: "section",     label: "Раздел",       icon: List,       indent: 2, color: "#6b7280" },
  { value: "scene",       label: "Сцена",        icon: Eye,        indent: 3, color: "#94a3b8" },
  { value: "epilogue",    label: "Эпилог",       icon: BookMarked, indent: 0, color: "#a78bfa" },
];

function getTypeIcon(type: string) {
  const found = CHAPTER_TYPES.find(t => t.value === type);
  return found ? found.icon : BookOpen;
}

function getTypeColor(type: string) {
  const found = CHAPTER_TYPES.find(t => t.value === type);
  return found ? found.color : "#6b7280";
}

function getTypeIndent(type: string) {
  const found = CHAPTER_TYPES.find(t => t.value === type);
  return found ? found.indent : 1;
}

function getSubType(type: string): string | null {
  const map: Record<string, string> = {
    part: "chapter",
    chapter: "subchapter",
    subchapter: "section",
    section: "scene",
  };
  return map[type] ?? null;
}

interface Props {
  bookId: number;
  bookMode: string;
  chapters: Chapter[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function BookSidebar({ bookId, bookMode, chapters, selectedId, onSelect }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("chapter");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const addChapterMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/books/${bookId}/chapters`, data),
    onSuccess: (chapter: Chapter) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
      setAdding(false);
      setNewTitle("");
      onSelect(chapter.id);
    },
    onError: () => toast({ title: "Ошибка создания главы", variant: "destructive" }),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
    },
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addChapterMutation.mutate({
      title: newTitle.trim(),
      type: newType,
      order: chapters.length,
      level: getTypeIndent(newType),
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOverIdx(null);
    }
  };

  const handleDragEnter = () => {
    dragCounter.current += 1;
  };

  const handleDrop = async (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === toIdx) {
      setDraggedIdx(null);
      return;
    }
    const reordered = [...chapters];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setDraggedIdx(null);

    await Promise.all(
      reordered.map((ch, i) =>
        apiRequest("PATCH", `/api/chapters/${ch.id}`, { order: i })
      )
    );
    queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    dragCounter.current = 0;
  };

  return (
    <aside className="w-56 border-r border-border flex flex-col flex-shrink-0 bg-sidebar">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookMarked className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Содержание
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setAdding(!adding)}
              data-testid="button-add-chapter"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Добавить раздел</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1.5 px-1.5">
          {chapters.length === 0 && !adding && (
            <div className="px-2 py-6 text-center">
              <BookOpen className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Нет глав</p>
              <button
                className="text-xs text-primary mt-1 hover:underline"
                onClick={() => setAdding(true)}
              >
                Добавить первую главу
              </button>
            </div>
          )}

          {chapters.map((ch, idx) => {
            const Icon = getTypeIcon(ch.type || "chapter");
            const iconColor = getTypeColor(ch.type || "chapter");
            const indent = getTypeIndent(ch.type || "chapter");
            const isSelected = ch.id === selectedId;
            const isPart = (ch.type || "chapter") === "part";
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

            const subType = getSubType(ch.type || "chapter");

            return (
              <div
                key={ch.id}
                data-testid={`chapter-item-${ch.id}`}
                draggable
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm mb-0.5 ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                } ${isPart ? "mt-1" : ""}`}
                style={{
                  paddingLeft: `${8 + indent * 10}px`,
                  opacity: isDragging ? 0.4 : 1,
                  borderTop: isDragOver ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                  transition: "opacity 0.15s, border-color 0.1s",
                }}
                onClick={() => onSelect(ch.id)}
              >
                <GripVertical
                  className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing"
                  style={{ marginLeft: -2 }}
                />
                <Icon
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: isSelected ? "var(--primary)" : iconColor }}
                />
                <span className={`truncate flex-1 text-xs ${isPart ? "font-semibold" : "font-medium"}`}>
                  {ch.title}
                </span>
                {subType && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary flex-shrink-0 transition-opacity"
                        onClick={e => {
                          e.stopPropagation();
                          setNewType(subType);
                          setAdding(true);
                        }}
                        data-testid={`add-sub-${ch.id}`}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      + {CHAPTER_TYPES.find(t => t.value === subType)?.label}
                    </TooltipContent>
                  </Tooltip>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                  onClick={e => { e.stopPropagation(); deleteChapterMutation.mutate(ch.id); }}
                  data-testid={`delete-chapter-${ch.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* Add form */}
          {adding && (
            <div className="mt-2 px-1 space-y-2">
              <div className="flex gap-1 flex-wrap">
                {CHAPTER_TYPES.map(t => {
                  const TIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        newType === t.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <TIcon className="h-2.5 w-2.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <Input
                data-testid="input-chapter-title"
                placeholder="Название..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                className="h-7 text-xs bg-background"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 text-xs flex-1"
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  data-testid="button-confirm-add-chapter"
                >
                  Добавить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => { setAdding(false); setNewTitle(""); }}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {chapters.length} {chapters.length === 1 ? "глава" : chapters.length < 5 ? "главы" : "глав"}
        </div>
      </div>
    </aside>
  );
}
