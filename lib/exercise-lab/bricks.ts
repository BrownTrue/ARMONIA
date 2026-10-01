import { getAssetById } from "../asset-bank/catalog.ts";
import { getContentsByType, getWordById } from "../content-bank/catalog.ts";
import type { ContentPhonology, ContentReviewStatus } from "../content-bank/types.ts";
import type {
  ExerciseBrickDescriptor,
  ExercisePreview,
  ImageNamingItem,
  ImageNamingParams,
  MinimalPairItem,
  MinimalPairsParams,
  PhonologyFilters,
  RepetitionItem,
  RepetitionParams,
} from "./types.ts";

export const exerciseBricks: readonly ExerciseBrickDescriptor[] = [
  { code: "image_naming", title: "Denominazione immagini", description: "Mostra immagini selezionate in base alle caratteristiche della parola." },
  { code: "minimal_pairs", title: "Coppie minime", description: "Contrasti fonologici già presenti e revisionabili nel corpus." },
  { code: "word_nonword_repetition", title: "Ripetizione parole e non-parole", description: "Liste testuali deterministiche per attività di ripetizione." },
];

const usableStatuses = new Set<ContentReviewStatus>(["reviewed", "approved"]);
const allowed = (status: ContentReviewStatus, includeDrafts = false) => includeDrafts || usableStatuses.has(status);
const clean = (value?: string) => value?.trim();

export function matchesPhonology(item: ContentPhonology, filters: PhonologyFilters) {
  const phoneme = clean(filters.phoneme), cluster = clean(filters.clusterPhoneme), geminate = clean(filters.geminate);
  if (filters.syllableCount === "4+" ? item.syllableCount < 4 : filters.syllableCount !== undefined && item.syllableCount !== filters.syllableCount) return false;
  if (phoneme && !item.phonemes.some((entry) => entry.symbol === phoneme && (!filters.position || entry.position === filters.position))) return false;
  if (!phoneme && filters.position && !item.phonemes.some((entry) => entry.position === filters.position)) return false;
  if (cluster && !item.consonantClusters.some((entry) => entry.phonemes.includes(cluster))) return false;
  if (geminate && !item.geminates.includes(geminate)) return false;
  return true;
}

function invalidCommon(params: { itemCount: number }, stringValues: (string | undefined)[] = []) {
  if (!Number.isInteger(params.itemCount) || params.itemCount <= 0) return "La quantità deve essere un numero intero maggiore di zero.";
  if (stringValues.some((value) => value !== undefined && !value.trim())) return "I filtri testuali non possono essere vuoti.";
}
function invalidPhonology(params: PhonologyFilters) {
  if (typeof params.syllableCount === "number" && (!Number.isInteger(params.syllableCount) || params.syllableCount <= 0)) return "Il numero di sillabe non è valido.";
  if (params.position && !["initial", "medial", "final"].includes(params.position)) return "La posizione fonologica non è valida.";
}
function preview<T>(brickCode: ExercisePreview<T>["brickCode"], title: string, count: number, matches: T[], error?: string): ExercisePreview<T> {
  const items = error ? [] : matches.slice(0, count);
  const warnings = error ? [error] : matches.length < count ? [`${matches.length} contenuti disponibili con questi criteri.`] : [];
  return { brickCode, title, requestedItemCount: count, availableItemCount: items.length, items, warnings };
}
function imageFor(wordId: string) {
  const word = getWordById(wordId);
  for (const id of word?.imageAssetIds || []) { const asset = getAssetById(id); if (asset) return asset; }
}

export function buildImageNamingPreview(params: ImageNamingParams): ExercisePreview<ImageNamingItem> {
  const error = invalidCommon(params, [params.phoneme, params.clusterPhoneme, params.geminate]) || invalidPhonology(params);
  const matches = getContentsByType("word").filter((word) => allowed(word.reviewStatus, params.includeDrafts) && matchesPhonology(word, params)).flatMap((word) => {
    const asset = imageFor(word.id);
    return asset ? [{ wordId: word.id, imageAssetId: asset.id, imagePath: asset.imagePath, altText: asset.altText, text: word.text, phonemicTranscription: word.phonemicTranscription, reviewStatus: word.reviewStatus }] : [];
  });
  return preview("image_naming", "Denominazione immagini", params.itemCount, matches, error);
}

