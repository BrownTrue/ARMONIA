import { getAssets } from "../../lib/asset-bank/catalog.ts";
import type { ContentBase, ContentItem, ContentPhonology, MinimalPairContent, NonwordContent, PassageContent, SentenceContent, SequenceContent, WordContent } from "../../lib/content-bank/types.ts";

const original = {
  reviewStatus: "draft",
  sourceType: "armonia_original",
  commercialUseAllowed: false,
  sourceName: "ARMONIA",
  licenseName: "Contenuto originale ARMONIA — revisione editoriale interna",
} as const satisfies Omit<ContentBase, "id" | "contentType">;

export function wordFromAsset(assetId: string): WordContent {
  const asset = getAssets().find((item) => item.id === assetId);
  if (!asset?.syllabification || !asset.syllableCount || !asset.phonemicTranscription || !asset.phonemes) throw new Error(`Fonologia Asset incompleta per ${assetId}`);
  return {
    ...original,
    id: `word_${asset.id.replace(/^(noun|verb|concept)_/, "").replace(/_001$/, "")}_001`,
    contentType: "word",
    reviewStatus: asset.phonologyReviewStatus === "reviewed" ? "reviewed" : "draft",
    text: asset.label,
    lemma: asset.label,
    partOfSpeech: asset.partOfSpeech === "noun" || asset.partOfSpeech === "verb" || asset.partOfSpeech === "adjective" ? asset.partOfSpeech : "other",
    syllabification: asset.syllabification,
    syllableCount: asset.syllableCount,
    phonemicTranscription: asset.phonemicTranscription,
    phonemes: asset.phonemes,
    consonantClusters: asset.consonantClusters || [],
    geminates: asset.geminates || [],
    imageAssetIds: [assetId],
  };
}

function units(spec: string) {
  const parsed = spec.split(" ").map((token) => { const separator = token.lastIndexOf("@"); return { symbol: token.slice(0, separator), syllable: Number(token.slice(separator + 1)) }; });
  return parsed.map((unit, index) => ({ ...unit, position: index === 0 ? "initial" as const : index === parsed.length - 1 ? "final" as const : "medial" as const }));
}

function word(id: string, text: string, syllabification: string, transcription: string, phonemeSpec: string, consonantClusters: ContentPhonology["consonantClusters"] = [], geminates: string[] = []): WordContent {
  return { ...original, id, contentType: "word", text, lemma: text, partOfSpeech: "noun", syllabification, syllableCount: syllabification.split("-").length, phonemicTranscription: transcription, phonemes: units(phonemeSpec), consonantClusters, geminates };
}

const words: WordContent[] = [
  ...getAssets().map((asset) => wordFromAsset(asset.id)),
  word("word_lana_001", "lana", "la-na", "/ˈlana/", "l@1 a@1 n@2 a@2"),
  word("word_strada_001", "strada", "stra-da", "/ˈstrada/", "s@1 t@1 r@1 a@1 d@2 a@2", [{ phonemes: ["s", "t", "r"], position: "initial", syllable: 1 }]),
  word("word_fatto_001", "fatto", "fat-to", "/ˈfatto/", "f@1 a@1 t@1 t@2 o@2", [], ["t"]),
  word("word_voglia_001", "voglia", "vo-glia", "/ˈvɔʎʎa/", "v@1 ɔ@1 ʎ@1 ʎ@2 a@2", [], ["ʎ"]),
  word("word_freno_001", "freno", "fre-no", "/ˈfrɛno/", "f@1 r@1 ɛ@1 n@2 o@2", [{ phonemes: ["f", "r"], position: "initial", syllable: 1 }]),
  word("word_vecchio_001", "vecchio", "vec-chio", "/ˈvɛkkjo/", "v@1 ɛ@1 k@1 k@2 j@2 o@2", [], ["k"]),
];

