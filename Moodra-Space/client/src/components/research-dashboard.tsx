import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAiError } from "@/contexts/ai-error-context";
import { useFreeMode } from "@/hooks/use-free-mode";
import { useLang } from "@/contexts/language-context";
import type { Book, Source } from "@shared/schema";
import {
  Search, Sparkles, BookOpen, StickyNote, FlaskConical,
  FileEdit, Brain, Network, Plus, ChevronRight, Loader2,
  ArrowDownToLine, CheckCircle2, Lightbulb, ChevronDown,
  ChevronUp, Globe, FileText, BookMarked, Quote, Microscope, X
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AISuggestedSource {
  title: string;
  author: string;
  url?: string;
  type: string;
  quote?: string;
  notes: string;
}

interface AIResearchResult {
  advice?: string;
  sources: AISuggestedSource[];
}

type DashTab = "notes" | "library" | "dashboard" | "hypotheses" | "drafts" | "models";

// ─── Category chips ─────────────────────────────────────────────────────────

const CATEGORY_CHIPS = {
  nonfiction: ["Current research", "Classic works", "Statistics & data", "Methodology", "Debates & theory"],
  fiction: ["Character psychology", "Historical context", "Plot techniques", "Atmosphere & setting", "Dialogue patterns"],
};

// ─── Source type icon ───────────────────────────────────────────────────────

function SourceTypeChip({ type }: { type: string }) {
  const cfg: Record<string, { icon: any; color: string; label: string }> = {
    book:             { icon: BookOpen,   color: "#6366F1", label: "Book" },
    article:          { icon: FileText,   color: "#3B82F6", label: "Article" },
    website:          { icon: Globe,      color: "#10B981", label: "Web" },
    pdf:              { icon: FileText,   color: "#EF4444", label: "PDF" },
    quote:            { icon: Quote,      color: "#F59E0B", label: "Quote" },
    research_snippet: { icon: Microscope, color: "#8B5CF6", label: "Research" },
    book_excerpt:     { icon: BookMarked, color: "#0D9488", label: "Excerpt" },
  };
  const c = cfg[type] || { icon: FileText, color: "#6B7280", label: type };
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
      style={{ background: `${c.color}12`, color: c.color }}>
      <Icon className="h-2.5 w-2.5" />{c.label}
    </span>
  );
}

// ─── Mini source row ────────────────────────────────────────────────────────

function MiniSourceRow({ source }: { source: Source }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-t border-border/20 first:border-0">
      <SourceTypeChip type={source.type || "book"} />
      <span className="flex-1 text-[11px] font-medium truncate">{source.title}</span>
      {source.author && <span className="text-[10px] text-muted-foreground/50 truncate max-w-[70px]">{source.author}</span>}
    </div>
  );
}

// ─── Bento card shell ───────────────────────────────────────────────────────

