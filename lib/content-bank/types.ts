import type { AssetConsonantCluster, AssetPhoneme, AssetPhonologicalPosition, AssetSourceType } from "@/lib/asset-bank/types";

export const CONTENT_TYPES = ["word", "nonword", "minimal_pair", "sentence", "passage", "sequence"] as const;
export const CONTENT_REVIEW_STATUSES = ["draft", "reviewed", "approved"] as const;
export const CONTENT_AUDIENCES = ["preschool", "primary_school", "secondary_school", "adolescent", "adult", "older_adult"] as const;
export const CONTENT_DIFFICULTIES = ["easy", "medium", "advanced"] as const;
export const CONTENT_PARTS_OF_SPEECH = ["noun", "verb", "adjective", "adverb", "other"] as const;
export const MINIMAL_PAIR_TYPES = ["minimal", "near_minimal"] as const;
export const CONTRAST_TYPES = ["voicing", "place", "manner", "other"] as const;
export const MINIMAL_PAIR_CONTRAST_KINDS = ["phoneme", "gemination"] as const;
export const PASSAGE_QUESTION_TYPES = ["literal", "inferential", "sequence", "vocabulary"] as const;

export type ContentType = typeof CONTENT_TYPES[number];
export type ContentReviewStatus = typeof CONTENT_REVIEW_STATUSES[number];
export type ContentAudience = typeof CONTENT_AUDIENCES[number];
export type ContentDifficulty = typeof CONTENT_DIFFICULTIES[number];
export type ContentPartOfSpeech = typeof CONTENT_PARTS_OF_SPEECH[number];
export type MinimalPairType = typeof MINIMAL_PAIR_TYPES[number];
export type ContrastType = typeof CONTRAST_TYPES[number];
export type MinimalPairContrastKind = typeof MINIMAL_PAIR_CONTRAST_KINDS[number];
export type PassageQuestionType = typeof PASSAGE_QUESTION_TYPES[number];

export type ContentBase = {
  id: string;
  contentType: ContentType;
  reviewStatus: ContentReviewStatus;
  sourceType: AssetSourceType;
  commercialUseAllowed: boolean;
  intendedAudience?: ContentAudience[];
  editorialDifficulty?: ContentDifficulty;
  sourceName?: string;
  sourceUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionText?: string;
  notes?: string;
};

export type ContentPhonology = {
  syllabification: string;
  syllableCount: number;
  phonemicTranscription: string;
  phonemes: AssetPhoneme[];
  consonantClusters: AssetConsonantCluster[];
  geminates: string[];
};

export type WordContent = ContentBase & ContentPhonology & {
  contentType: "word";
  text: string;
  lemma: string;
  senseLabel?: string;
  partOfSpeech: ContentPartOfSpeech;
  imageAssetIds?: string[];
};

export type NonwordContent = ContentBase & ContentPhonology & {
  contentType: "nonword";
  text: string;
  phonotacticPattern?: string;
  derivedFromWordId?: string;
};

export type PhonemeContrast = {
  kind: "phoneme";
  phonemeA: string;
  phonemeB: string;
  position: AssetPhonologicalPosition;
  type?: ContrastType;
};
export type GeminationContrast = {
  kind: "gemination";
  segment: string;
  sideA: "singleton";
  sideB: "geminate";
  position: AssetPhonologicalPosition;
};
export type MinimalPairContent = ContentBase & {
  contentType: "minimal_pair";
  wordAId: string;
  wordBId: string;
  pairType: MinimalPairType;
  contrast: PhonemeContrast | GeminationContrast;
};

export type SentenceContent = ContentBase & {
  contentType: "sentence";
  text: string;
  wordCount: number;
  linkedWordIds?: string[];
  imageAssetIds?: string[];
  linguisticFeatures?: {
    grammaticalStructures?: string[];
    targetPhonemes?: string[];
    semanticConcepts?: string[];
  };
};

export type PassageQuestion = {
  id: string;
  type: PassageQuestionType;
  prompt: string;
  expectedAnswer?: string;
};

export type PassageContent = ContentBase & {
  contentType: "passage";
  title: string;
  text: string;
  wordCount: number;
  sentenceCount: number;
  linkedWordIds?: string[];
  questions?: PassageQuestion[];
  linguisticFeatures?: {
    targetPhonemes?: string[];
    grammaticalStructures?: string[];
    semanticThemes?: string[];
  };
};

export type SequenceContent = ContentBase & {
  contentType: "sequence";
  title?: string;
  steps: {
    order: number;
    imageAssetId: string;
    canonicalDescription?: string;
  }[];
  linguisticFeatures?: {
    narrativeTargets?: string[];
    temporalConcepts?: string[];
    grammaticalStructures?: string[];
  };
};

export type ContentItem = WordContent | NonwordContent | MinimalPairContent | SentenceContent | PassageContent | SequenceContent;

export type WordFilters = {
  phoneme?: string;
  phonemePosition?: AssetPhonologicalPosition;
  syllableCount?: number;
  consonantCluster?: string[];
  geminate?: string;
  hasImage?: boolean;
};

export type MinimalPairFilters = {
  pairType?: MinimalPairType;
  contrastKind?: MinimalPairContrastKind;
  phoneme?: string;
  position?: AssetPhonologicalPosition;
};
