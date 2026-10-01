import type { ContentBase, ContentItem, MinimalPairContent, NonwordContent, PassageContent, SentenceContent, WordContent } from "../../../lib/content-bank/types.ts";

// Cinque candidati restano pendenti dopo la promozione controllata del Round 2:
// quattro merge dipendono da parole storiche draft; fato/fatto è bloccata per lo stesso motivo.
export const candidateWords: readonly WordContent[] = [];
const candidateBase = { reviewStatus: "draft", sourceType: "armonia_original", commercialUseAllowed: false, sourceName: "ARMONIA", licenseName: "Candidato editoriale ARMONIA — da revisionare" } as const satisfies Omit<ContentBase, "id" | "contentType">;
export const candidatePairs: readonly MinimalPairContent[] = [{
  ...candidateBase,
  id: "candidate_pair_phoneme_032",
  contentType: "minimal_pair",
  wordAId: "word_rana_001",
  wordBId: "word_lana_001",
  pairType: "minimal",
  contrast: { kind: "phoneme", phonemeA: "r", phonemeB: "l", position: "initial" },
}, {
  ...candidateBase,
  id: "candidate_pair_phoneme_033",
  contentType: "minimal_pair",
  wordAId: "word_gatto_001",
  wordBId: "word_fatto_001",
  pairType: "minimal",
  contrast: { kind: "phoneme", phonemeA: "ɡ", phonemeB: "f", position: "initial" },
}, {
  ...candidateBase,
  id: "candidate_pair_phoneme_034",
  contentType: "minimal_pair",
  wordAId: "word_foglia_001",
  wordBId: "word_voglia_001",
  pairType: "minimal",
  contrast: { kind: "phoneme", phonemeA: "f", phonemeB: "v", position: "initial" },
}, {
  ...candidateBase,
  id: "candidate_pair_phoneme_035",
  contentType: "minimal_pair",
  wordAId: "word_treno_001",
  wordBId: "word_freno_001",
  pairType: "minimal",
  contrast: { kind: "phoneme", phonemeA: "t", phonemeB: "f", position: "initial" },
}, {
  ...candidateBase,
  id: "candidate_pair_gemination_fato_fatto_001",
  contentType: "minimal_pair",
  wordAId: "word_fato_001",
  wordBId: "word_fatto_001",
  pairType: "minimal",
  contrast: { kind: "gemination", segment: "t", sideA: "singleton", sideB: "geminate", position: "medial" },
}];
export const candidateNonwords: readonly NonwordContent[] = [];
export const candidateSentences: readonly SentenceContent[] = [];
export const candidatePassages: readonly PassageContent[] = [];
export const armoniaContentCandidates: readonly ContentItem[] = [...candidatePairs];
