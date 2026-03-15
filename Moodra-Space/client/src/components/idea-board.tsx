import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLang } from "@/contexts/language-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { cn } from "@/lib/utils";
import {
  Plus, ZoomIn, ZoomOut, Maximize2, Trash2, Edit2, X, Check,
  Lightbulb, FlaskConical, BookOpen, Layers, FileText, Brain, Link,
  Sparkles, MessageSquare, Quote, Users, Map, ArrowRight, Filter,
  Tag, Search, ChevronRight, Crosshair, Wand2, GitBranch,
  Shuffle, Grid, List, Eye, EyeOff, PanelLeft, PanelRight,
  MoreHorizontal, AlignLeft, Compass
} from "lucide-react";
import type { Book } from "@shared/schema";

type NodeType = "idea" | "concept" | "chapter" | "hypothesis" | "argument" | "counterargument" | "quote" | "source" | "character" | "plot";
type EdgeType = "support" | "contradict" | "cause" | "develop" | "effect";

interface BoardNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  tags: string[];
  x: number;
  y: number;
  w?: number;
  h?: number;
  color?: string;
}

interface BoardEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: EdgeType;
}

interface BoardData {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

const IDEA_BOARD_I18N: Record<string, Record<string, string>> = {
  en: {
    idea: "Idea", concept: "Concept", chapter: "Chapter", hypothesis: "Hypothesis", argument: "Argument",
    counterargument: "Counter-\nargument", quote: "Quote", source: "Source", character: "Character", plot: "Plot",
    support: "Supports", contradict: "Contradicts", cause: "Cause", develop: "Develops", effect: "Effect",
    search: "Search...", cardType: "Card type", all: "All",
    doubleClickToAdd: "Double click on the board to add", noMatches: "No matches",
    newCard: "New card", leftPanel: "Left panel", connectionType: "Connection type when linking",
    aiIdeas: "AI ideas", aiSuggestions: "AI suggestions", basedOnSelected: "Based on selected cards",
    generating: "Generating...", refreshSuggestions: "Refresh suggestions", addToBoard: "Add to board",
    pressRefresh: "Press \"Refresh\" to generate ideas", ideaAdded: "Idea added to board",
    autoArrange: "Auto arrange", hideLabels: "Hide labels", showLabels: "Show labels",
    zoomIn: "Zoom in", zoomOut: "Zoom out", fitAll: "Fit to screen",
    cards: "cards", connections: "connections",
    properties: "Properties", title: "Title", description: "Description", tags: "Tags",
    connectionsLabel: "Connections", edit: "Edit", deleteLabel: "Delete",
    cardTitle: "Card title...", descOptional: "Description (optional)...",
    tagsPlaceholder: "Tags separated by commas: idea, plot, character",
    tagsEdit: "Tags (comma separated)", save: "Save", add: "Add", cancel: "Cancel",
    editNode: "Edit", deleteNode: "Delete", drawConnection: "Draw connection", resize: "Resize",
    saveError: "Save error", aiError: "AI Error",
  },
  ru: {
    idea: "Идея", concept: "Концепция", chapter: "Глава", hypothesis: "Гипотеза", argument: "Аргумент",
    counterargument: "Контр.\nаргумент", quote: "Цитата", source: "Источник", character: "Персонаж", plot: "Сюжет",
    support: "Поддерживает", contradict: "Противоречит", cause: "Причина", develop: "Развивает", effect: "Следствие",
    search: "Поиск...", cardType: "Тип карточки", all: "Все",
    doubleClickToAdd: "Двойной клик на доске для добавления", noMatches: "Нет совпадений",
    newCard: "Новая карточка", leftPanel: "Левая панель", connectionType: "Тип связи при соединении",
    aiIdeas: "AI идеи", aiSuggestions: "AI-предложения", basedOnSelected: "На основе выбранных карточек",
    generating: "Генерирую...", refreshSuggestions: "Обновить предложения", addToBoard: "Добавить на доску",
    pressRefresh: "Нажмите «Обновить» для генерации идей", ideaAdded: "Идея добавлена на доску",
    autoArrange: "Автоупорядочить", hideLabels: "Скрыть подписи", showLabels: "Показать подписи",
    zoomIn: "Увеличить", zoomOut: "Уменьшить", fitAll: "По размеру экрана",
    cards: "карточек", connections: "связей",
    properties: "Свойства", title: "Название", description: "Описание", tags: "Теги",
    connectionsLabel: "Связи", edit: "Редактировать", deleteLabel: "Удалить",
    cardTitle: "Название карточки...", descOptional: "Описание (необязательно)...",
    tagsPlaceholder: "Теги через запятую: идея, сюжет, персонаж",
    tagsEdit: "Теги (через запятую)", save: "Сохранить", add: "Добавить", cancel: "Отмена",
    editNode: "Редактировать", deleteNode: "Удалить", drawConnection: "Провести связь", resize: "Изменить размер",
    saveError: "Ошибка сохранения", aiError: "Ошибка AI",
  },
  ua: {
    idea: "Ідея", concept: "Концепція", chapter: "Глава", hypothesis: "Гіпотеза", argument: "Аргумент",
    counterargument: "Контр-\nаргумент", quote: "Цитата", source: "Джерело", character: "Персонаж", plot: "Сюжет",
    support: "Підтримує", contradict: "Суперечить", cause: "Причина", develop: "Розвиває", effect: "Наслідок",
    search: "Пошук...", cardType: "Тип картки", all: "Всі",
    doubleClickToAdd: "Подвійний клік на дошці для додавання", noMatches: "Немає збігів",
    newCard: "Нова картка", leftPanel: "Ліва панель", connectionType: "Тип зв'язку при з'єднанні",
    aiIdeas: "AI ідеї", aiSuggestions: "AI-пропозиції", basedOnSelected: "На основі вибраних карток",
    generating: "Генерую...", refreshSuggestions: "Оновити пропозиції", addToBoard: "Додати на дошку",
    pressRefresh: "Натисніть «Оновити» для генерації ідей", ideaAdded: "Ідею додано на дошку",
    autoArrange: "Автовпорядкувати", hideLabels: "Сховати підписи", showLabels: "Показати підписи",
    zoomIn: "Збільшити", zoomOut: "Зменшити", fitAll: "За розміром екрана",
    cards: "карток", connections: "зв'язків",
    properties: "Властивості", title: "Назва", description: "Опис", tags: "Теги",
    connectionsLabel: "Зв'язки", edit: "Редагувати", deleteLabel: "Видалити",
    cardTitle: "Назва картки...", descOptional: "Опис (необов'язково)...",
    tagsPlaceholder: "Теги через кому: ідея, сюжет, персонаж",
    tagsEdit: "Теги (через кому)", save: "Зберегти", add: "Додати", cancel: "Скасувати",
    editNode: "Редагувати", deleteNode: "Видалити", drawConnection: "Провести зв'язок", resize: "Змінити розмір",
    saveError: "Помилка збереження", aiError: "Помилка AI",
  },
  de: {
    idea: "Idee", concept: "Konzept", chapter: "Kapitel", hypothesis: "Hypothese", argument: "Argument",
    counterargument: "Gegen-\nargument", quote: "Zitat", source: "Quelle", character: "Figur", plot: "Handlung",
    support: "Unterstützt", contradict: "Widerspricht", cause: "Ursache", develop: "Entwickelt", effect: "Wirkung",
    search: "Suche...", cardType: "Kartentyp", all: "Alle",
    doubleClickToAdd: "Doppelklick zum Hinzufügen", noMatches: "Keine Treffer",
    newCard: "Neue Karte", leftPanel: "Linkes Panel", connectionType: "Verbindungstyp beim Verknüpfen",
    aiIdeas: "KI-Ideen", aiSuggestions: "KI-Vorschläge", basedOnSelected: "Basierend auf ausgewählten Karten",
    generating: "Generiere...", refreshSuggestions: "Vorschläge aktualisieren", addToBoard: "Zum Board hinzufügen",
    pressRefresh: "Klicken Sie auf \"Aktualisieren\" um Ideen zu generieren", ideaAdded: "Idee zum Board hinzugefügt",
    autoArrange: "Auto-Anordnung", hideLabels: "Beschriftungen ausblenden", showLabels: "Beschriftungen anzeigen",
    zoomIn: "Vergrößern", zoomOut: "Verkleinern", fitAll: "An Bildschirm anpassen",
    cards: "Karten", connections: "Verbindungen",
    properties: "Eigenschaften", title: "Titel", description: "Beschreibung", tags: "Tags",
    connectionsLabel: "Verbindungen", edit: "Bearbeiten", deleteLabel: "Löschen",
    cardTitle: "Kartentitel...", descOptional: "Beschreibung (optional)...",
    tagsPlaceholder: "Tags durch Komma getrennt: Idee, Handlung, Figur",
    tagsEdit: "Tags (kommagetrennt)", save: "Speichern", add: "Hinzufügen", cancel: "Abbrechen",
    editNode: "Bearbeiten", deleteNode: "Löschen", drawConnection: "Verbindung ziehen", resize: "Größe ändern",
    saveError: "Speicherfehler", aiError: "KI-Fehler",
  },
};

const NODE_TYPE_KEYS: Record<NodeType, string> = {
  idea: "idea", concept: "concept", chapter: "chapter", hypothesis: "hypothesis", argument: "argument",
  counterargument: "counterargument", quote: "quote", source: "source", character: "character", plot: "plot",
};

const EDGE_TYPE_KEYS: Record<EdgeType, string> = {
  support: "support", contradict: "contradict", cause: "cause", develop: "develop", effect: "effect",
};

const NODE_CONFIGS: Record<NodeType, {
  bg: string; border: string; text: string; icon: any; accentColor: string;
}> = {
  idea:           { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", icon: Lightbulb,    accentColor: "#F59E0B" },
  concept:        { bg: "#F5F3FF", border: "#C4B5FD", text: "#6D28D9", icon: Layers,       accentColor: "#8B5CF6" },
  chapter:        { bg: "#FEF3EC", border: "#FDBA74", text: "#9A3412", icon: FileText,     accentColor: "#F96D1C" },
  hypothesis:     { bg: "#EEF4FF", border: "#93C5FD", text: "#1E40AF", icon: FlaskConical, accentColor: "#3B82F6" },
  argument:       { bg: "#F0FDF4", border: "#86EFAC", text: "#166534", icon: Check,        accentColor: "#22C55E" },
  counterargument:{ bg: "#FFF1F2", border: "#FDA4AF", text: "#9F1239", icon: X,            accentColor: "#F43F5E" },
  quote:          { bg: "#F0F9FF", border: "#7DD3FC", text: "#0C4A6E", icon: Quote,        accentColor: "#0EA5E9" },
  source:         { bg: "#F0FDF4", border: "#6EE7B7", text: "#064E3B", icon: BookOpen,     accentColor: "#10B981" },
  character:      { bg: "#FDF4FF", border: "#E879F9", text: "#701A75", icon: Users,        accentColor: "#D946EF" },
  plot:           { bg: "#FFF7ED", border: "#FDBA74", text: "#7C2D12", icon: Map,          accentColor: "#EA580C" },
};

const EDGE_CONFIGS: Record<EdgeType, { stroke: string; dash?: string }> = {
  support:    { stroke: "#22C55E" },
  contradict: { stroke: "#EF4444", dash: "6,4" },
  cause:      { stroke: "#3B82F6" },
  develop:    { stroke: "#F59E0B" },
  effect:     { stroke: "#8B5CF6" },
};

const NODE_W = 220;
const NODE_H = 110;

function uid() { return Math.random().toString(36).slice(2, 10); }

function getNodeSize(node: BoardNode) {
  return { w: node.w || NODE_W, h: node.h || NODE_H };
}

export function IdeaBoard({ bookId, book }: { bookId: number; book: Book }) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { lang } = useLang();
  const s = IDEA_BOARD_I18N[lang] || IDEA_BOARD_I18N.en;

  const [board, setBoard] = useState<BoardData>({ nodes: [], edges: [] });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectMouse, setConnectMouse] = useState({ x: 0, y: 0 });
  const [resizingNode, setResizingNode] = useState<{
    id: string; startX: number; startY: number; startW: number; startH: number;
  } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [newEdgeType, setNewEdgeType] = useState<EdgeType>("develop");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState<{ x: number; y: number } | null>(null);
  const [addForm, setAddForm] = useState({ title: "", content: "", type: "idea" as NodeType, tags: "" });
  const [editForm, setEditForm] = useState({ title: "", content: "", tags: "", type: "idea" as NodeType });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [freeGateOpen, setFreeGateOpen] = useState(false);
  const { isFreeMode } = useFreeMode();
  const [, setLocation] = useLocation();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [showLabels, setShowLabels] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: boardData } = useQuery<{ data: string }>({
    queryKey: ["/api/books", bookId, "board"],
    queryFn: () => apiRequest("GET", `/api/books/${bookId}/board`),
  });

  useEffect(() => {
    if (boardData?.data) {
      try {
        const parsed = JSON.parse(boardData.data);
        if (parsed.nodes) setBoard(parsed);
      } catch {}
    }
  }, [boardData]);

  const saveMutation = useMutation({
    mutationFn: (data: string) => apiRequest("PATCH", `/api/books/${bookId}/board`, { data }),
    onError: () => toast({ title: s.saveError, variant: "destructive" }),
  });

  const scheduleAutoSave = useCallback((nextBoard: BoardData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate(JSON.stringify(nextBoard));
    }, 1500);
  }, [saveMutation]);

  const updateBoard = useCallback((updater: (prev: BoardData) => BoardData) => {
    setBoard(prev => {
      const next = updater(prev);
      scheduleAutoSave(next);
      return next;
    });
  }, [scheduleAutoSave]);

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".board-node")) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    setShowAddDialog({ x, y });
    setAddForm({ title: "", content: "", type: "idea", tags: "" });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".board-node")) return;
    if (e.button !== 0) return;
    setSelectedNodes(new Set());
    setSelectedEdge(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPanOrigin({ x: pan.x, y: pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panOrigin.x + (e.clientX - panStart.x),
        y: panOrigin.y + (e.clientY - panStart.y),
      });
    }
    if (draggingNode) {
      const { x, y } = toCanvas(e.clientX, e.clientY);
      updateBoard(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNode
            ? { ...n, x: x - draggingOffset.x, y: y - draggingOffset.y }
            : n
        ),
      }));
    }
    if (resizingNode) {
      const dx = (e.clientX - resizingNode.startX) / zoom;
      const dy = (e.clientY - resizingNode.startY) / zoom;
      const newW = Math.max(160, resizingNode.startW + dx);
      const newH = Math.max(80, resizingNode.startH + dy);
      updateBoard(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === resizingNode.id ? { ...n, w: newW, h: newH } : n
        ),
      }));
    }
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) setConnectMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    setConnectingFrom(null);
    setResizingNode(null);
  };

  const handleResizeStart = (e: React.MouseEvent, node: BoardNode) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startW: getNodeSize(node).w,
      startH: getNodeSize(node).h,
    });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (editingNode === nodeId) return;
    const { x, y } = toCanvas(e.clientX, e.clientY);
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingOffset({ x: x - node.x, y: y - node.y });
    setDraggingNode(nodeId);
    if (e.shiftKey) {
      setSelectedNodes(prev => {
        const next = new Set(prev);
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
        return next;
      });
    } else {
      setSelectedNodes(new Set([nodeId]));
      if (selectedNodes.size !== 1 || !selectedNodes.has(nodeId)) {
        setShowRightPanel(true);
      }
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      const existing = board.edges.find(
        ed => (ed.from === connectingFrom && ed.to === nodeId) || (ed.from === nodeId && ed.to === connectingFrom)
      );
      if (!existing) {
        updateBoard(prev => ({
          ...prev,
          edges: [...prev.edges, { id: uid(), from: connectingFrom!, to: nodeId, label: "", type: newEdgeType }],
        }));
      }
      setConnectingFrom(null);
      return;
    }
    e.stopPropagation();
    setSelectedNodes(new Set([nodeId]));
    setShowRightPanel(true);
  };

  const handleConnectStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingFrom(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setConnectMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const deleteNode = (nodeId: string) => {
    updateBoard(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
    }));
    setSelectedNodes(new Set());
    setShowRightPanel(false);
  };

  const startEdit = (nodeId: string) => {
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setEditingNode(nodeId);
    setEditForm({ title: node.title, content: node.content, tags: (node.tags || []).join(", "), type: node.type });
  };

  const saveEdit = () => {
    if (!editingNode) return;
    const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateBoard(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === editingNode
          ? { ...n, title: editForm.title, content: editForm.content, tags, type: editForm.type }
          : n
      ),
    }));
    setEditingNode(null);
  };

  const addNode = () => {
    if (!showAddDialog || !addForm.title.trim()) return;
    const tags = addForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const newNode: BoardNode = {
      id: uid(),
      type: addForm.type,
      title: addForm.title.trim(),
      content: addForm.content,
      tags,
      x: showAddDialog.x - NODE_W / 2,
      y: showAddDialog.y - NODE_H / 2,
    };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setShowAddDialog(null);
  };

  const addNodeFromSidebar = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (rect.width / 2 - pan.x) / zoom;
    const y = (rect.height / 2 - pan.y) / zoom;
    setShowAddDialog({ x, y });
    setAddForm({ title: "", content: "", type: "idea", tags: "" });
  };

  const deleteEdge = (edgeId: string) => {
    updateBoard(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));
    setSelectedEdge(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(3, Math.max(0.25, zoom * factor));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  };

  const fitAll = () => {
    if (board.nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const xs = board.nodes.map(n => n.x);
    const ys = board.nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs) + NODE_W;
    const minY = Math.min(...ys), maxY = Math.max(...ys) + NODE_H;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const padding = 60;
    const scaleX = (rect.width - padding * 2) / (maxX - minX || 1);
    const scaleY = (rect.height - padding * 2) / (maxY - minY || 1);
    const newZoom = Math.min(scaleX, scaleY, 1.2);
    setZoom(newZoom);
    setPan({
      x: (rect.width - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (rect.height - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    });
  };

  const focusNode = (nodeId: string) => {
    const node = board.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const targetZoom = Math.min(zoom, 1);
    setPan({
      x: rect.width / 2 - (node.x + NODE_W / 2) * targetZoom,
      y: rect.height / 2 - (node.y + NODE_H / 2) * targetZoom,
    });
    setZoom(targetZoom);
    setSelectedNodes(new Set([nodeId]));
    setShowRightPanel(true);
  };

  const getNodeCenter = (node: BoardNode) => ({
    x: (node.x + getNodeSize(node).w / 2) * zoom + pan.x,
    y: (node.y + getNodeSize(node).h / 2) * zoom + pan.y,
  });

  const getEdgePath = (edge: BoardEdge) => {
    const fromNode = board.nodes.find(n => n.id === edge.from);
    const toNode = board.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;
    const from = getNodeCenter(fromNode);
    const to = getNodeCenter(toNode);
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const cx = (from.x + to.x) / 2 + dy * 0.2;
    const cy = (from.y + to.y) / 2 - dx * 0.2;
    const mx = (from.x + cx + to.x) / 3;
    const my = (from.y + cy + to.y) / 3;
    return { from, to, mx, my, path: `M ${from.x},${from.y} Q ${cx},${cy} ${to.x},${to.y}`, dist };
  };

  const callAiSuggest = useCallback(async () => {
    if (isFreeMode) {
      setFreeGateOpen(true);
      return;
    }
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const selectedNodesList = board.nodes.filter(n => selectedNodes.has(n.id));
      const allNodes = board.nodes;
      const context = allNodes.map(n => `${n.type}: ${n.title}${n.content ? ` — ${n.content}` : ""}`).join("\n");
      const selection = selectedNodesList.length > 0
        ? `\nВыбранные карточки:\n${selectedNodesList.map(n => `${n.type}: ${n.title}`).join("\n")}`
        : "";
      const response = await apiRequest("POST", "/api/ai/generate", {
        mode: "ideas",
        bookTitle: book.title,
        bookMode: book.mode,
        chapterTitle: "Idea board",
        lang,
        content: context + selection,
        instruction: selectedNodesList.length > 0
          ? `Предложи 4 новые идеи или концепции, связанные с выбранными карточками и темой книги "${book.title}". Ответ: список из 4 коротких идей (одна строка каждая, без нумерации).`
          : `Предложи 4 новые идеи для книги "${book.title}" на основе уже существующих карточек. Ответ: список из 4 коротких идей (одна строка каждая, без нумерации).`,
      });

      const text = typeof response === "string" ? response : JSON.stringify(response);
      const lines = text.split("\n").map((l: string) => l.replace(/^[-•*\d.]+\s*/, "").trim()).filter((l: string) => l.length > 5).slice(0, 4);
      setAiSuggestions(lines);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: s.aiError, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  }, [board.nodes, selectedNodes, book, toast]);

  const addSuggestionAsNode = (text: string) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const baseX = (rect.width / 2 - pan.x) / zoom + (Math.random() - 0.5) * 300;
    const baseY = (rect.height / 2 - pan.y) / zoom + (Math.random() - 0.5) * 200;
    const newNode: BoardNode = {
      id: uid(), type: "idea", title: text, content: "", tags: [],
      x: baseX - NODE_W / 2, y: baseY - NODE_H / 2,
    };
    updateBoard(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setAiSuggestions(prev => prev.filter(item => item !== text));
    toast({ title: s.ideaAdded });
  };

  const filteredNodes = useMemo(() => {
    return board.nodes.filter(n => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [board.nodes, filterType, searchQuery]);

  const selectedNode = board.nodes.find(n => selectedNodes.size === 1 && selectedNodes.has(n.id));

  const autoArrange = () => {
    const cols = Math.ceil(Math.sqrt(board.nodes.length));
    const gap = 40;
    updateBoard(prev => ({
      ...prev,
      nodes: prev.nodes.map((n, i) => ({
        ...n,
        x: (i % cols) * (NODE_W + gap),
        y: Math.floor(i / cols) * (NODE_H + gap + 20),
      })),
    }));
    setTimeout(fitAll, 100);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF2EA] relative" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Left Panel ── */}
      {showLeftPanel && (
        <div className="w-60 flex-shrink-0 bg-card border-r border-border/60 flex flex-col h-full z-10">
          <div className="px-3 py-2.5 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={s.search}
                className="w-full h-7 pl-8 pr-2 text-xs bg-background border border-border/50 rounded-lg outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Type filter */}
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">{s.cardType}</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterType("all")}
                className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                  filterType === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                )}
              >{s.all}</button>
              {(Object.entries(NODE_CONFIGS) as [NodeType, any][]).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type === filterType ? "all" : type)}
                  className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                    filterType === type
                      ? "text-white border-transparent"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  )}
                  style={filterType === type ? { backgroundColor: cfg.accentColor } : {}}
                >
                  {s[NODE_TYPE_KEYS[type]].replace("\n", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Node list */}
          <div className="flex-1 overflow-y-auto">
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Brain className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/50 text-center px-4">
                  {board.nodes.length === 0 ? s.doubleClickToAdd : s.noMatches}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredNodes.map(node => {
                  const cfg = NODE_CONFIGS[node.type];
                  const Icon = cfg.icon;
                  const isSelected = selectedNodes.has(node.id);
                  return (
                    <button
                      key={node.id}
                      onClick={() => focusNode(node.id)}
                      className={cn(
                        "w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/40 group",
                        isSelected && "bg-accent/60"
                      )}
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                           style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                        <Icon style={{ width: 10, height: 10, color: cfg.text }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{node.title}</p>
                        {(node.tags || []).length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate">{(node.tags || []).slice(0, 2).join(", ")}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add node button */}
          <div className="px-3 pb-3 pt-2 border-t border-border/60">
            <button
              onClick={addNodeFromSidebar}
              className="w-full h-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all"
              data-testid="button-add-node"
            >
              <Plus className="h-3.5 w-3.5" /> {s.newCard}
            </button>
          </div>
        </div>
      )}

      {/* ── Central canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Floating top toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-card/95 backdrop-blur border border-border/60 rounded-2xl px-2.5 py-1.5 shadow-md">
          {/* Panel toggles */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            title={s.leftPanel}
            className={cn("h-7 w-7 rounded-xl flex items-center justify-center transition-colors",
              showLeftPanel ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent/60")}
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-border/60" />

          {/* Connection type */}
          <select
            value={newEdgeType}
            onChange={e => setNewEdgeType(e.target.value as EdgeType)}
            className="h-7 text-xs bg-transparent border-0 outline-none text-muted-foreground pr-1 cursor-pointer"
            title={s.connectionType}
          >
            {(Object.entries(EDGE_CONFIGS) as [EdgeType, any][]).map(([k]) => (
              <option key={k} value={k}>{s[EDGE_TYPE_KEYS[k as EdgeType]]}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-border/60" />

          {/* AI suggestions */}
          <button
            onClick={() => { setShowAiPanel(!showAiPanel); if (!showAiPanel) callAiSuggest(); }}
            title={s.aiIdeas}
            className={cn("h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-colors",
              showAiPanel ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent/60")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.aiIdeas}</span>
          </button>

          <div className="w-px h-4 bg-border/60" />

          {/* Auto arrange */}
          <button onClick={autoArrange} title={s.autoArrange} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Shuffle className="h-3.5 w-3.5" />
          </button>

          {/* Toggle labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? s.hideLabels : s.showLabels}
            className={cn("h-7 w-7 rounded-xl flex items-center justify-center transition-colors",
              showLabels ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent/60")}
          >
            {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          <div className="w-px h-4 bg-border/60" />

          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} title={s.zoomIn} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.25, z * 0.8))} title={s.zoomOut} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={fitAll} title={s.fitAll} className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {saveMutation.isPending && (
            <span className="text-xs text-muted-foreground ml-0.5">·</span>
          )}
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="absolute top-16 right-4 z-30 w-72 bg-card border border-border/70 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{s.aiSuggestions}</h3>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {selectedNodes.size > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {s.basedOnSelected} ({selectedNodes.size})
                </p>
              )}
              <button
                onClick={callAiSuggest}
                disabled={isAiLoading}
                className="w-full h-8 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {isAiLoading ? s.generating : s.refreshSuggestions}
              </button>
              {isAiLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="group flex items-start gap-2 p-2.5 rounded-xl bg-accent/40 hover:bg-accent/70 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs flex-1 leading-relaxed">{sug}</p>
                  <button
                    onClick={() => addSuggestionAsNode(sug)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-5 w-5 rounded-md bg-primary text-white flex items-center justify-center transition-opacity"
                    title={s.addToBoard}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!isAiLoading && aiSuggestions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {s.pressRefresh}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative select-none"
          onDoubleClick={handleCanvasDoubleClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? "grabbing" : connectingFrom ? "crosshair" : "default" }}
          data-testid="idea-board-canvas"
        >
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }}>
            <defs>
              <pattern id="dotgrid" width={28 * zoom} height={28 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (28 * zoom)} y={pan.y % (28 * zoom)}>
                <circle cx={14 * zoom} cy={14 * zoom} r="0.9" fill="#9C8B7A" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {/* Empty state hint */}
          {board.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
              <Brain className="h-16 w-16 text-muted-foreground/10" />
              <p className="text-muted-foreground/30 text-sm font-medium">{s.doubleClickToAdd}</p>
            </div>
          )}

          {/* SVG layer: edges */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5, pointerEvents: "none" }}>
            <defs>
              {(Object.entries(EDGE_CONFIGS) as [EdgeType, any][]).map(([type, style]) => (
                <marker key={type} id={`arrow-${type}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L7,3.5 z" fill={style.stroke} />
                </marker>
              ))}
            </defs>

            {board.edges.map(edge => {
              const geo = getEdgePath(edge);
              if (!geo) return null;
              const style = EDGE_CONFIGS[edge.type];
              const isSelected = selectedEdge === edge.id;
              return (
                <g key={edge.id}>
                  {/* Hit area */}
                  <path
                    d={geo.path} stroke="transparent" strokeWidth={16} fill="none"
                    style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    onClick={() => setSelectedEdge(isSelected ? null : edge.id)}
                  />
                  {/* Visual edge */}
                  <path
                    d={geo.path}
                    stroke={style.stroke}
                    strokeWidth={isSelected ? 2.5 : 1.6}
                    strokeDasharray={style.dash}
                    fill="none"
                    markerEnd={`url(#arrow-${edge.type})`}
                    opacity={isSelected ? 1 : 0.65}
                  />
                  {/* Label */}
                  {showLabels && (
                    <text
                      x={geo.mx} y={geo.my - 7}
                      textAnchor="middle"
                      fill={style.stroke}
                      fontSize={10}
                      fontFamily="var(--font-sans)"
                      opacity={0.8}
                      fontWeight="500"
                    >
                      {s[EDGE_TYPE_KEYS[edge.type]]}
                    </text>
                  )}
                  {/* Delete button when selected */}
                  {isSelected && (
                    <g style={{ pointerEvents: "all", cursor: "pointer" }} onClick={() => deleteEdge(edge.id)}>
                      <circle cx={geo.mx} cy={geo.my} r={9} fill="white" stroke={style.stroke} strokeWidth={1.5} />
                      <text x={geo.mx} y={geo.my + 4} textAnchor="middle" fill={style.stroke} fontSize={12} fontWeight="bold">×</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Live connection line */}
            {connectingFrom && (() => {
              const node = board.nodes.find(n => n.id === connectingFrom);
              if (!node) return null;
              const from = getNodeCenter(node);
              const style = EDGE_CONFIGS[newEdgeType];
              return (
                <line
                  x1={from.x} y1={from.y} x2={connectMouse.x} y2={connectMouse.y}
                  stroke={style.stroke} strokeWidth={2.5} strokeDasharray="6,4" opacity={0.8}
                />
              );
            })()}
          </svg>

          {/* Nodes layer */}
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            {board.nodes.map(node => {
              const cfg = NODE_CONFIGS[node.type];
              const Icon = cfg.icon;
              const isSelected = selectedNodes.has(node.id);
              const isEditing = editingNode === node.id;
              const size = getNodeSize(node);

              return (
                <div
                  key={node.id}
                  className="board-node absolute group"
                  style={{
                    left: node.x * zoom + pan.x,
                    top: node.y * zoom + pan.y,
                    width: size.w * zoom,
                    height: node.h ? size.h * zoom : undefined,
                    zIndex: resizingNode?.id === node.id ? 50 : draggingNode === node.id ? 50 : isSelected ? 20 : 10,
                  }}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  onClick={e => handleNodeClick(e, node.id)}
                  onMouseUp={() => connectingFrom && connectingFrom !== node.id && handleNodeClick({ stopPropagation: () => {} } as any, node.id)}
                  data-testid={`board-node-${node.id}`}
                >
                  <div
                    className="rounded-xl overflow-hidden transition-all duration-100 flex flex-col"
                    style={{
                      background: cfg.bg,
                      border: `${isSelected ? 2.5 : 1.5}px solid ${isSelected ? cfg.accentColor : cfg.border}`,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${cfg.accentColor}28, 0 4px 16px rgba(0,0,0,0.12)`
                        : "0 2px 8px rgba(0,0,0,0.08)",
                      height: node.h ? "100%" : undefined,
                    }}
                  >
                    {/* Header stripe */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5"
                      style={{ backgroundColor: `${cfg.accentColor}18`, borderBottom: `1px solid ${cfg.border}60` }}
                    >
                      <Icon style={{ width: 11, height: 11, color: cfg.accentColor, flexShrink: 0 }} />
                      <span style={{ color: cfg.accentColor, fontSize: Math.max(8, 9 * zoom), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {s[NODE_TYPE_KEYS[node.type]].replace("\n", " ")}
                      </span>
                      {(node.tags || []).length > 0 && showLabels && (
                        <div className="flex gap-0.5 ml-auto">
                          {(node.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: Math.max(8, 8 * zoom), color: cfg.text, opacity: 0.6, background: `${cfg.accentColor}18`, padding: "0 4px", borderRadius: 4 }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="px-2.5 py-2 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="text-xs font-semibold bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none focus:border-primary/50"
                          style={{ color: cfg.text }}
                          onKeyDown={e => e.key === "Enter" && saveEdit()}
                        />
                        <textarea
                          value={editForm.content}
                          onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                          rows={2}
                          placeholder={s.description + "..."}
                          className="text-[11px] bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none resize-none focus:border-primary/50"
                          style={{ color: cfg.text }}
                        />
                        <input
                          value={editForm.tags}
                          onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                          placeholder={s.tagsEdit}
                          className="text-[10px] bg-white/70 rounded-lg px-2 py-1 border border-border/40 w-full outline-none"
                          style={{ color: cfg.text }}
                        />
                        <div className="flex gap-1">
                          <button className="flex-1 h-5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 text-white"
                            style={{ backgroundColor: cfg.accentColor }} onClick={saveEdit}>
                            <Check className="h-2.5 w-2.5" /> {s.save}
                          </button>
                          <button className="h-5 w-5 rounded-lg bg-secondary flex items-center justify-center" onClick={() => setEditingNode(null)}>
                            <X className="h-2.5 w-2.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2.5 py-2 flex-1 overflow-auto">
                        <p className="font-semibold leading-snug" style={{ color: cfg.text, fontSize: Math.max(10, 13 * zoom), WebkitLineClamp: node.h ? undefined : 2, display: node.h ? "block" : "-webkit-box", WebkitBoxOrient: node.h ? undefined : "vertical", overflow: "hidden" }}>
                          {node.title}
                        </p>
                        {node.content && (
                          <p className="mt-0.5 leading-snug opacity-60" style={{ color: cfg.text, fontSize: Math.max(9, 11 * zoom), WebkitLineClamp: node.h ? undefined : 2, display: node.h ? "block" : "-webkit-box", WebkitBoxOrient: node.h ? undefined : "vertical", overflow: node.h ? "auto" : "hidden" }}>
                            {node.content}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connect handle */}
                  {!isEditing && (
                    <div
                      className="absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-crosshair z-20 shadow-sm"
                      style={{ borderColor: cfg.accentColor }}
                      onMouseDown={e => handleConnectStart(e, node.id)}
                      title={s.drawConnection}
                    >
                      <GitBranch className="h-2.5 w-2.5" style={{ color: cfg.accentColor }} />
                    </div>
                  )}

                  {/* Resize handle — bottom-right corner */}
                  {!isEditing && (
                    <div
                      className="absolute bottom-0 right-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-se-resize flex items-end justify-end pr-0.5 pb-0.5"
                      onMouseDown={e => handleResizeStart(e, node)}
                      title={s.resize}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 7L7 1M4 7L7 4M7 7L7 7" stroke={cfg.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                      </svg>
                    </div>
                  )}

                  {/* Quick actions */}
                  {!isEditing && (
                    <div className="absolute -top-2.5 right-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        className="h-5 w-5 rounded-md bg-card border border-border/60 shadow-sm flex items-center justify-center hover:bg-secondary"
                        onClick={e => { e.stopPropagation(); startEdit(node.id); }}
                        title={s.editNode}
                      >
                        <Edit2 className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                      <button
                        className="h-5 w-5 rounded-md bg-card border border-border/60 shadow-sm flex items-center justify-center hover:bg-red-50"
                        onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                        title={s.deleteNode}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats badge bottom left */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-xs text-muted-foreground/50 pointer-events-none">
            <span>{board.nodes.length} {s.cards}</span>
            {board.edges.length > 0 && <span>· {board.edges.length} {s.connections}</span>}
          </div>
        </div>
      </div>

      {/* ── Right Panel (selected node) ── */}
      {showRightPanel && selectedNode && (
        <div className="w-64 flex-shrink-0 bg-card border-l border-border/60 flex flex-col h-full z-10">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{s.properties}</h3>
            <button onClick={() => setShowRightPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Type badge */}
            {(() => {
              const cfg = NODE_CONFIGS[selectedNode.type];
              const Icon = cfg.icon;
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                  <Icon style={{ width: 14, height: 14, color: cfg.accentColor }} />
                  <span className="text-xs font-semibold" style={{ color: cfg.text }}>{s[NODE_TYPE_KEYS[selectedNode.type]].replace("\n", " ")}</span>
                </div>
              );
            })()}

            {/* Title */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.title}</p>
              <p className="text-sm font-semibold leading-snug">{selectedNode.title}</p>
            </div>

            {/* Content */}
            {selectedNode.content && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.description}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.content}</p>
              </div>
            )}

            {/* Tags */}
            {(selectedNode.tags || []).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{s.tags}</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedNode.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-accent text-muted-foreground border border-border/60">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Connections */}
            {(() => {
              const edges = board.edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id);
              if (edges.length === 0) return null;
              return (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{s.connectionsLabel} ({edges.length})</p>
                  <div className="space-y-1">
                    {edges.map(e => {
                      const otherId = e.from === selectedNode.id ? e.to : e.from;
                      const other = board.nodes.find(n => n.id === otherId);
                      const cfg = EDGE_CONFIGS[e.type];
                      const isOutgoing = e.from === selectedNode.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => other && focusNode(other.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                        >
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.stroke }} />
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{isOutgoing ? "→" : "←"} {s[EDGE_TYPE_KEYS[e.type]]}</span>
                          <span className="text-xs font-medium truncate">{other?.title || "?"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <button
                onClick={() => startEdit(selectedNode.id)}
                className="w-full h-8 rounded-xl border border-border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/60 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" /> {s.edit}
              </button>
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="w-full h-8 rounded-xl border border-red-200 text-xs font-medium flex items-center justify-center gap-1.5 text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> {s.deleteLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Node Dialog ── */}
      {showAddDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur-[2px]" onClick={() => setShowAddDialog(null)}>
          <div className="bg-card border border-border rounded-3xl shadow-2xl p-6 w-96 max-w-[95vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base">{s.newCard}</h3>
            </div>

            {/* Type picker */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {(Object.entries(NODE_CONFIGS) as [NodeType, any][]).map(([type, cfg]) => {
                const Icon = cfg.icon;
                const isActive = addForm.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => setAddForm(f => ({ ...f, type }))}
                    className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl border transition-all"
                    style={{
                      backgroundColor: isActive ? cfg.bg : "transparent",
                      borderColor: isActive ? cfg.accentColor : "hsl(var(--border))",
                      boxShadow: isActive ? `0 0 0 2px ${cfg.accentColor}30` : "none",
                    }}
                    data-testid={`node-type-${type}`}
                  >
                    <Icon style={{ width: 14, height: 14, color: isActive ? cfg.accentColor : "hsl(var(--muted-foreground))" }} />
                    <span className="text-[9px] font-medium text-center leading-tight" style={{ color: isActive ? cfg.text : "hsl(var(--muted-foreground))", whiteSpace: "pre-line" }}>
                      {s[NODE_TYPE_KEYS[type]]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <input
                autoFocus
                value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                placeholder={s.cardTitle}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                onKeyDown={e => e.key === "Enter" && addNode()}
                data-testid="input-node-title"
              />
              <textarea
                value={addForm.content}
                onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
                placeholder={s.descOptional}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none resize-none focus:border-primary/50"
              />
              <input
                value={addForm.tags}
                onChange={e => setAddForm(f => ({ ...f, tags: e.target.value }))}
                placeholder={s.tagsPlaceholder}
                className="w-full h-9 px-3 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={addNode}
                disabled={!addForm.title.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
                data-testid="button-add-node-confirm"
              >
                {s.add}
              </button>
              <button
                onClick={() => setShowAddDialog(null)}
                className="flex-1 h-10 rounded-xl text-sm font-medium border border-border hover:bg-accent/60 transition-colors"
              >
                {s.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Mode Gate — violet floating card, no backdrop */}
      {freeGateOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <div className="w-full max-w-md mx-4" style={{ pointerEvents: "auto", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1.5px solid rgba(99,102,241,0.55)", borderRadius: "16px", padding: "24px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.18)" }}>
                <Brain className="w-5 h-5" style={{ color: "#818CF8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
                  {lang === "ru" ? "Нейросеть бесплатной версии устала" : lang === "ua" ? "Нейромережа безплатної версії стомилась" : lang === "de" ? "Das KI-Netz der Gratisversion ist müde" : "The free neural network is tired"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#818CF8" }}>GPT-OSS · Pollinations</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
              {lang === "ru"
                ? "Генерация идей для доски — это задача, которая требует хорошей рабочей памяти у модели. Бесплатный GPT-OSS сейчас слишком загружен и не справится качественно. Добавь API ключ OpenAI — и нейросеть снова бодрая."
                : lang === "ua"
                  ? "Генерація ідей для дошки — це задача, яка потребує хорошої робочої пам'яті у моделі. Безплатний GPT-OSS зараз занадто завантажений. Додай API ключ OpenAI — і нейромережа знову бадьора."
                  : lang === "de"
                    ? "Die Ideengenerierung für das Board erfordert ein Modell mit guter Arbeitsgedächtnisleistung. Das kostenlose GPT-OSS ist momentan überlastet. Füge einen OpenAI-API-Schlüssel hinzu."
                    : "Generating ideas for the board requires a model with good working memory. The free GPT-OSS is currently overloaded and won't do a quality job. Add an OpenAI API key — and the neural network is fresh again."}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFreeGateOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}
              >
                {lang === "ru" ? "Закрыть" : lang === "ua" ? "Закрити" : lang === "de" ? "Schließen" : "Close"}
              </button>
              <button
                onClick={() => { setFreeGateOpen(false); setLocation("/models"); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(249,109,28,0.18)", color: "#FB923C" }}
              >
                {lang === "ru" ? "Добавить API ключ" : lang === "ua" ? "Додати API ключ" : lang === "de" ? "API-Schlüssel hinzufügen" : "Add API key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
