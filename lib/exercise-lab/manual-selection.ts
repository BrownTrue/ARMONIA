import { buildImageNamingPreview, buildMinimalPairsPreview, buildRepetitionPreview, buildSentenceReadingPreview } from "./bricks.ts";
import type { ImageNamingParams, MinimalPairItem, MinimalPairsParams, RepetitionParams, SentenceReadingParams } from "./types.ts";

const ALL_ITEMS = 10_000;

export function getImageNamingCandidates(params: Omit<ImageNamingParams, "itemCount">) {
  return buildImageNamingPreview({ ...params, itemCount: ALL_ITEMS }).items;
}

export function getMinimalPairCandidates(params: Omit<MinimalPairsParams, "itemCount" | "phonemeA" | "phonemeB"> & { contrastKey?: string }) {
  const { contrastKey, ...filters } = params;
  return buildMinimalPairsPreview({ ...filters, itemCount: ALL_ITEMS }).items.filter((item) => !contrastKey || minimalPairContrastKey(item) === contrastKey);
}

export function getRepetitionCandidates(params: Omit<RepetitionParams, "itemCount">) {
  return buildRepetitionPreview({ ...params, itemCount: ALL_ITEMS }).items;
}

export function getSentenceReadingCandidates(params: Omit<SentenceReadingParams, "itemCount">) {
  return buildSentenceReadingPreview({ ...params, itemCount: ALL_ITEMS }).items;
}

export function searchCandidates<T>(items: readonly T[], query: string, label: (item: T) => string) {
  const normalized = query.trim().toLocaleLowerCase("it");
  return normalized ? items.filter((item) => label(item).toLocaleLowerCase("it").includes(normalized)) : [...items];
}

export function toggleSelectedId(selectedIds: readonly string[], id: string) {
  return selectedIds.includes(id) ? selectedIds.filter((entry) => entry !== id) : [...selectedIds, id];
}

export function selectedInOrder<T>(selectedIds: readonly string[], items: readonly T[], id: (item: T) => string) {
  const byId = new Map(items.map((item) => [id(item), item]));
  return selectedIds.flatMap((selectedId) => byId.get(selectedId) ? [byId.get(selectedId)!] : []);
}

export function minimalPairContrastKey(item: Pick<MinimalPairItem, "contrast">) {
  if (item.contrast.kind === "gemination") return `gemination:${item.contrast.segment}`;
  return `phoneme:${[item.contrast.phonemeA, item.contrast.phonemeB].sort().join(":")}`;
}

export function minimalPairContrastLabel(item: Pick<MinimalPairItem, "contrast">) {
  if (item.contrast.kind === "gemination") return `/${item.contrast.segment}/ semplice ↔ doppia`;
  const [left, right] = [item.contrast.phonemeA, item.contrast.phonemeB].sort();
  return `/${left}/ ↔ /${right}/`;
}

export function getMinimalPairContrastOptions(items: readonly MinimalPairItem[]) {
  const options = new Map<string, { key: string; label: string; count: number }>();
  for (const item of items) {
    const key = minimalPairContrastKey(item), current = options.get(key);
    options.set(key, { key, label: minimalPairContrastLabel(item), count: (current?.count || 0) + 1 });
  }
  return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "it"));
}
