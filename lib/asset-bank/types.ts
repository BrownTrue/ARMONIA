export const ASSET_REVIEW_STATUSES = ["draft", "reviewed", "approved"] as const;
export const ASSET_SOURCE_TYPES = ["armonia_original", "public_domain", "creative_commons", "authorized"] as const;
export const ASSET_PARTS_OF_SPEECH = ["noun", "verb", "adjective", "other"] as const;
export const ASSET_PHONOLOGICAL_POSITIONS = ["initial", "medial", "final"] as const;
export const ASSET_PHONOLOGY_REVIEW_STATUSES = ["not_reviewed", "needs_review", "reviewed"] as const;

export type AssetReviewStatus = typeof ASSET_REVIEW_STATUSES[number];
export type AssetSourceType = typeof ASSET_SOURCE_TYPES[number];
export type AssetPartOfSpeech = typeof ASSET_PARTS_OF_SPEECH[number];
export type AssetPhonologicalPosition = typeof ASSET_PHONOLOGICAL_POSITIONS[number];
export type AssetPhonologyReviewStatus = typeof ASSET_PHONOLOGY_REVIEW_STATUSES[number];
export type AssetPhoneme = { symbol: string; position: AssetPhonologicalPosition; syllable?: number };
export type AssetConsonantCluster = { phonemes: string[]; position: AssetPhonologicalPosition; syllable?: number };
export type AssetPhonologyMetadata = {
  syllabification?: string;
  syllableCount?: number;
  phonemicTranscription?: string;
  phonemes?: AssetPhoneme[];
  consonantClusters?: AssetConsonantCluster[];
  geminates?: string[];
  pronunciationNotes?: string;
  phonologyReviewStatus?: AssetPhonologyReviewStatus;
};

export type AssetEntry = AssetPhonologyMetadata & {
  id: string;
  label: string;
  semanticCategory: string;
  imagePath: string;
  altText: string;
  sourceType: AssetSourceType;
  commercialUseAllowed: boolean;
  reviewStatus: AssetReviewStatus;
  semanticSubcategory?: string;
  partOfSpeech?: AssetPartOfSpeech;
  syllableStructure?: string;
  ageBand?: string;
  intendedAudience?: string;
  familiarity?: string;
  difficulty?: string;
  notes?: string;
  author?: string;
  sourceName?: string;
  sourceUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionText?: string;
};

export type AssetFilters = {
  text?: string;
  semanticCategory?: string;
  partOfSpeech?: AssetPartOfSpeech;
  reviewStatus?: AssetReviewStatus;
  syllableCount?: number;
  phoneme?: string;
  phonemePosition?: AssetPhonologicalPosition;
  clusterPhoneme?: string;
  consonantCluster?: string[];
  geminate?: string;
  phonologyReviewStatus?: AssetPhonologyReviewStatus;
};
