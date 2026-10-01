import { armoniaAssetCatalog } from "../../data/armonia-assets/catalog.ts";
import type { AssetEntry, AssetFilters } from "./types.ts";
import { assertValidAssetCatalog } from "./validation.ts";

const catalog = Object.freeze([...armoniaAssetCatalog]);
assertValidAssetCatalog(catalog);

export function getAssets(): readonly AssetEntry[] { return catalog; }
export function getAssetById(id: string) { return catalog.find((asset) => asset.id === id); }
export function searchAssets(text: string, entries: readonly AssetEntry[] = catalog) { return filterAssets(entries, { text }); }
export function getApprovedAssets(entries: readonly AssetEntry[] = catalog) { return entries.filter((asset) => asset.reviewStatus === "approved"); }

export function filterAssets(entries: readonly AssetEntry[] = catalog, filters: AssetFilters = {}) {
  const text = filters.text?.trim().toLocaleLowerCase("it");
  const phoneme = filters.phoneme?.trim().toLocaleLowerCase("it");
  return entries.filter((asset) => {
    if (text && ![asset.label, asset.semanticCategory, asset.semanticSubcategory, ...(asset.notes ? [asset.notes] : [])].filter(Boolean).join(" ").toLocaleLowerCase("it").includes(text)) return false;
    if (filters.semanticCategory && asset.semanticCategory !== filters.semanticCategory) return false;
    if (filters.partOfSpeech && asset.partOfSpeech !== filters.partOfSpeech) return false;
    if (filters.reviewStatus && asset.reviewStatus !== filters.reviewStatus) return false;
    if (filters.syllableCount !== undefined && asset.syllableCount !== filters.syllableCount) return false;
    if (phoneme && !asset.phonemicTranscription?.toLocaleLowerCase("it").includes(phoneme)) return false;
    return true;
  });
}

export function assetSemanticCategories(entries: readonly AssetEntry[] = catalog) {
  return [...new Set(entries.map((asset) => asset.semanticCategory))].sort((left, right) => left.localeCompare(right, "it"));
}
