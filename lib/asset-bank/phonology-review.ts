import { armoniaAssetPhonologyCandidates, type AssetPhonologyCandidate } from "../../data/armonia-assets/phonology-candidates.ts";
import { armoniaAssetPhonology } from "../../data/armonia-assets/phonology.ts";
import { getAssets } from "./catalog.ts";
import type { AssetEntry, AssetPhonologyMetadata } from "./types.ts";
import { validateAssetCatalog } from "./validation.ts";

export const PHONOLOGY_REVIEW_DECISION_STATUSES = ["approved", "corrected", "deferred"] as const;
export type PhonologyReviewDecisionStatus = typeof PHONOLOGY_REVIEW_DECISION_STATUSES[number];
export type PhonologyReviewDecision = { assetId: string; status: PhonologyReviewDecisionStatus; metadata?: AssetPhonologyMetadata; updatedAt: string };
export type PhonologyReviewDecisions = Record<string, PhonologyReviewDecision>;
export type PhonologyReviewItem = { asset: AssetEntry; candidate: AssetPhonologyCandidate; classification: "linear" | "attention"; reason?: string };

export function getPhonologyReviewItems(): readonly PhonologyReviewItem[] {
  const catalog = new Map(getAssets().map((asset) => [asset.id, asset]));
  const reviewed = new Set(Object.keys(armoniaAssetPhonology)), seen = new Set<string>();
  const items = armoniaAssetPhonologyCandidates.map((candidate) => {
    if (reviewed.has(candidate.assetId)) throw new Error(`Candidato già revisionato: ${candidate.assetId}`);
    if (seen.has(candidate.assetId)) throw new Error(`Candidato duplicato: ${candidate.assetId}`);
    seen.add(candidate.assetId);
    const asset = catalog.get(candidate.assetId);
    if (!asset) throw new Error(`Candidato inesistente nel catalogo: ${candidate.assetId}`);
    return { asset, candidate, classification: candidate.pronunciationNotes ? "attention" : "linear", reason: candidate.pronunciationNotes } as const;
  });
  return items;
}

export function proposedMetadata(candidate: AssetPhonologyCandidate): AssetPhonologyMetadata {
  const { assetId: _assetId, ...metadata } = candidate;
  return { ...metadata, phonologyReviewStatus: "reviewed" };
}

function isObject(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function validateCorrectedPhonology(asset: AssetEntry, input: unknown): { ok: true; metadata: AssetPhonologyMetadata } | { ok: false; errors: string[] } {
  if (!isObject(input)) return { ok: false, errors: ["Metadati corretti non validi."] };
  if (!Array.isArray(input.phonemes) || !Array.isArray(input.consonantClusters) || !Array.isArray(input.geminates)) return { ok: false, errors: ["Fonemi, cluster e geminate devono essere elenchi validi."] };
  const metadata: AssetPhonologyMetadata = {
    syllabification: typeof input.syllabification === "string" ? input.syllabification.trim() : "",
    syllableCount: typeof input.syllableCount === "number" ? input.syllableCount : Number(input.syllableCount),
    phonemicTranscription: typeof input.phonemicTranscription === "string" ? input.phonemicTranscription.trim() : "",
    phonemes: input.phonemes as AssetPhonologyMetadata["phonemes"],
    consonantClusters: input.consonantClusters as AssetPhonologyMetadata["consonantClusters"],
    geminates: input.geminates as string[],
    pronunciationNotes: typeof input.pronunciationNotes === "string" && input.pronunciationNotes.trim() ? input.pronunciationNotes.trim() : undefined,
    phonologyReviewStatus: "reviewed",
  };
  const shapeErrors: string[] = [];
  for (const phoneme of metadata.phonemes || []) if (!isObject(phoneme) || typeof phoneme.symbol !== "string") shapeErrors.push("Ogni fonema deve avere un simbolo valido.");
  for (const cluster of metadata.consonantClusters || []) if (!isObject(cluster) || !Array.isArray(cluster.phonemes) || cluster.phonemes.some((symbol) => typeof symbol !== "string")) shapeErrors.push("Ogni cluster deve avere un elenco di fonemi valido.");
  if ((metadata.geminates || []).some((symbol) => typeof symbol !== "string")) shapeErrors.push("Le geminate devono contenere simboli validi.");
  if (shapeErrors.length) return { ok: false, errors: shapeErrors };
  const result = validateAssetCatalog([{ ...asset, ...metadata }]);
  const errors = result.errors.map((issue) => `${issue.field || "metadati"}: ${issue.message}`);
  return errors.length ? { ok: false, errors } : { ok: true, metadata };
}

export function createPhonologyReviewDecision(item: PhonologyReviewItem, status: PhonologyReviewDecisionStatus, correctedMetadata?: unknown, now = new Date().toISOString()): { ok: true; decision: PhonologyReviewDecision } | { ok: false; errors: string[] } {
  if (!PHONOLOGY_REVIEW_DECISION_STATUSES.includes(status)) return { ok: false, errors: ["Decisione non valida."] };
  if (status === "deferred") return { ok: true, decision: { assetId: item.asset.id, status, updatedAt: now } };
  if (status === "approved") return { ok: true, decision: { assetId: item.asset.id, status, metadata: proposedMetadata(item.candidate), updatedAt: now } };
  const validation = validateCorrectedPhonology(item.asset, correctedMetadata);
  if (!validation.ok) return validation;
  return { ok: true, decision: { assetId: item.asset.id, status, metadata: validation.metadata, updatedAt: now } };
}

export function summarizePhonologyReview(items: readonly PhonologyReviewItem[], decisions: PhonologyReviewDecisions) {
  const summary = { total: items.length, approved: 0, corrected: 0, deferred: 0, pending: 0 };
  for (const item of items) {
    const status = decisions[item.asset.id]?.status;
    if (status === "approved") summary.approved += 1;
    else if (status === "corrected") summary.corrected += 1;
    else if (status === "deferred") summary.deferred += 1;
    else summary.pending += 1;
  }
  return summary;
}
