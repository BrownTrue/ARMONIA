export const ASSET_REVIEW_STATUSES = ["draft", "reviewed", "approved"] as const;
export const ASSET_SOURCE_TYPES = ["armonia_original", "public_domain", "creative_commons", "authorized"] as const;
export const ASSET_PARTS_OF_SPEECH = ["noun", "verb", "adjective", "other"] as const;

export type AssetReviewStatus = typeof ASSET_REVIEW_STATUSES[number];
export type AssetSourceType = typeof ASSET_SOURCE_TYPES[number];
export type AssetPartOfSpeech = typeof ASSET_PARTS_OF_SPEECH[number];

export type AssetEntry = {
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
  syllabification?: string;
  syllableCount?: number;
  phonemicTranscription?: string;
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
};
