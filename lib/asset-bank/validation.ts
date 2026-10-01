import { ASSET_PARTS_OF_SPEECH, ASSET_PHONOLOGICAL_POSITIONS, ASSET_PHONOLOGY_REVIEW_STATUSES, ASSET_REVIEW_STATUSES, ASSET_SOURCE_TYPES, type AssetEntry } from "./types.ts";

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
    if (entry.syllabification !== undefined && !entry.syllabification.trim()) errors.push({ assetId: id, field: "syllabification", message: "La sillabazione presente non può essere vuota." });
    if (entry.phonemicTranscription !== undefined && !entry.phonemicTranscription.trim()) errors.push({ assetId: id, field: "phonemicTranscription", message: "La trascrizione fonemica presente non può essere vuota." });
    if (entry.phonologyReviewStatus && !ASSET_PHONOLOGY_REVIEW_STATUSES.includes(entry.phonologyReviewStatus)) errors.push({ assetId: id, field: "phonologyReviewStatus", message: "Stato revisione fonologica non valido." });
    for (const phoneme of entry.phonemes || []) {
      if (!phoneme.symbol?.trim()) errors.push({ assetId: id, field: "phonemes", message: "Il simbolo fonemico non può essere vuoto." });
      if (!ASSET_PHONOLOGICAL_POSITIONS.includes(phoneme.position)) errors.push({ assetId: id, field: "phonemes", message: "Posizione fonemica non valida." });
      if (phoneme.syllable !== undefined && (!Number.isInteger(phoneme.syllable) || phoneme.syllable < 1)) errors.push({ assetId: id, field: "phonemes", message: "L'indice di sillaba del fonema deve essere un intero positivo." });
    }
    for (const cluster of entry.consonantClusters || []) {
      if (!Array.isArray(cluster.phonemes) || cluster.phonemes.length < 2 || cluster.phonemes.some((symbol) => !symbol?.trim())) errors.push({ assetId: id, field: "consonantClusters", message: "Un cluster richiede almeno due simboli fonemici non vuoti." });
      if (!ASSET_PHONOLOGICAL_POSITIONS.includes(cluster.position)) errors.push({ assetId: id, field: "consonantClusters", message: "Posizione del cluster non valida." });
      if (cluster.syllable !== undefined && (!Number.isInteger(cluster.syllable) || cluster.syllable < 1)) errors.push({ assetId: id, field: "consonantClusters", message: "L'indice di sillaba del cluster deve essere un intero positivo." });
    }
    if (entry.geminates?.some((symbol) => !symbol?.trim())) errors.push({ assetId: id, field: "geminates", message: "Le geminate non possono contenere simboli vuoti." });
    if (entry.phonologyReviewStatus === "reviewed") {
      if (!entry.syllabification?.trim()) errors.push({ assetId: id, field: "syllabification", message: "La fonologia reviewed richiede la sillabazione." });
      if (!Number.isInteger(entry.syllableCount) || (entry.syllableCount || 0) < 1) errors.push({ assetId: id, field: "syllableCount", message: "La fonologia reviewed richiede un numero di sillabe valido." });
      if (!entry.phonemicTranscription?.trim()) errors.push({ assetId: id, field: "phonemicTranscription", message: "La fonologia reviewed richiede la trascrizione fonemica." });
      if (!entry.phonemes?.length) errors.push({ assetId: id, field: "phonemes", message: "La fonologia reviewed richiede l'elenco esplicito dei fonemi." });
    }
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
