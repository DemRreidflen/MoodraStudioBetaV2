/**
 * Moodra Professional Layout Engine
 *
 * Two-phase pipeline:
 *   Phase 1 – Line Layout   : canvas-based word-wrap → exact line counts & split points
 *   Phase 2 – Pagination    : line-level widow/orphan aware page distribution
 *
 * Key design choices:
 *  - Canvas measureText for accurate line counting (no estimation)
 *  - Paragraphs may be split at exact line boundaries (min 2 lines per side)
 *  - Headings are atomic and kept-with-next
 *  - Footer is always position:absolute — independent of content flow
 *  - No divider line above page numbers (spec requirement)
 */

// ─── Physical constants ────────────────────────────────────────────────
export const MM_TO_PX  = 96 / 25.4;  // 1 mm = 3.7795 CSS px
export const PT_TO_PX  = 96 / 72;    // 1 pt = 1.3333 CSS px

// Footer geometry constants (non-configurable per spec)
export const FOOTER_FROM_BOTTOM_MM = 8;   // page footer top-edge from page bottom
export const FOOTER_GAP_MM         = 3;   // reserved gap between content and footer zone

// ─── Block types ───────────────────────────────────────────────────────
const ATOMIC_TYPES = new Set([
  "h1", "heading", "h2", "h3",
  "divider", "pagebreak",
  "hypothesis", "argument", "counterargument", "idea", "question",
  "quote",
]);

const HEADING_TYPES = new Set(["h1", "heading", "h2", "h3"]);

// ─── Types ─────────────────────────────────────────────────────────────
export interface EngineBlock {
  type: string;
  content: string;   // HTML / plain text
}

/**
 * Per-block layout metrics produced by Phase 1.
 */
export interface BlockMeasure {
  chapterIdx: number;
  blockIdx:   number;
  block:      EngineBlock;

  // Line metrics
  lineCount:    number;   // total lines this block occupies
  lineHeightPx: number;   // height of one line in CSS px
  // splitPoints[i] = char offset (in plain text) where line i+1 starts.
  // Length == lineCount - 1. Used to split the block across pages.
  splitPoints: number[];

  // Box model (before/after the lines themselves)
  topPx:  number;   // padding / margin-top above lines
  botPx:  number;   // padding / margin-bottom below lines

  // totalHeightPx = topPx + lineCount * lineHeightPx + botPx
  totalHeightPx: number;

  // Runt / last-line metrics
  lastLineWordCount: number;  // words on the last line (used for runt detection)
  lastLineRatio:     number;  // last-line width as fraction of content width (0-1)
  lineRatios:        number[]; // per-line width ratios (length == lineCount); index i = line i

  // Rules
  isAtomic:      boolean;  // cannot be split across pages
  keepWithNext:  boolean;  // heading — must have successor on same page
}

/**
 * Compute the word count of a specific line within measured text.
 * Uses splitPoints to slice the plain text.
 */
function lineWordCount(plain: string, lineIndex: number, splitPoints: number[]): number {
  const start = lineIndex === 0 ? 0 : (splitPoints[lineIndex - 1] ?? 0);
  const end   = lineIndex >= splitPoints.length
    ? plain.length
    : (splitPoints[lineIndex] ?? plain.length);
  return plain.slice(start, end).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Returns true if the split at `splitIndex` (i.e. between lines `splitIndex` and
 * `splitIndex+1`) is a hyphenation split rather than a normal word-wrap split.
 *
 * Heuristic: a word-wrap split point always sits at the start of a new word,
 * so the character BEFORE the split point (at position `splitPoints[splitIndex] - 1`)
 * is a space.  A hyphenation split sits INSIDE a word, so the preceding character
 * is a letter.
 */
function isHyphenSplit(plain: string, splitIndex: number, splitPoints: number[]): boolean {
  const sp = splitPoints[splitIndex];
  if (sp === undefined || sp <= 0) return false;
  return plain[sp - 1] !== " ";
}

/**
 * Count the number of hyphenated line-ends in the range [startLine, endLine).
 * A line i is "hyphenated" when it ends with a hyphenation split, i.e.
 * splitPoints[i] is a hyphen split point.
 */
function countHyphensInRange(
  plain: string,
  splitPoints: number[],
  startLine: number,
  endLine: number,
): number {
  let n = 0;
  // Line i ends at splitPoints[i]; for i in [startLine, endLine - 1)
  for (let i = startLine; i < endLine - 1 && i < splitPoints.length; i++) {
    if (isHyphenSplit(plain, i, splitPoints)) n++;
  }
  return n;
}

/**
 * Compute the accurate height of the chapter-start header block.
 *
 * Matches the CSS structure:
 *   .chapter-header  (center-aligned, padding/margin bottom)
 *     .ch-label      (7pt uppercase label, margin-bottom: 8pt)
 *     h1.ch-title    (h1Size pt, line-height 1.2, margin-bottom: 12pt)
 *     .ch-ornament   (~4px dots)
 */
export function measureChapterHeaderPx(title: string, s: EngineSettings): number {
  const ps          = PAGE_SIZES[s.pageSize as keyof typeof PAGE_SIZES];
  const contentWPx  = (ps.width - s.marginLeft - s.marginRight) * MM_TO_PX;

  // ch-label
  const labelSizePx = 7 * PT_TO_PX;
  const labelLineH  = labelSizePx * 1.2;
  const labelMargin = 8 * PT_TO_PX;
  const labelH      = labelLineH + labelMargin;

  // h1.ch-title
  const h1SizePx   = s.h1Size * PT_TO_PX;
  const h1LineH    = h1SizePx * 1.2;
  const h1Spec     = `700 ${h1SizePx}px ${s.fontFamily.split(",")[0].trim().replace(/['"]/g, "") || "serif"}`;
  const titlePlain = stripHtml(title);
  const { lineCount: titleLines } = measureLines(titlePlain || " ", contentWPx, h1Spec, 0);
  const titleH     = titleLines * h1LineH + 12 * PT_TO_PX; // + margin-bottom

  // ch-ornament (three dots, fixed height)
  const ornamentH  = 8;

  // .chapter-header padding-bottom + margin-bottom
  const emPx       = s.fontSize * PT_TO_PX;
  const gapH       = (s.paragraphSpacing * 1.5 + s.paragraphSpacing) * emPx;

  return Math.ceil(labelH + titleH + ornamentH + gapH);
}

/**
 * A slice of a BlockMeasure that lives on one page.
 */
export interface PageSlot {
  measure:       BlockMeasure;
  startLine:     number;   // inclusive, 0-based
  endLine:       number;   // exclusive  (== measure.lineCount means full block)
  isFirstSlot:   boolean;  // startLine === 0
  isLastSlot:    boolean;  // endLine  === measure.lineCount
  // Pixel height of this slot (only the lines + relevant padding)
  slotHeightPx:  number;
}

/**
 * A single page produced by Phase 2.
 */
export interface LayoutPage {
  kind: "title" | "copyright" | "dedication" | "toc" | "chapter-start" | "chapter-cont";
  chapterIdx?:     number;
  chapterTitle?:   string;
  pageNumber:      number;
  slots:           PageSlot[];
  isLastOfChapter?: boolean;
}

/**
 * Subset of BookTypographySettings that the engine needs.
 */
export interface EngineSettings {
  pageSize:         "A4" | "A5" | "B5";
  marginTop:        number;
  marginBottom:     number;
  marginLeft:       number;
  marginRight:      number;

  fontSize:         number;   // pt
  lineHeight:       number;   // multiplier
  fontFamily:       string;

  paragraphSpacing: number;   // em
  firstLineIndent?: number;   // em (default 1.2)

  h1Size:           number;   // pt
  h2Size:           number;   // pt
  h3Size:           number;   // pt

  headerEnabled:    boolean;
  footerPageNumber: boolean;
  footerBookTitle:  boolean;
  textDensity?:     number;   // 0.5..1.0, default 0.88
}

/** FrontMatter shape (subset used by engine). */
export interface EngineFrontMatter {
  titlePage:      { enabled: boolean };
  copyrightPage:  { enabled: boolean };
  dedicationPage: { enabled: boolean };
  tocEnabled:     boolean;
}

export const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  B5: { width: 176, height: 250 },
} as const;

