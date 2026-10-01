import { ASSET_PARTS_OF_SPEECH, ASSET_REVIEW_STATUSES, ASSET_SOURCE_TYPES, type AssetEntry } from "./types.ts";

export type AssetValidationIssue = { assetId?: string; field?: keyof AssetEntry; message: string };
export type AssetCatalogValidation = { valid: boolean; errors: AssetValidationIssue[]; warnings: AssetValidationIssue[] };

const imagePathPattern = /^\/armonia-assets\/images\/[a-z0-9][a-z0-9._/-]*\.(?:png|jpe?g|webp|svg)$/;
const optionalEditorialFields: (keyof AssetEntry)[] = ["partOfSpeech", "syllabification", "syllableCount", "phonemicTranscription", "ageBand"];

export function validateAssetCatalog(entries: readonly AssetEntry[]): AssetCatalogValidation {
  const errors: AssetValidationIssue[] = [], warnings: AssetValidationIssue[] = [], ids = new Set<string>();
  for (const entry of entries) {
    const id = entry.id?.trim();
    if (!id) errors.push({ field: "id", message: "ID obbligatorio." });
    else if (ids.has(id)) errors.push({ assetId: id, field: "id", message: "ID duplicato." });
    else ids.add(id);
    for (const field of ["label", "semanticCategory", "imagePath", "altText"] as const) {
      if (!entry[field]?.trim()) errors.push({ assetId: id, field, message: `${field} obbligatorio.` });
    }
    if (entry.imagePath && (!imagePathPattern.test(entry.imagePath) || entry.imagePath.includes(".."))) errors.push({ assetId: id, field: "imagePath", message: "Il path immagine deve essere interno a /armonia-assets/images e usare un formato immagine supportato." });
    if (!ASSET_REVIEW_STATUSES.includes(entry.reviewStatus)) errors.push({ assetId: id, field: "reviewStatus", message: "Stato revisione non valido." });
    if (!ASSET_SOURCE_TYPES.includes(entry.sourceType)) errors.push({ assetId: id, field: "sourceType", message: "Tipo fonte non valido." });
    if (entry.partOfSpeech && !ASSET_PARTS_OF_SPEECH.includes(entry.partOfSpeech)) errors.push({ assetId: id, field: "partOfSpeech", message: "Parte del discorso non valida." });
    if (entry.syllableCount !== undefined && (!Number.isInteger(entry.syllableCount) || entry.syllableCount < 1)) errors.push({ assetId: id, field: "syllableCount", message: "Il numero di sillabe deve essere un intero positivo." });
    if (entry.reviewStatus === "approved") {
      if (entry.commercialUseAllowed !== true) errors.push({ assetId: id, field: "commercialUseAllowed", message: "Un asset approved deve essere dichiarato utilizzabile commercialmente." });
      if (!entry.sourceName?.trim()) errors.push({ assetId: id, field: "sourceName", message: "Un asset approved richiede una provenienza documentata." });
      if (!entry.licenseName?.trim()) errors.push({ assetId: id, field: "licenseName", message: "Un asset approved richiede una base d'uso o licenza documentata." });
    }
    for (const field of optionalEditorialFields) if (entry[field] === undefined || entry[field] === "") warnings.push({ assetId: id, field, message: `Metadato facoltativo ${field} non compilato.` });
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function assertValidAssetCatalog(entries: readonly AssetEntry[]) {
  const result = validateAssetCatalog(entries);
  if (!result.valid) throw new Error(result.errors.map((issue) => `${issue.assetId || "catalogo"}:${issue.field || "entry"} ${issue.message}`).join("\n"));
  return result;
}