export function buildMinimalPairsPreview(params: MinimalPairsParams): ExercisePreview<MinimalPairItem> {
  const error = invalidCommon(params, [params.phonemeA, params.phonemeB]) || (params.position && !["initial", "medial", "final"].includes(params.position) ? "La posizione fonologica non è valida." : undefined) || (params.pairType && !["minimal", "near_minimal"].includes(params.pairType) ? "Il tipo di coppia non è valido." : undefined);
  const a = clean(params.phonemeA), b = clean(params.phonemeB);
  const matches = getContentsByType("minimal_pair").flatMap((pair) => {
    const wordA = getWordById(pair.wordAId), wordB = getWordById(pair.wordBId);
    if (!wordA || !wordB || !allowed(pair.reviewStatus, params.includeDrafts) || !allowed(wordA.reviewStatus, params.includeDrafts) || !allowed(wordB.reviewStatus, params.includeDrafts)) return [];
    if (params.position && pair.contrast.position !== params.position) return [];
    if (params.pairType && pair.pairType !== params.pairType) return [];
    if (a && b && !((pair.contrast.phonemeA === a && pair.contrast.phonemeB === b) || (pair.contrast.phonemeA === b && pair.contrast.phonemeB === a))) return [];
    if (a && !b && pair.contrast.phonemeA !== a && pair.contrast.phonemeB !== a) return [];
    if (!a && b && pair.contrast.phonemeA !== b && pair.contrast.phonemeB !== b) return [];
    const assetA = imageFor(wordA.id), assetB = imageFor(wordB.id);
    if (params.requireImages && (!assetA || !assetB)) return [];
    return [{ minimalPairId: pair.id, wordAId: wordA.id, wordBId: wordB.id, wordA: wordA.text, wordB: wordB.text, imageAssetAId: assetA?.id, imageAssetBId: assetB?.id, imagePathA: assetA?.imagePath, imagePathB: assetB?.imagePath, contrast: pair.contrast, pairType: pair.pairType, reviewStatus: pair.reviewStatus }];
  });
  return preview("minimal_pairs", "Coppie minime", params.itemCount, matches, error);
}

export function buildRepetitionPreview(params: RepetitionParams): ExercisePreview<RepetitionItem> {
  const error = invalidCommon(params, [params.phoneme, params.clusterPhoneme, params.geminate]) || invalidPhonology(params) || (!["word", "nonword", "both"].includes(params.contentKind) ? "Il tipo di contenuto non è valido." : undefined);
  const sources = params.contentKind === "word" ? getContentsByType("word") : params.contentKind === "nonword" ? getContentsByType("nonword") : [...getContentsByType("word"), ...getContentsByType("nonword")];
  const matches = sources.filter((item) => allowed(item.reviewStatus, params.includeDrafts) && matchesPhonology(item, params)).map((item) => ({ contentId: item.id, contentKind: item.contentType, text: item.text, phonemicTranscription: item.phonemicTranscription, syllabification: item.syllabification, reviewStatus: item.reviewStatus }));
  return preview("word_nonword_repetition", "Ripetizione parole e non-parole", params.itemCount, matches, error);
}

export function getAvailableWordPhonemes(includeDrafts = false) { return unique(getContentsByType("word").filter((x) => allowed(x.reviewStatus, includeDrafts)).flatMap((x) => x.phonemes.map((p) => p.symbol))); }
export function getAvailableClusterPhonemes(includeDrafts = false) { return unique([...getContentsByType("word"), ...getContentsByType("nonword")].filter((x) => allowed(x.reviewStatus, includeDrafts)).flatMap((x) => x.consonantClusters.flatMap((c) => c.phonemes))); }
export function getAvailableGeminates(includeDrafts = false) { return unique([...getContentsByType("word"), ...getContentsByType("nonword")].filter((x) => allowed(x.reviewStatus, includeDrafts)).flatMap((x) => x.geminates)); }
export function getAvailablePairContrasts(includeDrafts = false) { return getContentsByType("minimal_pair").filter((x) => allowed(x.reviewStatus, includeDrafts)).map((x) => ({ phonemeA: x.contrast.phonemeA, phonemeB: x.contrast.phonemeB, position: x.contrast.position, pairType: x.pairType })); }
function unique(values: string[]) { return [...new Set(values)].sort((left, right) => left.localeCompare(right, "it")); }