// ─── Canvas singleton ──────────────────────────────────────────────────
let _canvas: HTMLCanvasElement | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!_canvas) _canvas = document.createElement("canvas");
  return _canvas.getContext("2d");
}

function measurePx(text: string, font: string): number {
  const ctx = getCtx();
  if (!ctx) return text.length * 6; // SSR / test fallback
  ctx.font = font;
  return ctx.measureText(text).width;
}

// ─── Helper: strip HTML tags ───────────────────────────────────────────
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Phase 1: Line Layout ──────────────────────────────────────────────

/**
 * Hyphenation helper.
 *
 * Tries to split `word` such that (prefix + "-") fits in `remainPx`.
 * Returns the prefix (without the dash) if a valid split is found, else "".
 *
 * Rules (per spec):
 *  - Word must be >= 5 characters to be eligible for hyphenation.
 *  - Prefix (before dash) >= 2 characters.
 *  - Suffix (after dash)  >= 3 characters.
 */
function tryHyphenate(
  word: string,
  remainPx: number,
  ctx: CanvasRenderingContext2D,
): string {
  const MIN_BEFORE = 2;
  const MIN_AFTER  = 3;
  if (word.length < MIN_BEFORE + MIN_AFTER + 1) return ""; // too short
  const dashW = ctx.measureText("-").width;

  // Try longest prefix first (greedy — fill as much as possible)
  for (let i = word.length - MIN_AFTER; i >= MIN_BEFORE; i--) {
    const prefix = word.slice(0, i);
    const prefixW = ctx.measureText(prefix).width;
    if (prefixW + dashW <= remainPx) {
      return prefix;
    }
  }
  return "";
}

/**
 * Measure how many lines a plain-text string occupies inside `contentWidthPx`.
 *
 * Uses canvas measureText for accuracy.  When a word would overflow the line,
 * the function first attempts to hyphenate it (min 2 chars before the dash,
 * min 3 chars after; maximum 2 consecutive hyphenated lines).
 *
 * Returns:
 *  - lineCount    – total line count
 *  - splitPoints  – char offsets (in `text`) where each new line begins (length = lineCount-1)
 *  - lastLineRatio – width of the last line as a fraction of contentWidthPx (0..1)
 *  - lineRatios   – width ratio for EVERY line (length == lineCount); enables per-line quality checks
 */