const pairs: MinimalPairContent[] = [
  ["pair_pane_cane_001", "word_pane_001", "word_cane_001", "p", "k", "minimal"],
  ["pair_rana_lana_001", "word_rana_001", "word_lana_001", "r", "l", "minimal"],
  ["pair_gatto_fatto_001", "word_gatto_001", "word_fatto_001", "ɡ", "f", "minimal"],
  ["pair_foglia_voglia_001", "word_foglia_001", "word_voglia_001", "f", "v", "minimal"],
  ["pair_treno_freno_001", "word_treno_001", "word_freno_001", "t", "f", "minimal"],
  ["pair_specchio_vecchio_001", "word_specchio_001", "word_vecchio_001", "sp", "v", "near_minimal"],
].map(([id, wordAId, wordBId, phonemeA, phonemeB, pairType]) => ({ ...original, id, contentType: "minimal_pair", wordAId, wordBId, pairType, contrast: { kind: "phoneme", phonemeA, phonemeB, position: "initial" } } as MinimalPairContent));

function nonword(id: string, text: string, syllabification: string, transcription: string, phonemeSpec: string, pattern: string): NonwordContent {
  return { ...original, id, contentType: "nonword", text, syllabification, syllableCount: syllabification.split("-").length, phonemicTranscription: transcription, phonemes: units(phonemeSpec), consonantClusters: [], geminates: [], phonotacticPattern: pattern, notes: "Non-parola editoriale di test; nessuna validazione clinica o normativa." };
}

const nonwords: NonwordContent[] = [
  nonword("nonword_lape_001", "lape", "la-pe", "/ˈlape/", "l@1 a@1 p@2 e@2", "CV.CV"),
  nonword("nonword_nifo_001", "nifo", "ni-fo", "/ˈnifo/", "n@1 i@1 f@2 o@2", "CV.CV"),
  nonword("nonword_tuma_001", "tuma", "tu-ma", "/ˈtuma/", "t@1 u@1 m@2 a@2", "CV.CV"),
  nonword("nonword_pelano_001", "pelano", "pe-la-no", "/peˈlano/", "p@1 e@1 l@2 a@2 n@3 o@3", "CV.CV.CV"),
  nonword("nonword_frupo_001", "frupo", "fru-po", "/ˈfrupo/", "f@1 r@1 u@1 p@2 o@2", "CCV.CV"),
  nonword("nonword_stavico_001", "stavico", "sta-vi-co", "/ˈstaviko/", "s@1 t@1 a@1 v@2 i@2 k@3 o@3", "CCV.CV.CV"),
];

const sentenceTexts = [
  ["sentence_cane_pane_001", "Il cane guarda il pane sul tavolo.", ["word_cane_001", "word_pane_001"]],
  ["sentence_rana_lana_001", "La rana salta vicino al filo di lana.", ["word_rana_001", "word_lana_001"]],
  ["sentence_treno_001", "Il treno arriva lentamente alla stazione.", ["word_treno_001"]],
  ["sentence_strada_001", "La strada attraversa il paese e prosegue verso il ponte.", ["word_strada_001"]],
  ["sentence_gatto_001", "Il gatto riposa sulla sedia accanto alla finestra.", ["word_gatto_001"]],
  ["sentence_foglia_001", "Una foglia gialla cade nel cortile.", ["word_foglia_001"]],
  ["sentence_zaino_001", "Nello zaino ci sono un libro e un quaderno.", ["word_zaino_001"]],
  ["sentence_specchio_001", "Lo specchio riflette la luce della stanza.", ["word_specchio_001"]],
] as const;
const sentences: SentenceContent[] = sentenceTexts.map(([id, text, linkedWordIds]) => ({ ...original, id, contentType: "sentence", text, wordCount: text.replace(/[.,]/g, "").split(/\s+/).length, linkedWordIds: [...linkedWordIds], linguisticFeatures: { grammaticalStructures: ["frase dichiarativa semplice"] } }));

