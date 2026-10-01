import type { AssetPhonologicalPosition } from "../asset-bank/types.ts";
import type { ContentAudience, ContentReviewStatus, MinimalPairType, PassageQuestionType } from "../content-bank/types.ts";

export const EXERCISE_BRICK_CODES = ["image_naming", "minimal_pairs", "word_nonword_repetition", "reading_comprehension", "sentence_reading"] as const;
export type ExerciseBrickCode = typeof EXERCISE_BRICK_CODES[number];
export type SyllableCountFilter = number | "4+";

type EditorialOptions = { includeDrafts?: boolean; itemCount: number };
export type PhonologyFilters = {
  phoneme?: string;
  position?: AssetPhonologicalPosition;
  syllableCount?: SyllableCountFilter;
  clusterPhoneme?: string;
  geminate?: string;
};

export type ImageNamingParams = EditorialOptions & PhonologyFilters;
export type MinimalPairsParams = EditorialOptions & {
  phonemeA?: string;
  phonemeB?: string;
  position?: AssetPhonologicalPosition;
  pairType?: MinimalPairType;
  requireImages?: boolean;
};
export type RepetitionParams = EditorialOptions & PhonologyFilters & {
  contentKind: "word" | "nonword" | "both";
};
export type ReadingComprehensionParams = {
  includeDrafts?: boolean;
  audience?: ContentAudience;
  passageId?: string;
};
export type SentenceReadingParams = EditorialOptions & {
  audience?: ContentAudience;
};

export type ImageNamingItem = {
  wordId: string;
  imageAssetId: string;
  imagePath: string;
  altText: string;
  text: string;
  phonemicTranscription: string;
  reviewStatus: ContentReviewStatus;
};
export type MinimalPairItem = {
  minimalPairId: string;
  wordAId: string;
  wordBId: string;
  wordA: string;
  wordB: string;
  imageAssetAId?: string;
  imageAssetBId?: string;
  imagePathA?: string;
  imagePathB?: string;
  contrast: import("../content-bank/types.ts").MinimalPairContent["contrast"];
  pairType: MinimalPairType;
  reviewStatus: ContentReviewStatus;
};
export type RepetitionItem = {
  contentId: string;
  contentKind: "word" | "nonword";
  text: string;
  phonemicTranscription: string;
  syllabification: string;
  reviewStatus: ContentReviewStatus;
};
export type ReadingQuestionItem = {
  id: string;
  type: PassageQuestionType;
  prompt: string;
  expectedAnswer?: string;
};
export type ReadingPassageOption = {
  passageId: string;
  title: string;
  wordCount: number;
  questionCount: number;
  intendedAudience: ContentAudience[];
};
export type ReadingComprehensionItem = ReadingPassageOption & {
  text: string;
  sentenceCount: number;
  questions: ReadingQuestionItem[];
  reviewStatus: ContentReviewStatus;
};
export type ReadingComprehensionPreview = {
  brickCode: "reading_comprehension";
  title: string;
  availablePassages: ReadingPassageOption[];
  selectedPassage?: ReadingComprehensionItem;
  warnings: string[];
};
export type SentenceReadingItem = {
  sentenceId: string;
  text: string;
  wordCount: number;
  intendedAudience: ContentAudience[];
  reviewStatus: ContentReviewStatus;
};

export type ExercisePreview<T> = {
  brickCode: ExerciseBrickCode;
  title: string;
  requestedItemCount: number;
  availableItemCount: number;
  items: T[];
  warnings: string[];
};

export type ExerciseBrickDescriptor = {
  code: ExerciseBrickCode;
  title: string;
  description: string;
};
