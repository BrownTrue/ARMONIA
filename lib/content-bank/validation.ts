import { getAssets } from "../asset-bank/catalog.ts";
import { ASSET_PHONOLOGICAL_POSITIONS, ASSET_SOURCE_TYPES } from "../asset-bank/types.ts";
import { CONTENT_AUDIENCES, CONTENT_DIFFICULTIES, CONTENT_PARTS_OF_SPEECH, CONTENT_REVIEW_STATUSES, CONTENT_TYPES, CONTRAST_TYPES, MINIMAL_PAIR_TYPES, PASSAGE_QUESTION_TYPES, type ContentItem, type ContentPhonology, type WordContent } from "./types.ts";

export type ContentValidationIssue = { contentId?: string; field?: string; message: string };
export type ContentCatalogValidation = { valid: boolean; errors: ContentValidationIssue[]; warnings: ContentValidationIssue[] };
const affricates = ["tʃ", "dʒ", "ts", "dz"];
const nonEmpty = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
const countWords = (text: string) => text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length || 0;
const countSentences = (text: string) => text.split(/[.!?]+/).filter((part) => part.trim()).length;

function validatePhonology(item: { id: string } & Partial<ContentPhonology>, errors: ContentValidationIssue[]) {
  const push = (field: string, message: string) => errors.push({ contentId: item.id, field, message });
  if (!nonEmpty(item.syllabification)) push("syllabification", "Sillabazione obbligatoria.");
  if (!Number.isInteger(item.syllableCount) || (item.syllableCount || 0) < 1) push("syllableCount", "Numero di sillabe non valido.");
  if (!nonEmpty(item.phonemicTranscription)) push("phonemicTranscription", "Trascrizione fonemica obbligatoria.");
  if (!item.phonemes?.length) push("phonemes", "Elenco fonemi obbligatorio.");
  for (const phoneme of item.phonemes || []) {
    if (!nonEmpty(phoneme.symbol)) push("phonemes", "Simbolo fonemico vuoto.");
    if (!ASSET_PHONOLOGICAL_POSITIONS.includes(phoneme.position)) push("phonemes", "Posizione fonemica non valida.");
    if (!Number.isInteger(phoneme.syllable) || (phoneme.syllable || 0) < 1 || (phoneme.syllable || 0) > (item.syllableCount || 0)) push("phonemes", "Indice sillabico del fonema non valido.");
  }
  for (const cluster of item.consonantClusters || []) {
    if (cluster.phonemes.length < 2 || cluster.phonemes.some((symbol) => !nonEmpty(symbol))) push("consonantClusters", "Cluster consonantico non valido.");
    if (!ASSET_PHONOLOGICAL_POSITIONS.includes(cluster.position)) push("consonantClusters", "Posizione del cluster non valida.");
    if (!Number.isInteger(cluster.syllable) || (cluster.syllable || 0) < 1 || (cluster.syllable || 0) > (item.syllableCount || 0)) push("consonantClusters", "Indice sillabico del cluster non valido.");
  }
  if ((item.geminates || []).some((symbol) => !nonEmpty(symbol))) push("geminates", "Le geminate non possono essere vuote.");
  for (const affricate of affricates) if (item.phonemicTranscription?.includes(affricate) && !item.phonemes?.some((phoneme) => phoneme.symbol === affricate)) push("phonemes", `L'affricata ${affricate} deve restare un'unità atomica.`);
}

