import OpenAI from "openai";
import type { AuthorRoleModel } from "@shared/schema";

export const EMBEDDING_MODEL = "text-embedding-3-small";

// ─── Build the text block that gets embedded ─────────────────────────────────
// Combines the 8 structured analysis fields into one labelled text block.
// Empty fields are skipped. The result is capped at 8 000 chars, which is well
// inside the 8 192-token context window of text-embedding-3-small.

export function buildEmbeddingText(model: {
  conceptualTendencies?: string | null;
  stylePatterns?: string | null;
  structurePatterns?: string | null;
  rhythmObservations?: string | null;
  vocabularyTendencies?: string | null;
  argumentBehavior?: string | null;
  emotionalDynamics?: string | null;
  reusableParameters?: string | null;
}): string {
  const sections: Array<[string, string | null | undefined]> = [
    ["Conceptual Tendencies", model.conceptualTendencies],
    ["Style Patterns", model.stylePatterns],
    ["Structure Patterns", model.structurePatterns],
    ["Rhythm Observations", model.rhythmObservations],
    ["Vocabulary Tendencies", model.vocabularyTendencies],
    ["Argument Behavior", model.argumentBehavior],
    ["Emotional Dynamics", model.emotionalDynamics],
    ["Reusable Parameters", model.reusableParameters],
  ];

  const parts = sections
    .filter(([, value]) => value?.trim())
    .map(([label, value]) => `[${label}]\n${value!.trim()}`);

  return parts.join("\n\n").slice(0, 8000);
}

// ─── Generate and store an embedding for one role model ───────────────────────
// Called fire-and-forget after deep analysis. Never throws — errors are logged.

export async function generateAndStoreEmbedding(
  ai: OpenAI,
  modelId: number,
  analysisFields: Parameters<typeof buildEmbeddingText>[0],
  updateFn: (
    id: number,
    data: { embeddingJson: string; embeddingModel: string; embeddingUpdatedAt: Date }
  ) => Promise<unknown>,
): Promise<void> {
  try {
    const input = buildEmbeddingText(analysisFields);
    if (!input.trim()) return;

    const response = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input,
    });

    const vector = response.data[0]?.embedding;
    if (!vector?.length) return;

    await updateFn(modelId, {
      embeddingJson: JSON.stringify(vector),
      embeddingModel: EMBEDDING_MODEL,
      embeddingUpdatedAt: new Date(),
    });
  } catch (err) {
    console.error(`[embeddings] Failed to generate embedding for role model ${modelId}:`, err);
  }
}

// ─── Cosine similarity ────────────────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

// ─── Find relevant role models for a given input text ────────────────────────
// Creates an embedding for `inputText` and ranks the book's active role models
// by cosine similarity. Models with no embedding are skipped gracefully.
// Returns results sorted descending by similarity score.

export async function findRelevantModels(
  ai: OpenAI,
  inputText: string,
  roleModels: AuthorRoleModel[],
): Promise<Array<{ model: AuthorRoleModel; score: number }>> {
  if (!inputText.trim() || roleModels.length === 0) return [];

  // Embed the input text
  let inputVector: number[];
  try {
    const response = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputText.slice(0, 8000),
    });
    inputVector = response.data[0]?.embedding;
    if (!inputVector?.length) return [];
  } catch (err) {
    console.error("[embeddings] Failed to embed input text:", err);
    return [];
  }

  const results: Array<{ model: AuthorRoleModel; score: number }> = [];

  for (const rm of roleModels) {
    if (!rm.embeddingJson?.trim()) continue;
    try {
      const vector: number[] = JSON.parse(rm.embeddingJson);
      if (!Array.isArray(vector) || vector.length === 0) continue;
      const score = cosineSimilarity(inputVector, vector);
      results.push({ model: rm, score });
    } catch {
      continue;
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