function BentoCard({
  children, className = "", onClick, accent
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border border-border/50 bg-background/80 overflow-hidden transition-all ${onClick ? "cursor-pointer hover:border-border hover:shadow-sm hover:bg-background" : ""} ${className}`}
    >
      {accent && <div style={{ height: 2.5, background: accent, opacity: 0.65 }} />}
      {children}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export function ResearchDashboard({
  bookId,
  book,
  sources,
  notesCount,
  draftsCount,
  hypothesesCount,
  modelsCount,
  modelsAnalyzedCount,
  onNavigate,
}: {
  bookId: number;
  book: Book;
  sources: Source[];
  notesCount: number;
  draftsCount: number;
  hypothesesCount: number;
  modelsCount: number;
  modelsAnalyzedCount: number;
  onNavigate: (tab: DashTab) => void;
}) {
  const { toast } = useToast();
  const { handleAiError } = useAiError();
  const { isFreeMode } = useFreeMode();
  const { lang } = useLang();

  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<AIResearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [showAdvice, setShowAdvice] = useState(true);

  const chips = book.mode === "fiction" ? CATEGORY_CHIPS.fiction : CATEGORY_CHIPS.nonfiction;
  const recentSources = sources.slice(0, 4);

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async (q?: string) => {
    const finalQuery = q !== undefined ? q : query;
    if (!finalQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setAddedTitles(new Set());
    try {
      const data = await apiRequest("POST", "/api/ai/research", {
        query: finalQuery.trim(),
        bookTitle: book.title,
        bookMode: book.mode,
        existingSources: sources,
        lang,
      });
      setSearchResult(data);
      setShowAdvice(true);
    } catch (e: any) {
      if (!handleAiError(e)) toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const addSourceMutation = useMutation({
    mutationFn: (s: AISuggestedSource) =>
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title, author: s.author, url: s.url || "",
        quote: s.quote || "", notes: s.notes, type: s.type,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      setAddedTitles(prev => { const n = new Set(Array.from(prev)); n.add(vars.title); return n; });
      setAddingId(null);
    },
    onError: () => setAddingId(null),
  });

  const addAll = () => {
    if (!searchResult) return;
    searchResult.sources.filter(s => !addedTitles.has(s.title)).forEach(s => {
      apiRequest("POST", `/api/books/${bookId}/sources`, {
        title: s.title, author: s.author, url: s.url || "",
        quote: s.quote || "", notes: s.notes, type: s.type,
      }).then(() => {
        setAddedTitles(prev => { const n = new Set(Array.from(prev)); n.add(s.title); return n; });
        queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "sources"] });
      });
    });
    toast({ title: `${searchResult.sources.length} sources added` });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={`Search sources for "${book.title}"…`}
            className="w-full pl-9 pr-16 py-2 rounded-xl border border-border/60 bg-background/90 text-sm outline-none focus:border-primary/40 placeholder:text-muted-foreground/35 transition-all"
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-40"
            style={{ background: "rgba(249,109,28,0.12)", color: "#F96D1C" }}
          >
            {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {searching ? "…" : "Find"}
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {chips.map(chip => (
            <button
              key={chip}
              onClick={() => { setQuery(chip); handleSearch(chip); }}
              disabled={searching}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 hover:bg-primary/8 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* ── Search results ──────────────────────────────────────────── */}
        {(searching || searchResult) && (
          <div className="mb-3">
            {/* Results header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground/70">
                {searching ? "Searching…" : `${searchResult?.sources?.length || 0} sources found`}
              </span>
              <div className="flex items-center gap-2">
                {searchResult && searchResult.sources.length > 0 && (
                  <button onClick={addAll}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                    <ArrowDownToLine className="h-2.5 w-2.5" />
                    Add all
                  </button>
                )}
                <button onClick={() => { setSearchResult(null); setQuery(""); }}
                  className="text-muted-foreground/50 hover:text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Loading skeleton */}
            {searching && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            )}

            {/* Strategy advice */}
            {!searching && searchResult?.advice && (
              <div className="mb-2 rounded-xl bg-primary/5 border border-primary/15 overflow-hidden">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  onClick={() => setShowAdvice(!showAdvice)}>
                  <Lightbulb className="h-3 w-3 text-primary/70 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-primary/80 flex-1">Research strategy</span>
                  {showAdvice ? <ChevronUp className="h-3 w-3 text-primary/50" /> : <ChevronDown className="h-3 w-3 text-primary/50" />}
                </button>
                {showAdvice && (
                  <div className="px-3 pb-3">
                    <p className="text-[11px] text-foreground/75 leading-relaxed whitespace-pre-line">{searchResult.advice}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI source cards */}
            {!searching && searchResult && (
              <div className="space-y-1.5">
                {searchResult.sources.map((s, i) => {
                  const added = addedTitles.has(s.title);
                  const adding = addingId === s.title;
                  return (
                    <div key={`${s.title}-${i}`}
                      className="rounded-xl border border-border/50 bg-background/80 p-2.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <SourceTypeChip type={s.type} />
                            <span className="text-[11px] font-semibold truncate">{s.title}</span>
                          </div>
                          {s.author && <p className="text-[10px] text-muted-foreground/60 mb-1">{s.author}</p>}
                          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{s.notes}</p>
                        </div>
                        <button
                          onClick={() => { setAddingId(s.title); addSourceMutation.mutate(s); }}
                          disabled={added || adding}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all disabled:opacity-60"
                          style={{ background: added ? "rgba(16,185,129,0.12)" : "rgba(249,109,28,0.1)" }}
                        >
                          {adding ? <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                            : added ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              : <Plus className="h-3 w-3 text-orange-500" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Bento grid ─────────────────────────────────────────────── */}
        {!searching && !searchResult && (
          <div className="grid grid-cols-2 gap-2.5 mt-1">

            {/* Source Library — full width */}
            <BentoCard
              className="col-span-2"
              accent="#6366F1"
              onClick={() => onNavigate("library")}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(99,102,241,0.12)" }}>
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold leading-none">Source Library</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">{sources.length} source{sources.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                {sources.length > 0 ? (
                  <div className="space-y-0">
                    {recentSources.map(s => <MiniSourceRow key={s.id} source={s} />)}
                    {sources.length > 4 && (
                      <p className="text-[10px] text-muted-foreground/40 pt-1.5 border-t border-border/20">
                        +{sources.length - 4} more sources
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/45 italic">No sources yet — search above or add manually</p>
                )}
              </div>
            </BentoCard>

            {/* Notes */}
            <BentoCard
              accent="#F59E0B"
              onClick={() => onNavigate("notes")}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(245,158,11,0.12)" }}>
                    <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] font-semibold leading-none">Notes</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{notesCount} captured</p>
                <div className="mt-2 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${Math.min(100, (notesCount / 20) * 100)}%` }} />
                </div>
              </div>
            </BentoCard>

            {/* Hypotheses */}
            <BentoCard
              accent="#8B5CF6"
              onClick={() => onNavigate("hypotheses")}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.12)" }}>
                    <FlaskConical className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] font-semibold leading-none">Hypotheses</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{hypothesesCount} in progress</p>
                <div className="mt-2 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-400/60" style={{ width: `${Math.min(100, (hypothesesCount / 10) * 100)}%` }} />
                </div>
              </div>
            </BentoCard>

            {/* Drafts */}
            <BentoCard
              accent="#3B82F6"
              onClick={() => onNavigate("drafts")}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.12)" }}>
                    <FileEdit className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] font-semibold leading-none">Drafts</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{draftsCount} fragment{draftsCount !== 1 ? "s" : ""}</p>
                <div className="mt-2 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400/60" style={{ width: `${Math.min(100, (draftsCount / 15) * 100)}%` }} />
                </div>
              </div>
            </BentoCard>

            {/* Role Models */}
            <BentoCard
              accent="#EC4899"
              onClick={() => onNavigate("models")}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(236,72,153,0.12)" }}>
                    <Brain className="h-3.5 w-3.5 text-pink-500" />
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] font-semibold leading-none">Role Models</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                  {modelsAnalyzedCount}/{modelsCount} analyzed
                </p>
                {modelsCount === 0 && (
                  <p className="text-[9px] text-muted-foreground/40 mt-1 italic">Upload author excerpts</p>
                )}
              </div>
            </BentoCard>

            {/* Source type breakdown — full width, only if sources exist */}
            {sources.length > 0 && (() => {
              const typeCounts: Record<string, number> = {};
              sources.forEach(s => { typeCounts[s.type || "book"] = (typeCounts[s.type || "book"] || 0) + 1; });
              const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
              return (
                <BentoCard className="col-span-2">
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Source breakdown</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topTypes.map(([type, count]) => (
                        <span key={type} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-border/40">
                          <SourceTypeChip type={type} />
                          <span className="font-semibold ml-0.5">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </BentoCard>
              );
            })()}

            {/* Knowledge Graph card */}
            <BentoCard
              className="col-span-2"
              accent="#10B981"
              onClick={() => onNavigate("notes")}
            >
              <div className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.10)" }}>
                  <Network className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold">Knowledge Graph</p>
                  <p className="text-[10px] text-muted-foreground/55">
                    {notesCount + sources.length} nodes · open in Notes → Graph view
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
              </div>
            </BentoCard>

          </div>
        )}
      </div>
    </div>
  );
}