export function measureLines(
  text: string,
  contentWidthPx: number,
  fontSpec: string,
  indentFirstLinePx = 0,
): { lineCount: number; splitPoints: number[]; lastLineRatio: number; lineRatios: number[] } {
  const trimmed = text.trim();
  if (!trimmed) return { lineCount: 1, splitPoints: [], lastLineRatio: 0, lineRatios: [0] };

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lineCount: 1, splitPoints: [], lastLineRatio: 0, lineRatios: [0] };

  const ctx = getCtx();

  // ── Fallback (SSR / headless): character-count estimate ──────────────
  if (!ctx) {
    const charsPerLine = Math.max(1, Math.floor(contentWidthPx / 6));
    const lineCount    = Math.max(1, Math.ceil(trimmed.length / charsPerLine));
    const sp: number[] = [];
    const lr: number[] = [];
    let pos = 0;
    for (let l = 1; l < lineCount; l++) {
      pos += charsPerLine;
      while (pos < trimmed.length && trimmed[pos] !== " ") pos++;
      sp.push(pos + 1);
      lr.push(1.0); // assume full lines in fallback
    }
    lr.push(0.5); // last line estimate
    return { lineCount, splitPoints: sp, lastLineRatio: 0.5, lineRatios: lr };
  }

  ctx.font = fontSpec;
  const spaceW  = ctx.measureText(" ").width;

  const splitPoints: number[]  = [];
  const lineRatios:  number[]  = []; // ratio for each completed line; filled on each wrap + at end
  let lineWidth   = 0;
  let isFirstLine = true;
  let charPos     = 0;
  let firstOnLine = true;
  let consecHyphens = 0; // consecutive hyphenated lines

  for (let wi = 0; wi < words.length; wi++) {
    const word  = words[wi];
    const ww    = ctx.measureText(word).width;
    const availW = isFirstLine ? contentWidthPx - indentFirstLinePx : contentWidthPx;
    const addW   = firstOnLine ? ww : spaceW + ww;

    if (!firstOnLine && lineWidth + addW > availW) {
      // Word doesn't fit.  Try hyphenation first.
      const remainW = availW - lineWidth - spaceW; // space before word not placed yet
      let hyphenPrefix = "";
      if (consecHyphens < 2) {
        hyphenPrefix = tryHyphenate(word, remainW, ctx);
      }

      if (hyphenPrefix) {
        // Put prefix+dash on current line; continue with remainder on next line
        lineWidth += spaceW + ctx.measureText(hyphenPrefix).width + ctx.measureText("-").width;
        // Save ratio of completed line before resetting
        lineRatios.push(Math.min(1, lineWidth / contentWidthPx));
        splitPoints.push(charPos + hyphenPrefix.length); // split inside the word
        lineWidth    = ctx.measureText(word.slice(hyphenPrefix.length)).width;
        isFirstLine  = false;
        firstOnLine  = false;
        consecHyphens++;
      } else {
        // Save ratio of completed line before resetting
        lineRatios.push(Math.min(1, lineWidth / contentWidthPx));
        // Wrap the whole word to a new line
        splitPoints.push(charPos);
        lineWidth    = ww;
        isFirstLine  = false;
        firstOnLine  = false;
        consecHyphens = 0;
      }
    } else {
      lineWidth  += addW;
      firstOnLine = false;
      consecHyphens = 0;
    }

    charPos += word.length + 1; // +1 for the space separator
  }

  const lastLineRatio = Math.min(1, lineWidth / contentWidthPx);
  lineRatios.push(lastLineRatio); // last line ratio
  return { lineCount: splitPoints.length + 1, splitPoints, lastLineRatio, lineRatios };
}

/**
 * Compute a CSS font spec string usable in canvas.measureText.
 */
