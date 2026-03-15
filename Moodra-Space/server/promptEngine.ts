import { db } from "./db";
import { notes, books, noteCollections, sources, drafts } from "@shared/schema";
import { eq, inArray, desc, ne } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// 13.1  NOTE CONTEXT  — full richness assembled from DB
// ─────────────────────────────────────────────────────────────────────────────

export interface NoteContext {
  noteId: number;
  noteTitle: string;
  noteContent: string;
  noteType: string;
  noteStatus: string;
  noteImportance: string;
  noteTags: string[];
  noteSemanticTags: string[];
  noteCreatedAt: Date;

  bookId: number;
  bookTitle: string;
  bookDescription: string;
  bookMode: string;
  bookGenre: string;
  bookCoreIdea: string;
  bookTheme: string;
  bookTone: string;

  linkedNotes: Array<{ id: number; title: string; type: string; content: string }>;
  linkedSources: Array<{ id: number; title: string; author: string; summary: string; quote: string }>;
  linkedDrafts: Array<{ id: number; title: string; type: string }>;
  collections: Array<{ id: number; name: string }>;
  backlinkedNotes: Array<{ id: number; title: string; type: string }>;
  recentNotes: Array<{ id: number; title: string; type: string; content: string }>;

  userActionIntent: string;
  lang: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assemble full context from the database
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleNoteContext(
  noteId: number,
  bookId: number,
  intent: string,
  lang: string
): Promise<NoteContext> {
  const [note] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!note) throw new Error(`Note ${noteId} not found`);

  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) throw new Error(`Book ${bookId} not found`);

  const nc = (book.narrativeContext as any) || {};

  // Parse comma-separated ID lists
  const parseIds = (raw: string | null | undefined): number[] => {
    if (!raw) return [];
    return raw.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  };

  const linkedNoteIds = parseIds(note.linkedNoteIds);
  const linkedSourceIds = parseIds(note.linkedSourceIds);
  const linkedDraftIds = parseIds(note.linkedDraftIds);

  // Linked notes (limited to 5)
  let linkedNotes: NoteContext["linkedNotes"] = [];
  if (linkedNoteIds.length > 0) {
    const rows = await db.select().from(notes).where(inArray(notes.id, linkedNoteIds.slice(0, 5)));
    linkedNotes = rows.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type || "quick_thought",
      content: (r.content || "").slice(0, 300),
    }));
  }

  // Linked sources (limited to 4)
  let linkedSources: NoteContext["linkedSources"] = [];
  if (linkedSourceIds.length > 0) {
    const rows = await db.select().from(sources).where(inArray(sources.id, linkedSourceIds.slice(0, 4)));
    linkedSources = rows.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author || "",
      summary: (r.summary || "").slice(0, 250),
      quote: (r.quote || "").slice(0, 200),
    }));
  }

  // Linked drafts (limited to 3)
  let linkedDrafts: NoteContext["linkedDrafts"] = [];
  if (linkedDraftIds.length > 0) {
    const rows = await db.select().from(drafts).where(inArray(drafts.id, linkedDraftIds.slice(0, 3)));
    linkedDrafts = rows.map(r => ({ id: r.id, title: r.title, type: r.type || "paragraph" }));
  }

  // Collections this note belongs to
  const collectionIdsParsed = parseIds(note.collectionIds);
  let collections: NoteContext["collections"] = [];
  if (collectionIdsParsed.length > 0) {
    const rows = await db.select().from(noteCollections).where(inArray(noteCollections.id, collectionIdsParsed));
    collections = rows.map(r => ({ id: r.id, name: r.name }));
  }

  // Backlinks: notes in same book that link back to this note
  const allBookNotes = await db.select().from(notes).where(eq(notes.bookId, bookId));
  const backlinkedNotes = allBookNotes
    .filter(n => n.id !== noteId && parseIds(n.linkedNoteIds).includes(noteId))
    .slice(0, 5)
    .map(n => ({ id: n.id, title: n.title, type: n.type || "quick_thought" }));

  // Recent notes (last 6, excluding this note)
  const recentRows = await db.select().from(notes)
    .where(eq(notes.bookId, bookId))
    .orderBy(desc(notes.updatedAt))
    .limit(8);
  const recentNotes = recentRows
    .filter(n => n.id !== noteId)
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      title: n.title,
      type: n.type || "quick_thought",
      content: (n.content || "").slice(0, 150),
    }));

  return {
    noteId,
    noteTitle: note.title,
    noteContent: note.content || "",
    noteType: note.type || "quick_thought",
    noteStatus: note.status || "inbox",
    noteImportance: note.importance || "normal",
    noteTags: (note.tags || "").split(",").map(t => t.trim()).filter(Boolean),
    noteSemanticTags: (note.semanticTags || "").split(",").map(t => t.trim()).filter(Boolean),
    noteCreatedAt: note.createdAt,
    bookId,
    bookTitle: book.title,
    bookDescription: book.description || "",
    bookMode: book.mode,
    bookGenre: book.genre || "",
    bookCoreIdea: nc.coreIdea || "",
    bookTheme: nc.themes || "",
    bookTone: nc.tone || "",
    linkedNotes,
    linkedSources,
    linkedDrafts,
    collections,
    backlinkedNotes,
    recentNotes,
    userActionIntent: intent,
    lang,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13.2  BUILD STRUCTURED PROMPT from assembled context
// ─────────────────────────────────────────────────────────────────────────────

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

type IntentConfig = {
  agentRole: string;
  systemGoal: string;
  toneOfResponse: string;
  transformationRules: string;
  task: string;
  desiredOutputStructure: string;
  contextSelectors: Array<"object" | "project" | "linked_notes" | "linked_sources" | "linked_drafts" | "collections" | "backlinks" | "recent_notes">;
  maxTokens: number;
};

const intentConfigs: Record<string, IntentConfig> = {
  // 13.3: "Connect this note" — Linker Agent
  connect: {
    agentRole: "You are a Semantic Linker Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to find rich, meaningful connections between this note and the existing knowledge graph of this project. You analyse the full context provided and identify conceptual bridges, structural links, and emergent patterns.",
    toneOfResponse: "Analytical, clear, and intellectually precise. Use specific references to the context provided.",
    transformationRules: "Draw on all context layers — note type, project theme, existing links, recent notes — to surface non-obvious connections. Do not repeat what is already linked. Focus on what is missing.",
    task: "Find meaningful connections for this note. Identify what it should be linked to, why each link matters, and what new structural opportunity each connection creates.",
    desiredOutputStructure: `Return a structured response with three sections:
## Likely Connections
List 4–6 notes, themes, or ideas this note should connect to. For each: name, why it matters, what insight the link reveals.

## Why It Matters
In 2–3 sentences, explain the structural role this note plays in the project knowledge graph.

## Possible New Structure
Suggest 1–2 structural changes: a new collection, a Map of Content (MOC), or a cluster this note could anchor.`,
    contextSelectors: ["object", "project", "linked_notes", "linked_sources", "collections", "recent_notes"],
    maxTokens: 1400,
  },

  // 13.3: "Develop this thought" — Expansion Agent
  expand: {
    agentRole: "You are a Thought Expansion Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to develop the seed idea in this note into three distinct expansion directions. You use all available project context to make expansions relevant to the work-in-progress.",
    toneOfResponse: "Generative, exploratory, and intellectually stimulating. Each expansion should feel like a distinct creative direction.",
    transformationRules: "Anchor every expansion in the project theme and context. Reference linked sources or notes where relevant. Make expansions immediately usable by the writer.",
    task: "Develop this thought into 3 possible expansion directions. Each direction should be meaningfully different in approach, scale, or form.",
    desiredOutputStructure: `Return a structured response with three sections:
## 3 Expansion Directions
For each direction: a title, 2–3 sentences of how the idea could develop, and the likely form (argument, narrative, analysis, reflection, etc.).

## Conceptual Direction
In 2–3 sentences, identify the deepest intellectual direction this note is pointing toward based on the full context.

## Transformation Potential
Describe how this note could transform into a draft: what kind of draft, what it would open with, and where it could go.`,
    contextSelectors: ["object", "project", "linked_notes", "linked_sources", "recent_notes"],
    maxTokens: 1600,
  },

  // Distill — core insight extraction
  distill: {
    agentRole: "You are a Distillation Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to find and articulate the single essential insight in this note, then reveal its structural importance to the project.",
    toneOfResponse: "Precise, compressed, and powerful. Every sentence should do real work.",
    transformationRules: "Remove all noise. Find what is irreducible. Connect the core insight to the project context explicitly.",
    task: "Distill this note to its essential insight and explain its significance.",
    desiredOutputStructure: `Return a structured response with three sections:
## Core Insight
One precise sentence capturing the essential claim or observation.

## What Supports It
2–3 supporting points already present in the note or linked context.

## Project Significance
Why this insight matters to the book/project — what it could anchor, complicate, or resolve.`,
    contextSelectors: ["object", "project", "linked_notes"],
    maxTokens: 900,
  },

  // Suggest tags
  suggest_tags: {
    agentRole: "You are a Conceptual Tagging Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to generate a precise set of conceptual and semantic tags for this note, consistent with its type, content, and project context.",
    toneOfResponse: "Concise and systematic. Tags should be specific, not generic.",
    transformationRules: "Prioritize conceptual tags over topic tags. Include both granular and cluster-level tags. Make tags consistent with the project's intellectual territory.",
    task: "Suggest tags for this note.",
    desiredOutputStructure: `Return a structured response with two sections:
## Conceptual Tags
6–8 precise conceptual tags. For each: the tag and a one-line rationale.

## Cluster Tags
2–3 broader cluster tags that group this note with related ideas in the project.`,
    contextSelectors: ["object", "project", "recent_notes"],
    maxTokens: 700,
  },

  // Transform to draft
  to_draft: {
    agentRole: "You are a Draft Transformation Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to transform this note into a ready-to-write draft seed, using all project context to ensure the draft fits the work in progress.",
    toneOfResponse: "Direct, write-ready, and structured. The output should feel like the beginning of real writing.",
    transformationRules: "Write in the voice appropriate to the book's mode and tone. Reference linked sources where relevant. Make the opening paragraph immediately usable.",
    task: "Transform this note into a draft seed.",
    desiredOutputStructure: `Return a structured response with two sections:
## Opening Paragraph
A strong opening paragraph (100–150 words) that could begin a section or chapter, written in the book's voice and mode.

## Development Outline
A 5–6 point outline showing where this draft could go, with a brief description of each section.`,
    contextSelectors: ["object", "project", "linked_notes", "linked_sources", "linked_drafts"],
    maxTokens: 1200,
  },

  // Suggest collection
  suggest_collection: {
    agentRole: "You are a Knowledge Classification Agent embedded in an AI Writing Studio.",
    systemGoal: "Your goal is to identify the best home(s) for this note within the project's collection structure.",
    toneOfResponse: "Rational and precise.",
    transformationRules: "Consider both existing collections and potentially missing collections that should be created.",
    task: "Recommend collections for this note.",
    desiredOutputStructure: `Return a structured response with two sections:
## Best Collections
Top 3 collection placements, ranked by fit. For each: collection name, brief rationale.

## Missing Structure
If no existing collection fits well, suggest 1 new collection that should be created and why.`,
    contextSelectors: ["object", "project", "collections", "recent_notes"],
    maxTokens: 600,
  },
};

function formatContextBlock(label: string, content: string): string {
  if (!content.trim()) return "";
  return `\n[${label}]\n${content.trim()}\n`;
}

export function buildStructuredPrompt(ctx: NoteContext): BuiltPrompt {
  const config = intentConfigs[ctx.userActionIntent];
  if (!config) throw new Error(`Unknown intent: ${ctx.userActionIntent}`);

  const langInstruction =
    ctx.lang === "ru" ? "IMPORTANT: Respond ONLY in Russian." :
    ctx.lang === "ua" ? "IMPORTANT: Respond ONLY in Ukrainian." :
    ctx.lang === "de" ? "IMPORTANT: Respond ONLY in German." :
    "Respond in English.";

  // ── System prompt (agent role + goal + tone + rules + lang) ──
  const systemPrompt = [
    config.agentRole,
    "",
    `SYSTEM GOAL: ${config.systemGoal}`,
    "",
    `TONE: ${config.toneOfResponse}`,
    "",
    `TRANSFORMATION RULES: ${config.transformationRules}`,
    "",
    langInstruction,
  ].join("\n");

  // ── User prompt: assembled context blocks + task + output structure ──
  const blocks: string[] = [];
  const sel = config.contextSelectors;

  // Object context
  if (sel.includes("object")) {
    const obj = [
      `Title: ${ctx.noteTitle}`,
      `Type: ${ctx.noteType}`,
      `Status: ${ctx.noteStatus}`,
      `Importance: ${ctx.noteImportance}`,
      ctx.noteTags.length > 0 ? `Tags: ${ctx.noteTags.join(", ")}` : "",
      ctx.noteSemanticTags.length > 0 ? `Semantic tags: ${ctx.noteSemanticTags.join(", ")}` : "",
      "",
      `Content:\n${ctx.noteContent.slice(0, 2000)}`,
    ].filter(Boolean).join("\n");
    blocks.push(formatContextBlock("OBJECT CONTEXT", obj));
  }

  // Project context
  if (sel.includes("project")) {
    const proj = [
      `Book: "${ctx.bookTitle}"`,
      ctx.bookMode ? `Mode: ${ctx.bookMode}` : "",
      ctx.bookGenre ? `Genre: ${ctx.bookGenre}` : "",
      ctx.bookCoreIdea ? `Core idea: ${ctx.bookCoreIdea}` : "",
      ctx.bookTheme ? `Themes: ${ctx.bookTheme}` : "",
      ctx.bookTone ? `Tone: ${ctx.bookTone}` : "",
      ctx.bookDescription ? `Description: ${ctx.bookDescription.slice(0, 200)}` : "",
    ].filter(Boolean).join("\n");
    if (proj.trim()) blocks.push(formatContextBlock("PROJECT CONTEXT", proj));
  }

  // Connected: linked notes
  if (sel.includes("linked_notes") && ctx.linkedNotes.length > 0) {
    const ln = ctx.linkedNotes.map(n =>
      `- "${n.title}" [${n.type}]${n.content ? `: ${n.content.slice(0, 120)}…` : ""}`
    ).join("\n");
    blocks.push(formatContextBlock("LINKED NOTES", ln));
  }

  // Connected: linked sources
  if (sel.includes("linked_sources") && ctx.linkedSources.length > 0) {
    const ls = ctx.linkedSources.map(s =>
      `- "${s.title}"${s.author ? ` by ${s.author}` : ""}${s.summary ? `\n  Summary: ${s.summary.slice(0, 150)}` : ""}${s.quote ? `\n  Quote: "${s.quote.slice(0, 100)}"` : ""}`
    ).join("\n");
    blocks.push(formatContextBlock("LINKED SOURCES", ls));
  }

  // Connected: linked drafts
  if (sel.includes("linked_drafts") && ctx.linkedDrafts.length > 0) {
    const ld = ctx.linkedDrafts.map(d => `- "${d.title}" [${d.type}]`).join("\n");
    blocks.push(formatContextBlock("LINKED DRAFTS", ld));
  }

  // Collections
  if (sel.includes("collections") && ctx.collections.length > 0) {
    const col = ctx.collections.map(c => `- ${c.name}`).join("\n");
    blocks.push(formatContextBlock("CURRENT COLLECTIONS", col));
  }

  // Backlinks
  if (sel.includes("backlinks") && ctx.backlinkedNotes.length > 0) {
    const bl = ctx.backlinkedNotes.map(n => `- "${n.title}" [${n.type}]`).join("\n");
    blocks.push(formatContextBlock("BACKLINKS (notes that reference this)", bl));
  }

  // Recent notes
  if (sel.includes("recent_notes") && ctx.recentNotes.length > 0) {
    const rn = ctx.recentNotes.map(n =>
      `- "${n.title}" [${n.type}]${n.content ? `: ${n.content.slice(0, 100)}…` : ""}`
    ).join("\n");
    blocks.push(formatContextBlock("RECENT NOTES IN PROJECT", rn));
  }

  // Task + desired output
  blocks.push(formatContextBlock("TASK", config.task));
  blocks.push(formatContextBlock("DESIRED OUTPUT STRUCTURE", config.desiredOutputStructure));

  const userPrompt = blocks.join("");

  return { systemPrompt, userPrompt, maxTokens: config.maxTokens };
}
