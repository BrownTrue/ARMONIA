import type {
  ImageNamingItem,
  MinimalPairItem,
  ReadingComprehensionPreview,
  ReadingQuestionItem,
  RepetitionItem,
  SentenceReadingItem,
} from "./types.ts";
import type { buildImageNamingPreview, buildMinimalPairsPreview, buildRepetitionPreview, buildSentenceReadingPreview } from "./bricks.ts";

type ExerciseDraftBase<TKind extends string, TItem> = {
  kind: TKind;
  title: string;
  instructions: string;
  items: TItem[];
};

export type PictureNamingDraftItem = Pick<ImageNamingItem, "wordId" | "imageAssetId" | "imagePath" | "altText" | "text">;
export type MinimalPairDraftItem = Pick<MinimalPairItem, "minimalPairId" | "wordAId" | "wordBId" | "wordA" | "wordB" | "imagePathA" | "imagePathB" | "contrast" | "pairType">;
export type RepetitionDraftItem = Pick<RepetitionItem, "contentId" | "contentKind" | "text" | "phonemicTranscription" | "syllabification">;
export type ReadingComprehensionDraftItem = {
  passageId: string;
  passageTitle: string;
  text: string;
  wordCount: number;
  questions: ReadingQuestionItem[];
};
export type SentenceReadingDraftItem = Pick<SentenceReadingItem, "sentenceId" | "text" | "wordCount">;

export type PictureNamingExerciseDraft = ExerciseDraftBase<"picture_naming", PictureNamingDraftItem>;
export type MinimalPairsExerciseDraft = ExerciseDraftBase<"minimal_pairs", MinimalPairDraftItem>;
export type RepetitionExerciseDraft = ExerciseDraftBase<"repetition", RepetitionDraftItem>;
export type ReadingComprehensionExerciseDraft = ExerciseDraftBase<"reading_comprehension", ReadingComprehensionDraftItem>;
export type SentenceReadingExerciseDraft = ExerciseDraftBase<"sentence_reading", SentenceReadingDraftItem>;
export type ExerciseDraft = PictureNamingExerciseDraft | MinimalPairsExerciseDraft | RepetitionExerciseDraft | ReadingComprehensionExerciseDraft | SentenceReadingExerciseDraft;

type BrickPreview = ReturnType<typeof buildImageNamingPreview> | ReturnType<typeof buildMinimalPairsPreview> | ReturnType<typeof buildRepetitionPreview> | ReturnType<typeof buildSentenceReadingPreview> | ReadingComprehensionPreview;

export function createExerciseDraft(preview: BrickPreview): ExerciseDraft | undefined {
  switch (preview.brickCode) {
    case "image_naming": {
      const items = (preview as ReturnType<typeof buildImageNamingPreview>).items;
      return items.length ? { kind: "picture_naming", title: "Denominazione immagini", instructions: "Nomina le immagini presentate.", items: items.map(({ wordId, imageAssetId, imagePath, altText, text }) => ({ wordId, imageAssetId, imagePath, altText, text })) } : undefined;
    }
    case "minimal_pairs": {
      const items = (preview as ReturnType<typeof buildMinimalPairsPreview>).items;
      return items.length ? { kind: "minimal_pairs", title: "Coppie minime", instructions: "Leggi o denomina le coppie di parole.", items: items.map(({ minimalPairId, wordAId, wordBId, wordA, wordB, imagePathA, imagePathB, contrast, pairType }) => ({ minimalPairId, wordAId, wordBId, wordA, wordB, imagePathA, imagePathB, contrast: { ...contrast }, pairType })) } : undefined;
    }
    case "word_nonword_repetition": {
      const items = (preview as ReturnType<typeof buildRepetitionPreview>).items;
      return items.length ? { kind: "repetition", title: "Ripetizione di parole e non-parole", instructions: "Ripeti gli elementi nell’ordine proposto.", items: items.map(({ contentId, contentKind, text, phonemicTranscription, syllabification }) => ({ contentId, contentKind, text, phonemicTranscription, syllabification })) } : undefined;
    }
    case "reading_comprehension": {
      const passage = (preview as ReadingComprehensionPreview).selectedPassage;
      return passage ? { kind: "reading_comprehension", title: "Lettura e comprensione", instructions: "Leggi il brano e rispondi alle domande.", items: [{ passageId: passage.passageId, passageTitle: passage.title, text: passage.text, wordCount: passage.wordCount, questions: passage.questions.map((question) => ({ ...question })) }] } : undefined;
    }
    case "sentence_reading": {
      const items = (preview as ReturnType<typeof buildSentenceReadingPreview>).items;
      return items.length ? { kind: "sentence_reading", title: "Lettura di frasi", instructions: "Leggi le frasi nell’ordine proposto.", items: items.map(({ sentenceId, text, wordCount }) => ({ sentenceId, text, wordCount })) } : undefined;
    }
  }
}

export function editExerciseDraft(draft: ExerciseDraft, changes: { title?: string; instructions?: string }): ExerciseDraft {
  return { ...draft, ...changes } as ExerciseDraft;
}

export function removeExerciseDraftItem(draft: ExerciseDraft, index: number): ExerciseDraft {
  if (index < 0 || index >= draft.items.length) return draft;
  return { ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) } as ExerciseDraft;
}

export function moveExerciseDraftItem(draft: ExerciseDraft, index: number, direction: -1 | 1): ExerciseDraft {
  const target = index + direction;
  if (index < 0 || index >= draft.items.length || target < 0 || target >= draft.items.length) return draft;
  const items = [...draft.items] as ExerciseDraft["items"];
  [items[index], items[target]] = [items[target], items[index]];
  return { ...draft, items } as ExerciseDraft;
}

export function resetExerciseDraft(initial: ExerciseDraft): ExerciseDraft {
  switch (initial.kind) {
    case "picture_naming": return { ...initial, items: initial.items.map((item) => ({ ...item })) };
    case "minimal_pairs": return { ...initial, items: initial.items.map((item) => ({ ...item, contrast: { ...item.contrast } })) };
    case "repetition": return { ...initial, items: initial.items.map((item) => ({ ...item })) };
    case "reading_comprehension": return { ...initial, items: initial.items.map((item) => ({ ...item, questions: item.questions.map((question) => ({ ...question })) })) };
    case "sentence_reading": return { ...initial, items: initial.items.map((item) => ({ ...item })) };
  }
}

export function exerciseDraftItemKey(draft: ExerciseDraft, index: number) {
  const item = draft.items[index];
  if (!item) return "";
  if (draft.kind === "picture_naming") return draft.items[index].wordId;
  if (draft.kind === "minimal_pairs") return draft.items[index].minimalPairId;
  if (draft.kind === "repetition") return draft.items[index].contentId;
  if (draft.kind === "reading_comprehension") return draft.items[index].passageId;
  return draft.items[index].sentenceId;
}