export function validateContentCatalog(entries: readonly ContentItem[]): ContentCatalogValidation {
  const errors: ContentValidationIssue[] = [], warnings: ContentValidationIssue[] = [], ids = new Set<string>();
  const assetIds = new Set(getAssets().map((asset) => asset.id));
  const wordIds = new Set(entries.filter((entry): entry is WordContent => entry.contentType === "word").map((entry) => entry.id));
  const push = (entry: ContentItem, field: string, message: string) => errors.push({ contentId: entry.id, field, message });
  const checkWordRefs = (entry: ContentItem, field: string, refs: readonly string[] = []) => { for (const ref of refs) if (!wordIds.has(ref)) push(entry, field, `WordContent inesistente: ${ref}.`); };
  const checkAssetRefs = (entry: ContentItem, field: string, refs: readonly string[] = []) => { for (const ref of refs) if (!assetIds.has(ref)) push(entry, field, `Asset inesistente: ${ref}.`); };
  for (const entry of entries) {
    if (!nonEmpty(entry.id)) push(entry, "id", "ID obbligatorio."); else if (ids.has(entry.id)) push(entry, "id", "ID duplicato."); else ids.add(entry.id);
    if (!CONTENT_TYPES.includes(entry.contentType)) push(entry, "contentType", "Tipo contenuto non valido.");
    if (!CONTENT_REVIEW_STATUSES.includes(entry.reviewStatus)) push(entry, "reviewStatus", "Stato revisione non valido.");
    if (!ASSET_SOURCE_TYPES.includes(entry.sourceType)) push(entry, "sourceType", "Tipo fonte non valido.");
    if (entry.intendedAudience?.some((value) => !CONTENT_AUDIENCES.includes(value))) push(entry, "intendedAudience", "Pubblico editoriale non valido.");
    if (entry.editorialDifficulty && !CONTENT_DIFFICULTIES.includes(entry.editorialDifficulty)) push(entry, "editorialDifficulty", "Difficoltà editoriale non valida.");
    if (entry.reviewStatus === "approved" && (!entry.commercialUseAllowed || !nonEmpty(entry.sourceName) || !nonEmpty(entry.licenseName))) push(entry, "reviewStatus", "Un contenuto approved richiede uso commerciale, fonte e licenza dichiarati.");
    switch (entry.contentType) {
      case "word":
        if (!nonEmpty(entry.text) || !nonEmpty(entry.lemma)) push(entry, "text", "Testo e lemma sono obbligatori.");
        if (!CONTENT_PARTS_OF_SPEECH.includes(entry.partOfSpeech)) push(entry, "partOfSpeech", "Parte del discorso non valida.");
        validatePhonology(entry, errors); checkAssetRefs(entry, "imageAssetIds", entry.imageAssetIds); break;
      case "nonword":
        if (!nonEmpty(entry.text)) push(entry, "text", "Testo della non-parola obbligatorio.");
        validatePhonology(entry, errors); if (entry.derivedFromWordId) checkWordRefs(entry, "derivedFromWordId", [entry.derivedFromWordId]); break;
      case "minimal_pair":
        checkWordRefs(entry, "wordAId", [entry.wordAId]); checkWordRefs(entry, "wordBId", [entry.wordBId]);
        if (entry.wordAId === entry.wordBId) push(entry, "wordBId", "La coppia richiede due parole diverse.");
        if (!MINIMAL_PAIR_TYPES.includes(entry.pairType)) push(entry, "pairType", "Tipo coppia non valido.");
        if (!nonEmpty(entry.contrast.phonemeA) || !nonEmpty(entry.contrast.phonemeB) || entry.contrast.phonemeA === entry.contrast.phonemeB) push(entry, "contrast", "Contrasto fonemico non valido.");
        if (!ASSET_PHONOLOGICAL_POSITIONS.includes(entry.contrast.position)) push(entry, "contrast.position", "Posizione contrasto non valida.");
        if (entry.contrast.type && !CONTRAST_TYPES.includes(entry.contrast.type)) push(entry, "contrast.type", "Tipo contrasto non valido."); break;
      case "sentence":
        if (!nonEmpty(entry.text) || !Number.isInteger(entry.wordCount) || entry.wordCount < 1) push(entry, "text", "Frase e conteggio parole sono obbligatori.");
        else if (entry.wordCount !== countWords(entry.text)) push(entry, "wordCount", "Il conteggio parole non corrisponde al testo.");
        checkWordRefs(entry, "linkedWordIds", entry.linkedWordIds); checkAssetRefs(entry, "imageAssetIds", entry.imageAssetIds); break;
      case "passage": {
        if (!nonEmpty(entry.title) || !nonEmpty(entry.text) || !Number.isInteger(entry.wordCount) || entry.wordCount < 1 || !Number.isInteger(entry.sentenceCount) || entry.sentenceCount < 1) push(entry, "text", "Titolo, brano e conteggi sono obbligatori.");
        else {
          if (entry.wordCount !== countWords(entry.text)) push(entry, "wordCount", "Il conteggio parole non corrisponde al testo.");
          if (entry.sentenceCount !== countSentences(entry.text)) push(entry, "sentenceCount", "Il conteggio frasi non corrisponde al testo.");
        }
        checkWordRefs(entry, "linkedWordIds", entry.linkedWordIds); const questionIds = new Set<string>();
        for (const question of entry.questions || []) { if (!nonEmpty(question.id) || questionIds.has(question.id)) push(entry, "questions", "ID domanda mancante o duplicato."); questionIds.add(question.id); if (!PASSAGE_QUESTION_TYPES.includes(question.type) || !nonEmpty(question.prompt)) push(entry, "questions", "Domanda non valida."); }
        break;
      }
      case "sequence": {
        if (entry.steps.length < 2) push(entry, "steps", "Una sequenza richiede almeno due step.");
        const orders = entry.steps.map((step) => step.order);
        if (new Set(orders).size !== orders.length || orders.some((order, index) => order !== index + 1)) push(entry, "steps", "Gli step devono avere ordine univoco, crescente e contiguo da 1.");
        checkAssetRefs(entry, "steps", entry.steps.map((step) => step.imageAssetId)); break;
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
export function assertValidContentCatalog(entries: readonly ContentItem[]) { const result = validateContentCatalog(entries); if (!result.valid) throw new Error(result.errors.map((issue) => `${issue.contentId || "catalogo"}:${issue.field || "item"} ${issue.message}`).join("\n")); return result; }
