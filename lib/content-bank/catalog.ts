import { armoniaContentCatalog } from "../../data/armonia-content/catalog.ts";
import { getAssetById } from "../asset-bank/catalog.ts";
import { assertValidContentCatalog } from "./validation.ts";
import type { ContentItem, ContentType, MinimalPairFilters, WordContent, WordFilters } from "./types.ts";
const catalog = Object.freeze([...armoniaContentCatalog]);
assertValidContentCatalog(catalog);
export function getContents(): readonly ContentItem[] { return catalog; }
export function getContentById(id: string) { return catalog.find((item) => item.id === id); }
export function getContentsByType<T extends ContentType>(type: T) { return catalog.filter((item): item is Extract<ContentItem, { contentType: T }> => item.contentType === type); }
export function getWordById(id: string) { const item = getContentById(id); return item?.contentType === "word" ? item : undefined; }
export function searchContents(query: string, entries: readonly ContentItem[] = catalog) { const normalized = query.trim().toLocaleLowerCase("it"); return normalized ? entries.filter((item) => searchableText(item).toLocaleLowerCase("it").includes(normalized)) : [...entries]; }
function searchableText(item: ContentItem) {
  if (item.contentType === "word") return [item.text, item.lemma, item.phonemicTranscription, item.notes].filter(Boolean).join(" ");
  if (item.contentType === "nonword") return [item.text, item.phonemicTranscription, item.phonotacticPattern, item.notes].filter(Boolean).join(" ");
  if (item.contentType === "minimal_pair") return [getWordById(item.wordAId)?.text, getWordById(item.wordBId)?.text, item.contrast.kind === "phoneme" ? item.contrast.phonemeA : item.contrast.segment, item.contrast.kind === "phoneme" ? item.contrast.phonemeB : "geminata"].filter(Boolean).join(" ");
  if (item.contentType === "sentence") return item.text;
  if (item.contentType === "passage") return [item.title, item.text, ...(item.questions || []).map((question) => question.prompt)].join(" ");
  return [item.title, ...item.steps.map((step) => step.canonicalDescription)].filter(Boolean).join(" ");
}
export function filterWords(filters: WordFilters = {}, entries: readonly WordContent[] = getContentsByType("word")) {
  const phoneme = filters.phoneme?.trim(), geminate = filters.geminate?.trim();
  return entries.filter((word) => {
    if (filters.syllableCount !== undefined && word.syllableCount !== filters.syllableCount) return false;
    if (phoneme && !word.phonemes.some((entry) => entry.symbol === phoneme && (!filters.phonemePosition || entry.position === filters.phonemePosition))) return false;
    if (!phoneme && filters.phonemePosition && !word.phonemes.some((entry) => entry.position === filters.phonemePosition)) return false;
    if (filters.consonantCluster && !word.consonantClusters.some((cluster) => cluster.phonemes.length === filters.consonantCluster!.length && cluster.phonemes.every((symbol, index) => symbol === filters.consonantCluster![index]))) return false;
    if (geminate && !word.geminates.includes(geminate)) return false;
    if (filters.hasImage !== undefined && getAvailableRepresentations(word.id).image !== filters.hasImage) return false;
    return true;
  });
}
export function getMinimalPairs(filters: MinimalPairFilters = {}) { return getContentsByType("minimal_pair").filter((pair) => (!filters.pairType || pair.pairType === filters.pairType) && (!filters.contrastKind || pair.contrast.kind === filters.contrastKind) && (!filters.position || pair.contrast.position === filters.position) && (!filters.phoneme || (pair.contrast.kind === "phoneme" ? pair.contrast.phonemeA === filters.phoneme || pair.contrast.phonemeB === filters.phoneme : pair.contrast.segment === filters.phoneme))); }
export function getAvailableRepresentations(wordId: string) { const word = getWordById(wordId); return { text: Boolean(word?.text), image: Boolean(word?.imageAssetIds?.some((id) => getAssetById(id))) }; }