function fontSpec(family: string, sizePx: number, weight = "normal"): string {
  // Extract the first family name (remove quotes, fallbacks)
  const fam = family.split(",")[0].trim().replace(/['"]/g, "") || "serif";
  return `${weight} ${sizePx}px ${fam}`;
}

/**
 * Build a BlockMeasure for a single block.
 */
export function measureBlock(
  block: EngineBlock,
  chapterIdx: number,
  blockIdx: number,
  s: EngineSettings,
): BlockMeasure {
  const ps = PAGE_SIZES[s.pageSize as keyof typeof PAGE_SIZES];
  const contentWPx  = (ps.width - s.marginLeft - s.marginRight) * MM_TO_PX;
  const lineHPx     = s.fontSize * PT_TO_PX * s.lineHeight;
  const spPx        = s.paragraphSpacing * s.fontSize * PT_TO_PX;
  const indentPx    = (s.firstLineIndent ?? 1.2) * s.fontSize * PT_TO_PX;
  const isAtomic    = ATOMIC_TYPES.has(block.type);
  const isHeading   = HEADING_TYPES.has(block.type);

  // ── Special: pagebreak ─────────────────────────────────────────────
  if (block.type === "pagebreak") {
    return {
      chapterIdx, blockIdx, block,
      lineCount: 0, lineHeightPx: lineHPx, splitPoints: [],
      topPx: 0, botPx: 0, totalHeightPx: 0,
      lastLineWordCount: 0, lastLineRatio: 1, lineRatios: [],
      isAtomic: true, keepWithNext: false,
    };
  }

  // ── Special: divider ───────────────────────────────────────────────
  if (block.type === "divider") {
    return {
      chapterIdx, blockIdx, block,
      lineCount: 1, lineHeightPx: lineHPx, splitPoints: [],
      topPx: lineHPx * 0.5, botPx: lineHPx * 0.5,
      totalHeightPx: lineHPx * 2,
      lastLineWordCount: 0, lastLineRatio: 1, lineRatios: [1],
      isAtomic: true, keepWithNext: false,
    };
  }

  const plain = stripHtml(block.content);

  // ── Headings ───────────────────────────────────────────────────────
  if (block.type === "h1" || block.type === "heading") {
    const sizePx   = s.h1Size * PT_TO_PX;
    const lhPx     = sizePx * 1.25;
    const spec     = fontSpec(s.fontFamily, sizePx, "700");
    const { lineCount, splitPoints } = measureLines(plain, contentWPx, spec, 0);
    const topPx    = lhPx * 2;
    const botPx    = lhPx * 0.8;
    return {
      chapterIdx, blockIdx, block,
      lineCount, lineHeightPx: lhPx, splitPoints: [],
      topPx, botPx, totalHeightPx: topPx + lineCount * lhPx + botPx,
      lastLineWordCount: lineWordCount(plain, lineCount - 1, splitPoints), lastLineRatio: 1,
      lineRatios: Array(lineCount).fill(1),
      isAtomic: true, keepWithNext: true,
    };
  }

  if (block.type === "h2") {
    const sizePx   = s.h2Size * PT_TO_PX;
    const lhPx     = sizePx * 1.25;
    const spec     = fontSpec(s.fontFamily, sizePx, "700");
    const { lineCount, splitPoints } = measureLines(plain, contentWPx, spec, 0);
    const topPx    = lhPx * 1.5;
    const botPx    = lhPx * 0.6;
    return {
      chapterIdx, blockIdx, block,
      lineCount, lineHeightPx: lhPx, splitPoints: [],
      topPx, botPx, totalHeightPx: topPx + lineCount * lhPx + botPx,
      lastLineWordCount: lineWordCount(plain, lineCount - 1, splitPoints), lastLineRatio: 1,
      lineRatios: Array(lineCount).fill(1),
      isAtomic: true, keepWithNext: true,
    };
  }

  if (block.type === "h3") {
    const sizePx   = Math.max(s.h3Size, 10) * PT_TO_PX;
    const lhPx     = sizePx * 1.25;
    const spec     = fontSpec(s.fontFamily, sizePx, "600");
    const { lineCount, splitPoints } = measureLines(plain, contentWPx, spec, 0);
    const topPx    = lhPx * 1.2;
    const botPx    = lhPx * 0.5;
    return {
      chapterIdx, blockIdx, block,
      lineCount, lineHeightPx: lhPx, splitPoints: [],
      topPx, botPx, totalHeightPx: topPx + lineCount * lhPx + botPx,
      lastLineWordCount: lineWordCount(plain, lineCount - 1, splitPoints), lastLineRatio: 1,
      lineRatios: Array(lineCount).fill(1),
      isAtomic: true, keepWithNext: true,
    };
  }

  // ── Quote ──────────────────────────────────────────────────────────
  if (block.type === "quote") {
    const spec = fontSpec(s.fontFamily, s.fontSize * PT_TO_PX, "normal");
    // Quotes are inset — effective width ~75%
    const { lineCount, splitPoints, lastLineRatio, lineRatios } = measureLines(plain, contentWPx * 0.75, spec, 0);
    const topPx = lineHPx * 0.4;
    const botPx = spPx * 1.2;
    return {
      chapterIdx, blockIdx, block,
      lineCount, lineHeightPx: lineHPx, splitPoints,
      topPx, botPx, totalHeightPx: topPx + lineCount * lineHPx + botPx,
      lastLineWordCount: lineWordCount(plain, lineCount - 1, splitPoints), lastLineRatio, lineRatios,
      isAtomic: false, keepWithNext: false,
    };
  }

  // ── Callouts ───────────────────────────────────────────────────────
  if (isAtomic) {
    // hypothesis / argument / counterargument / idea / question
    const calloutSizePx = (s.fontSize - 0.5) * PT_TO_PX;
    const spec = fontSpec(s.fontFamily, calloutSizePx, "normal");
    // Callouts are slightly inset
    const { lineCount } = measureLines(plain, contentWPx * 0.85, spec, 0);
    const topPx  = 6;
    const botPx  = spPx * 0.8 + 6;
    return {
      chapterIdx, blockIdx, block,
      lineCount, lineHeightPx: lineHPx, splitPoints: [],
      topPx, botPx, totalHeightPx: topPx + lineCount * lineHPx + botPx,
      lastLineWordCount: 2, lastLineRatio: 1, lineRatios: Array(lineCount).fill(1),
      isAtomic: true, keepWithNext: false,
    };
  }

  // ── Standard paragraph ────────────────────────────────────────────
  const spec = fontSpec(s.fontFamily, s.fontSize * PT_TO_PX, "normal");
  const { lineCount, splitPoints, lastLineRatio, lineRatios } = measureLines(plain, contentWPx, spec, indentPx);
  const actualLineCount = Math.max(1, lineCount);
  const lastLW = lineWordCount(plain, actualLineCount - 1, splitPoints);
  return {
    chapterIdx, blockIdx, block,
    lineCount: actualLineCount, lineHeightPx: lineHPx, splitPoints,
    topPx: 0, botPx: spPx,
    totalHeightPx: actualLineCount * lineHPx + spPx,
    lastLineWordCount: lastLW, lastLineRatio,
    lineRatios: lineRatios.length === actualLineCount ? lineRatios : [...lineRatios, ...Array(Math.max(0, actualLineCount - lineRatios.length)).fill(lastLineRatio)],
    isAtomic: false, keepWithNext: false,
  };
}

// ─── Phase 2: Pagination Pipeline ─────────────────────────────────────
//
// Architecture (matches spec §16):
//
//   paginateMeasures()          ← public entry point
//     └─ paginateChapter()      ← per-chapter loop
//          ├─ processBlock()    ← routing: fits / atomic / splittable
//          ├─ scoreBreakCandidate()  ← scoring: fill + rhythm + typo penalties
//          └─ commitPage()      ← validates + records cross-page state
//
// All page-scoring constants live inside scoreBreakCandidate() so they
// can be read as a coherent "scoring policy" document.

// ── Widow / orphan constants ──────────────────────────────────────────

/** Minimum lines per paragraph fragment per page (widow/orphan rule). */
const MIN_LINES = 2;

/**
 * Minimum lines that must follow a heading on the same page.
 * If fewer lines of the successor block would fit, the heading is deferred
 * to the next page so it is never left dangling at the bottom.
 */
const MIN_LINES_AFTER_HEADING = 3;

// ── Page geometry (computed once per paginateMeasures call) ──────────

/**
 * Pre-computed page geometry constants, computed from EngineSettings.
 * Passed to all sub-functions so they never re-derive the same values.
 */
interface PageGeometry {
  contentHeightPx:  number;  // usable content area per page (px)
  lineHPx:          number;  // one text line in px
  maxHyphensPerPage: number; // hard hyphen limit per page
}

function computeGeometry(s: EngineSettings): PageGeometry {
  const ps = PAGE_SIZES[s.pageSize as keyof typeof PAGE_SIZES];

  const pageInnerPx        = (ps.height - s.marginTop - s.marginBottom) * MM_TO_PX;
  const headerPx           = s.headerEnabled ? Math.ceil(7 * PT_TO_PX * 1.2 + 20) : 0;
  const footerLineH        = Math.ceil(8 * PT_TO_PX * 1.2);
  const footerFromBottomPx = FOOTER_FROM_BOTTOM_MM * MM_TO_PX;
  const footerGapPx        = FOOTER_GAP_MM * MM_TO_PX;
  const marginBottomPx     = s.marginBottom * MM_TO_PX;
  const footerReductionPx  = (s.footerPageNumber || s.footerBookTitle)
    ? Math.max(0, footerFromBottomPx + footerLineH + footerGapPx - marginBottomPx)
    : 0;

  const lineHPx = s.fontSize * PT_TO_PX * s.lineHeight;

  // SAFETY_BUFFER_PX: 1 full line-height of clearance above footer zone.
  // Prevents sub-pixel rounding from producing footer collisions.
  const SAFETY_BUFFER_PX = Math.ceil(lineHPx * 1.0);
  const contentHeightPx  = pageInnerPx - headerPx - footerReductionPx - SAFETY_BUFFER_PX;

  return { contentHeightPx, lineHPx, maxHyphensPerPage: 3 };
}

// ── Mutable per-chapter state ─────────────────────────────────────────

/**
 * All mutable state for one chapter's pagination pass.
 * Cross-page fields (lastContPageFill, isFirstContPage) survive across
 * individual page flushes and drive the bottom-rhythm scoring.
 */
interface ChapterContext {
  currentSlots:   PageSlot[];
  usedPx:         number;
  isFirstPage:    boolean;    // true until first flushPage call
  hyphensOnPage:  number;

  // Bottom-rhythm tracking: keeps fill consistent across normal text pages.
  // Initialised to 0.92 (the target fill) so the first cont-page uses
  // the target as its rhythm baseline rather than comparing to nothing.
  lastContPageFill:    number;
  isFirstContPage:     boolean; // suppress rhythm penalty on page-2 (no prior ref)
}

// ── Slot geometry helpers ─────────────────────────────────────────────

// ── Page validation (spec §20: validatePage) ──────────────────────────

/**
 * Validate a completed page's slots before committing them.
 *
 * Checks (in priority order):
 *   1. No overflow — total slot height must not exceed contentHeightPx
 *   2. No orphan top — first slot (if continuation) must have >= MIN_LINES
 *   3. No orphan bottom — last slot must have >= MIN_LINES lines
 *
 * Returns a list of issue strings.  An empty array means the page is valid.
 * Validation failures are logged as warnings; the engine does not retry
 * (retrying requires a full global optimiser — see future work).
 */
function validatePageSlots(
  slots:            PageSlot[],
  contentHeightPx:  number,
): string[] {
  const issues: string[] = [];

  // 1. Overflow check
  const totalPx = slots.reduce((sum, s) => sum + s.slotHeightPx, 0);
  if (totalPx > contentHeightPx + 1) { // +1 for floating-point tolerance
    issues.push(`overflow: ${totalPx.toFixed(1)}px > ${contentHeightPx.toFixed(1)}px`);
  }

  if (slots.length === 0) return issues;

  // 2. Orphan at top: a continuation slot (startLine > 0) with too few lines
  const first = slots[0];
  if (!first.isFirstSlot && (first.endLine - first.startLine) < MIN_LINES) {
    issues.push(`orphan-top: ${first.endLine - first.startLine} lines`);
  }

  // 3. Orphan / widow at bottom: last slot with too few lines
  const last = slots[slots.length - 1];
  if (!last.isLastSlot && (last.endLine - last.startLine) < MIN_LINES) {
    issues.push(`orphan-bottom: ${last.endLine - last.startLine} lines`);
  }

  return issues;
}

// ── Candidate scoring (spec §8: Page Scoring System) ─────────────────

/**
 * Compute the typographic penalty for splitting block `m` so that
 * `linesOnFirst` lines go on the current page.
 *
 * Returns a penalty score ≥ 0 (lower = better).  Returns 1e9 (INVALID)
 * if the split violates a hard structural constraint.
 *
 * ── Scoring policy ───────────────────────────────────────────────────
 *
 * Priority order (highest first — a higher-priority penalty always
 * outweighs any amount of lower-priority penalties in practice):
 *
 *   1. HARD: structural validity (MIN_LINES on both sides)
 *   2. WIDOW_P (800)   — 1 continuation line on next page
 *   3. FILL linear (3000/unit) — page below 92% fill target
 *   4. RUNT_P (150)    — bottom line < 2 words or < 40% measure
 *   5. BOTTOM_RHYTHM_P (300/unit) — fill differs from previous page
 *   6. FEW_NEXT_P (300/line) — fewer than 3 continuation lines
 *   7. HYPH_BOT_P (500) — word broken at page boundary
 *   8. HYPH_EX_P (200/hyph) — over MAX_HYPHENS_PER_PAGE
 *
 * Crossover thresholds (fill wins vs. penalty at fill deficit x):
 *   Runt (150)    → x > 5%   → fill wins at fill < 87%
 *   Widow (800)   → x > 27%  → fill wins at fill < 65%  (almost never)
 *   HyphBot (500) → x > 17%  → fill wins at fill < 75%
 */
function scoreBreakCandidate(
  linesOnFirst:   number,
  m:              BlockMeasure,
  ctx:            ChapterContext,
  geom:           PageGeometry,
  plain:          string,
): number {
  const INVALID        = 1e9;

  // ── Constants ─────────────────────────────────────────────────────
  const MIN_LINES_NEXT  = 3;     // soft minimum continuation lines on next page
  const MIN_FILL        = 0.92;  // target fill band: 92–97%
  const FILL_W          = 3000;  // LINEAR weight — dominates for deficits > 5%
  const RUNT_P          = 150;   // short/single-word bottom line
  const WIDOW_P         = 800;   // 1-line continuation widow
  const BOTTOM_RHYTHM_W = 300;   // cross-page fill consistency
  const FEW_NEXT_P      = 300;   // per-line shortfall below MIN_LINES_NEXT
  const HYPH_BOT_P      = 500;   // hyphenated word at page boundary
  const HYPH_EX_P       = 200;   // per-hyphen over page limit

  // ── Hard constraints ──────────────────────────────────────────────
  if (linesOnFirst < MIN_LINES) return INVALID;
  const linesOnNext = m.lineCount - linesOnFirst;
  if (linesOnNext < MIN_LINES) return INVALID;

  // ── 1. Fill (spec §9: Page Density) ──────────────────────────────
  // LINEAR penalty below MIN_FILL.  Small deficits are meaningfully
  // penalised: 2% deficit → 60, 5% → 150, 10% → 300.
  const topOverhead  = m.topPx; // always the first slot here
  const filledPx     = ctx.usedPx + topOverhead + linesOnFirst * m.lineHeightPx;
  const fillRatio    = Math.min(1, filledPx / geom.contentHeightPx);
  const deficit      = Math.max(0, MIN_FILL - fillRatio);
  const unusedPenalty = deficit * FILL_W;

  // ── 2. Runt (spec §11: Short Last Line) ──────────────────────────
  const bottomIdx    = linesOnFirst - 1;
  const wCount       = lineWordCount(plain, bottomIdx, m.splitPoints);
  const lRatio       = m.lineRatios[bottomIdx] ?? 1;
  const runtPenalty  = (wCount < 2 || lRatio < 0.40) ? RUNT_P : 0;

  // ── 3. Widow (spec §6: Widow Control) ────────────────────────────
  const widowPenalty = linesOnNext === 1 ? WIDOW_P : 0;

  // ── 4. Bottom Rhythm (spec §10: Bottom Rhythm) ───────────────────
  // Penalise candidates that would make the current page end at a very
  // different fill level from the previous chapter-cont page.
  // Exempt: chapter-start pages (isFirstPage) and the very first
  // chapter-cont page (isFirstContPage) — no prior reference exists.
  const bottomRhythmPenalty = (!ctx.isFirstPage && !ctx.isFirstContPage)
    ? Math.abs(fillRatio - ctx.lastContPageFill) * BOTTOM_RHYTHM_W
    : 0;

  // ── 5. Too few continuation lines (spec §12: Ugly Paragraph Split) ─
  const fewNextPenalty = linesOnNext < MIN_LINES_NEXT
    ? (MIN_LINES_NEXT - linesOnNext) * FEW_NEXT_P
    : 0;

  // ── 6. Hyphen at page boundary (spec §5.2) ───────────────────────
  const hyphenBotPenalty = isHyphenSplit(plain, bottomIdx, m.splitPoints) ? HYPH_BOT_P : 0;

  // ── 7. Hyphen excess (spec §5.1) ─────────────────────────────────
  const slotH         = countHyphensInRange(plain, m.splitPoints, 0, linesOnFirst);
  const hyphenExcess  = Math.max(0, ctx.hyphensOnPage + slotH - geom.maxHyphensPerPage);
  const hyphenExPenalty = hyphenExcess * HYPH_EX_P;

  return unusedPenalty + runtPenalty + widowPenalty + bottomRhythmPenalty
       + fewNextPenalty + hyphenBotPenalty + hyphenExPenalty;
}

function slotHeight(m: BlockMeasure, startLine: number, endLine: number): number {
  if (m.lineCount === 0) return m.totalHeightPx;
  const linesInSlot = endLine - startLine;
  const includeTop  = startLine === 0;
  const includeBot  = endLine   === m.lineCount;
  return (includeTop ? m.topPx : 0)
    + linesInSlot * m.lineHeightPx
    + (includeBot ? m.botPx : 0);
}

function makeSlot(m: BlockMeasure, startLine: number, endLine: number): PageSlot {
  return {
    measure:      m,
    startLine,
    endLine,
    isFirstSlot:  startLine === 0,
    isLastSlot:   endLine   === m.lineCount,
    slotHeightPx: slotHeight(m, startLine, endLine),
  };
}

/**
 * Phase 2B: Commit a completed page and update cross-page rhythm state.
 *
 * Pipeline step (spec §16: "render page"):
 *   validate → record lastContPageFill → push to output → reset context
 */
function commitPage(
  pages:        LayoutPage[],
  ctx:          ChapterContext,
  ci:           number,
  chTitle:      string,
  pageNumRef:   { n: number },
  geom:         PageGeometry,
  isLast:       boolean,
): void {
  // Validate (spec §20: validatePage) — logs issues but does not retry.
  // A full retry would require a global optimizer; logged for diagnostics.
  const issues = validatePageSlots(ctx.currentSlots, geom.contentHeightPx);
  if (issues.length > 0 && typeof console !== "undefined") {
    console.warn(`[layout] page ${pageNumRef.n} validation:`, issues.join(", "));
  }

  // Track fill of chapter-cont pages for bottom-rhythm scoring.
  // Chapter-start pages are always shorter (chapter header takes space) —
  // do not use them as a rhythm reference.
  if (!ctx.isFirstPage) {
    ctx.lastContPageFill = ctx.usedPx / geom.contentHeightPx;
    ctx.isFirstContPage  = false;
  }

  pages.push({
    kind:            ctx.isFirstPage ? "chapter-start" : "chapter-cont",
    chapterIdx:      ci,
    chapterTitle:    ctx.isFirstPage ? chTitle : "",
    pageNumber:      pageNumRef.n++,
    slots:           ctx.currentSlots,
    isLastOfChapter: isLast,
  });

  ctx.currentSlots  = [];
  ctx.usedPx        = 0;
  ctx.isFirstPage   = false;
  ctx.hyphensOnPage = 0;
}

/**
 * Phase 2C: Paginate one chapter.
 *
 * Block routing pipeline (spec §16):
 *   pagebreak → empty-page → fits-entirely → atomic → splittable
 *
 * For splittable paragraphs, scoreBreakCandidate() evaluates up to
 * MAX_CANDIDATES break positions and the lowest-score candidate wins.
 */
function paginateChapter(
  chMeasures:      BlockMeasure[],
  ci:              number,
  chTitle:         string,
  chapterHeaderPx: number,
  pages:           LayoutPage[],
  pageNumRef:      { n: number },
  geom:            PageGeometry,
): void {
  const { contentHeightPx, lineHPx } = geom;
  const MAX_CANDIDATES = 8;

  const ctx: ChapterContext = {
    currentSlots:     [],
    usedPx:           chapterHeaderPx,
    isFirstPage:      true,
    hyphensOnPage:    0,
    lastContPageFill: 0.92,   // start at target for first rhythm comparison
    isFirstContPage:  true,
  };

  const flushPage = (isLast: boolean) =>
    commitPage(pages, ctx, ci, chTitle, pageNumRef, geom, isLast);

  for (let mi = 0; mi < chMeasures.length; mi++) {
    const m = chMeasures[mi];

    // ── 1. Explicit page break ────────────────────────────────────────
    if (m.block.type === "pagebreak") {
      flushPage(false);
      continue;
    }

    // ── 2. Empty page — must place something ─────────────────────────
    if (ctx.currentSlots.length === 0) {
      const plain0 = stripHtml(m.block.content);
      ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
      ctx.hyphensOnPage += countHyphensInRange(plain0, m.splitPoints, 0, m.lineCount);
      ctx.usedPx += m.totalHeightPx;
      continue;
    }

    // ── 3. Block fits entirely ────────────────────────────────────────
    if (ctx.usedPx + m.totalHeightPx <= contentHeightPx) {
      if (m.keepWithNext && mi + 1 < chMeasures.length) {
        const next           = chMeasures[mi + 1];
        const afterHeadingPx = contentHeightPx - ctx.usedPx - m.totalHeightPx;
        const linesAfter     = Math.floor((afterHeadingPx - next.topPx) / next.lineHeightPx);
        if (linesAfter < MIN_LINES_AFTER_HEADING) {
          flushPage(false);
          ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
          ctx.usedPx = m.totalHeightPx;
          ctx.hyphensOnPage += countHyphensInRange(stripHtml(m.block.content), m.splitPoints, 0, m.lineCount);
          continue;
        }
      }
      ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
      ctx.usedPx += m.totalHeightPx;
      ctx.hyphensOnPage += countHyphensInRange(stripHtml(m.block.content), m.splitPoints, 0, m.lineCount);
      continue;
    }

    // ── 4. Atomic block — cannot be split (spec §14: Page Types) ─────
    if (m.isAtomic) {
      if (ctx.currentSlots.length > 1) {
        const last = ctx.currentSlots[ctx.currentSlots.length - 1];
        if (!last.measure.keepWithNext && last.slotHeightPx < lineHPx * MIN_LINES) {
          ctx.currentSlots.pop();
          const saved = last;
          flushPage(false);
          ctx.currentSlots.push(saved);
          ctx.usedPx = saved.slotHeightPx;
        } else {
          flushPage(false);
        }
      } else {
        flushPage(false);
      }
      ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
      ctx.usedPx += m.totalHeightPx;
      continue;
    }

    // ── 5. Splittable paragraph — candidate scoring ───────────────────
    //
    // Implements spec §7.1 Candidate Breakpoints + §8 Page Scoring.
    // scoreBreakCandidate() contains all penalty weights and the full
    // scoring policy including fill, rhythm, runt, widow, and hyphens.
    const topOverhead    = m.topPx;
    const remainForLines = contentHeightPx - ctx.usedPx - topOverhead;
    const availableLines = Math.max(0, Math.floor(remainForLines / m.lineHeightPx));
    const plain          = stripHtml(m.block.content);

    if (availableLines <= 0) {
      flushPage(false);
      ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
      ctx.usedPx = m.totalHeightPx;
      ctx.hyphensOnPage += countHyphensInRange(plain, m.splitPoints, 0, m.lineCount);
      continue;
    }

    const maxLinesOnFirst = Math.min(availableLines, m.lineCount - MIN_LINES);

    if (maxLinesOnFirst >= MIN_LINES) {
      let bestLines = -1;
      let bestScore = 1e9;

      for (let c = 0; c < MAX_CANDIDATES; c++) {
        const candidate = maxLinesOnFirst - c;
        if (candidate < MIN_LINES) break;
        const score = scoreBreakCandidate(candidate, m, ctx, geom, plain);
        if (score < bestScore) {
          bestScore = score;
          bestLines = candidate;
        }
        if (bestScore === 0) break;
      }

      if (bestLines >= MIN_LINES) {
        ctx.currentSlots.push(makeSlot(m, 0, bestLines));
        ctx.usedPx += slotHeight(m, 0, bestLines);
        flushPage(false);
        const nextH = countHyphensInRange(plain, m.splitPoints, bestLines, m.lineCount);
        ctx.currentSlots.push(makeSlot(m, bestLines, m.lineCount));
        ctx.usedPx = slotHeight(m, bestLines, m.lineCount);
        ctx.hyphensOnPage += nextH;
      } else {
        flushPage(false);
        ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
        ctx.usedPx = m.totalHeightPx;
        ctx.hyphensOnPage += countHyphensInRange(plain, m.splitPoints, 0, m.lineCount);
      }
    } else {
      // Block too short to split with widow/orphan rules — move whole block.
      // Pull trailing orphan along if the last slot on this page is very short.
      if (ctx.currentSlots.length > 1) {
        const last = ctx.currentSlots[ctx.currentSlots.length - 1];
        if (!last.measure.keepWithNext && last.slotHeightPx < lineHPx * MIN_LINES) {
          ctx.currentSlots.pop();
          const saved = last;
          flushPage(false);
          ctx.currentSlots.push(saved);
          ctx.usedPx = saved.slotHeightPx;
        } else {
          flushPage(false);
        }
      } else {
        flushPage(false);
      }
      ctx.currentSlots.push(makeSlot(m, 0, m.lineCount));
      ctx.usedPx = m.totalHeightPx;
      ctx.hyphensOnPage += countHyphensInRange(plain, m.splitPoints, 0, m.lineCount);
    }
  }

  flushPage(true);
}

/**
 * Phase 2 public entry point.
 *
 * Full pipeline (spec §16):
 *   Phase 2A — Geometry (computeGeometry)
 *   Phase 2B — Front-matter pages
 *   Phase 2C — Chapter pages (paginateChapter × N chapters)
 *   Phase 2D — Tag isLastOfChapter
 */
export function paginateMeasures(
  measures:    BlockMeasure[][],
  chapterMeta: { title: string }[],
  s:           EngineSettings,
  fm:          EngineFrontMatter,
): LayoutPage[] {
  const geom = computeGeometry(s);

  const pages: LayoutPage[]   = [];
  const pageNumRef             = { n: 1 };

  if (fm.titlePage.enabled)      pages.push({ kind: "title",      pageNumber: pageNumRef.n++, slots: [] });
  if (fm.copyrightPage.enabled)  pages.push({ kind: "copyright",  pageNumber: pageNumRef.n++, slots: [] });
  if (fm.dedicationPage.enabled) pages.push({ kind: "dedication", pageNumber: pageNumRef.n++, slots: [] });
  if (fm.tocEnabled)             pages.push({ kind: "toc",        pageNumber: pageNumRef.n++, slots: [] });

  for (let ci = 0; ci < measures.length; ci++) {
    const chMeasures      = measures[ci];
    const chTitle         = chapterMeta[ci]?.title ?? "";
    const chapterHeaderPx = measureChapterHeaderPx(chTitle, s);

    if (chMeasures.length === 0) {
      pages.push({
        kind: "chapter-start", chapterIdx: ci,
        chapterTitle: chTitle, pageNumber: pageNumRef.n++,
        slots: [], isLastOfChapter: true,
      });
      continue;
    }

    paginateChapter(chMeasures, ci, chTitle, chapterHeaderPx, pages, pageNumRef, geom);
  }

  for (let i = 0; i < pages.length; i++) {
    const cur  = pages[i];
    const next = pages[i + 1];
    if (cur.kind === "chapter-start" || cur.kind === "chapter-cont") {
      const isLast = !next
        || next.chapterIdx !== cur.chapterIdx
        || next.kind === "chapter-start"
        || next.kind === "title"
        || next.kind === "copyright"
        || next.kind === "toc"
        || next.kind === "dedication";
      cur.isLastOfChapter = isLast;
    }
  }

  return pages;
}

// ─── Split a block's HTML/plain text at a line boundary ───────────────
/**
 * Given a block and a splitPoints array from measureLines, extract the
 * plain-text content for lines [startLine, endLine).
 * Returns a new Block with that text slice.
 *
 * Critical: if the slot ends at a hyphenation split (i.e. the last line of
 * this slot was word-split with a "-"), we append "-" to the text so the
 * rendered output always shows the required hyphen.  Without this, a word
 * broken across a page break would appear without its dash.
 */
export function extractBlockLines(
  block:      EngineBlock,
  startLine:  number,
  endLine:    number,
  splitPoints: number[],
): EngineBlock {
  const plain = stripHtml(block.content);

  if (startLine === 0 && endLine >= splitPoints.length + 1) {
    return block; // full block — no change
  }

  const charStart = startLine === 0 ? 0 : (splitPoints[startLine - 1] ?? 0);
  const isLastSlot = endLine >= splitPoints.length + 1;
  const charEnd   = isLastSlot
    ? plain.length
    : (splitPoints[endLine - 1] ?? plain.length);

  let text = plain.slice(charStart, charEnd).trim();

  // If this slot ends at a hyphenation split (not the final line of the block),
  // append the mandatory dash.  Detection: the character immediately before the
  // split point is a non-space letter (see `isHyphenSplit`).
  if (!isLastSlot) {
    const lastSplitIdx = endLine - 1; // index into splitPoints[]
    if (isHyphenSplit(plain, lastSplitIdx, splitPoints)) {
      text = text + "-";
    }
  }

  return { type: block.type, content: text };
}
