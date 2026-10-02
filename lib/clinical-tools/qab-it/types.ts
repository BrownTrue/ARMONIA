export const QAB_FORMS = [1, 2, 3] as const;
export type QabForm = (typeof QAB_FORMS)[number];

export const QAB_SECTION_CODES = [
  "awareness",
  "spontaneousSpeech",
  "wordComprehension",
  "sentenceComprehension",
  "naming",
  "repetition",
  "reading",
  "motorSpeech",
] as const;
export type QabSectionCode = (typeof QAB_SECTION_CODES)[number];
export type QabScore = 0 | 1 | 2 | 3 | 4;
export type QabExpectedAnswer = "yes" | "no";

export type QabDynamicField = {
  key: string;
  label: string;
  kind: "text" | "number" | "month" | "choice";
  options?: readonly string[];
  repeatable?: boolean;
};

export type QabStopRule = { scores: readonly QabScore[]; reason: string };

export type QabScoredItem = {
  id: string;
  label: string;
  prompt?: string;
  followUpPrompts?: readonly string[];
  target?: string;
  expectedAnswer?: QabExpectedAnswer;
  relatedDistractors?: readonly string[];
  allowedScores: readonly QabScore[];
  dynamicFields?: readonly QabDynamicField[];
  stopRule?: QabStopRule;
};

export type QabSection = {
  code: QabSectionCode;
  title: string;
  instructions: string;
  items: readonly QabScoredItem[];
  prompts?: readonly string[];
  nonScorableOptions?: readonly string[];
};

export type QabFormDefinition = {
  form: QabForm;
  sections: Record<QabSectionCode, QabSection>;
};

export type QabStimulusCard = {
  form: QabForm;
  cardNumber: 1 | 2 | 3 | 4 | 5 | 6;
  purpose: string;
  associatedSection: QabSectionCode;
  assetPath: string;
  assetAvailable: boolean;
  source: "ItalianQAB_StimulusCards.pdf";
  sourcePage: number;
};

export type QabItemResponse =
  | { status: "scored"; score: QabScore; responseNote?: string }
  | { status: "notAdministered"; responseNote?: string }
  | { status: "notScorable"; responseNote?: string };

export type QabAdministrationV1 = {
  kind: "qab-it";
  schemaVersion: 1;
  form?: QabForm;
  status: "not_started" | "in_progress" | "completed" | "stopped";
  responses: Readonly<Record<string, QabItemResponse>>;
  administrationDate?: string;
  location?: string;
  examiner?: string;
  dynamicValues?: Readonly<Record<string, string | number>>;
  stop?: { itemId: string; reason: string; stoppedAt: string };
};

export type QabResultStatus = "available" | "incomplete" | "stopped" | "invalid";
export type QabScores = {
  readonly wordComprehension: number;
  readonly sentenceComprehension: number;
  readonly lexicalRetrieval: number;
  readonly grammar: number;
  readonly motorProgramming: number;
  readonly repetition: number;
  readonly reading: number;
  readonly overall: number;
  readonly formulaVersion: "official-italian-2026-v1";
};
export type QabScoringResult =
  | { status: "available"; scores: QabScores }
  | { status: Exclude<QabResultStatus, "available">; missingItemIds?: readonly string[]; invalidItemIds?: readonly string[]; stopItemId?: string };

export type QabAttribution = {
  title: string;
  adaptationAuthors: readonly string[];
  originalReference: string;
  publisher: string;
  license: string;
  sourceUrl: string;
};