const passages: PassageContent[] = [
  {
    ...original, id: "passage_ritorno_treno_001", contentType: "passage", title: "Il ritorno in treno",
    text: "Marta salì sul treno nel tardo pomeriggio. Mise lo zaino vicino al finestrino e osservò le case allontanarsi. Dopo una breve sosta, il convoglio ripartì lentamente. Quando riconobbe il ponte vicino al paese, raccolse il libro e si preparò a scendere. Fuori dalla stazione la aspettava con un grande sorriso suo fratello.",
    wordCount: 52, sentenceCount: 5, linkedWordIds: ["word_treno_001", "word_zaino_001"],
    questions: [
      { id: "q_ritorno_1", type: "literal", prompt: "Dove mise lo zaino Marta?", expectedAnswer: "Vicino al finestrino." },
      { id: "q_ritorno_2", type: "sequence", prompt: "Che cosa fece Marta dopo aver riconosciuto il ponte?", expectedAnswer: "Raccolse il libro e si preparò a scendere." },
      { id: "q_ritorno_3", type: "inferential", prompt: "Perché Marta si preparò a scendere?", expectedAnswer: "Perché il treno era vicino alla sua destinazione." },
    ],
  },
  {
    ...original, id: "passage_stanza_luminosa_001", contentType: "passage", title: "Una stanza luminosa",
    text: "La stanza è ampia e ordinata. Una finestra alta lascia entrare la luce del mattino, che si riflette nello specchio. Accanto alla parete ci sono un tavolo, due sedie e una piccola libreria. Sul tavolo restano un quaderno aperto, una penna e un bicchiere d'acqua. L'ambiente è silenzioso e accogliente.",
    wordCount: 50, sentenceCount: 5, linkedWordIds: ["word_specchio_001"],
    questions: [
      { id: "q_stanza_1", type: "literal", prompt: "Quali oggetti si trovano sul tavolo?" },
      { id: "q_stanza_2", type: "vocabulary", prompt: "Quale parola descrive un luogo piacevole in cui stare?", expectedAnswer: "Accogliente." },
    ],
  },
  {
    ...original, id: "passage_passeggiata_001", contentType: "passage", title: "Prima della passeggiata",
    text: "Prima di uscire, Luca controllò il cielo dalla finestra. Poi infilò le scarpe e preparò lo zaino con una bottiglia d'acqua. Chiuse la porta e percorse la strada fino al parco. Dopo aver camminato per mezz'ora, si sedette su una panchina. Infine tornò a casa prima che iniziasse a piovere.",
    wordCount: 50, sentenceCount: 5, linkedWordIds: ["word_strada_001", "word_zaino_001"],
    questions: [
      { id: "q_passeggiata_1", type: "sequence", prompt: "Che cosa fece Luca prima di chiudere la porta?" },
      { id: "q_passeggiata_2", type: "literal", prompt: "Quanto tempo camminò prima di sedersi?", expectedAnswer: "Mezz'ora." },
      { id: "q_passeggiata_3", type: "inferential", prompt: "Perché probabilmente controllò il cielo?" },
    ],
  },
];

const sequences: SequenceContent[] = [
  { ...original, id: "sequence_preparare_zaino_001", contentType: "sequence", title: "Preparare lo zaino", steps: [
    { order: 1, imageAssetId: "noun_libro_001", canonicalDescription: "Scegliere il libro." },
    { order: 2, imageAssetId: "noun_quaderno_001", canonicalDescription: "Aggiungere il quaderno." },
    { order: 3, imageAssetId: "noun_zaino_001", canonicalDescription: "Riporre il materiale nello zaino." },
  ], linguisticFeatures: { temporalConcepts: ["prima", "poi", "infine"] } },
  { ...original, id: "sequence_preparare_tavola_001", contentType: "sequence", title: "Preparare la tavola", steps: [
    { order: 1, imageAssetId: "noun_piatto_001", canonicalDescription: "Posare il piatto." },
    { order: 2, imageAssetId: "noun_bicchiere_001", canonicalDescription: "Aggiungere il bicchiere." },
    { order: 3, imageAssetId: "noun_pane_001", canonicalDescription: "Portare il pane in tavola." },
  ], linguisticFeatures: { temporalConcepts: ["prima", "dopo", "alla fine"] } },
  { ...original, id: "sequence_uscire_pioggia_001", contentType: "sequence", title: "Uscire quando piove", steps: [
    { order: 1, imageAssetId: "noun_scarpa_001", canonicalDescription: "Indossare le scarpe." },
    { order: 2, imageAssetId: "noun_ombrello_001", canonicalDescription: "Prendere l'ombrello." },
    { order: 3, imageAssetId: "noun_porta_001", canonicalDescription: "Aprire la porta e uscire." },
  ], linguisticFeatures: { temporalConcepts: ["prima", "poi", "infine"] } },
];

export const armoniaContentCatalog: readonly ContentItem[] = [...words, ...pairs, ...nonwords, ...sentences, ...passages, ...sequences];
