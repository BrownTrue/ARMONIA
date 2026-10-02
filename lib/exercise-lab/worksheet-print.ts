import type { ExerciseDraft } from "./exercise-draft.ts";
import type { WorksheetDraft } from "./worksheet-draft.ts";

export type WorksheetPrintVariant = "patient" | "therapist";
export type WorksheetPrintTone = "lavender" | "blue" | "amber" | "rose" | "sage";

type PrintBlockBase<TKind extends ExerciseDraft["kind"]> = {
  kind: TKind;
  title: string;
  instructions?: string;
  tone: WorksheetPrintTone;
};

export type PictureNamingPrintBlock = PrintBlockBase<"picture_naming"> & { items: { imagePath: string; altText: string; label?: string }[] };
export type MinimalPairsPrintBlock = PrintBlockBase<"minimal_pairs"> & { items: { wordA: string; wordB: string; imagePathA?: string; imagePathB?: string; contrast?: string }[] };
export type RepetitionPrintBlock = PrintBlockBase<"repetition"> & { words: string[]; nonwords: string[] };
export type ReadingComprehensionPrintBlock = PrintBlockBase<"reading_comprehension"> & { passages: { title: string; text: string; questions: { prompt: string; suggestedAnswer?: string }[] }[] };
export type SentenceReadingPrintBlock = PrintBlockBase<"sentence_reading"> & { sentences: string[] };
export type WorksheetPrintBlock = PictureNamingPrintBlock | MinimalPairsPrintBlock | RepetitionPrintBlock | ReadingComprehensionPrintBlock | SentenceReadingPrintBlock;
export type WorksheetPrintModel = { title: string; instructions?: string; variant: WorksheetPrintVariant; blocks: WorksheetPrintBlock[] };

type PrintRenderer = (exercise: ExerciseDraft, variant: WorksheetPrintVariant) => WorksheetPrintBlock;

export const worksheetPrintRendererRegistry: Record<ExerciseDraft["kind"], PrintRenderer> = {
  picture_naming: (exercise, variant) => {
    if (exercise.kind !== "picture_naming") throw new Error("worksheet_print_kind_mismatch");
    return { kind: exercise.kind, title: exercise.title, instructions: clean(exercise.instructions), tone: "lavender", items: exercise.items.map((item) => ({ imagePath: item.imagePath, altText: item.altText, ...(variant === "therapist" ? { label: item.text } : {}) })) };
  },
  minimal_pairs: (exercise, variant) => {
    if (exercise.kind !== "minimal_pairs") throw new Error("worksheet_print_kind_mismatch");
    return { kind: exercise.kind, title: exercise.title, instructions: clean(exercise.instructions), tone: "blue", items: exercise.items.map((item) => ({ wordA: item.wordA, wordB: item.wordB, imagePathA: item.imagePathA, imagePathB: item.imagePathB, ...(variant === "therapist" ? { contrast: contrastLabel(item.contrast) } : {}) })) };
  },
  repetition: (exercise) => {
    if (exercise.kind !== "repetition") throw new Error("worksheet_print_kind_mismatch");
    return { kind: exercise.kind, title: exercise.title, instructions: clean(exercise.instructions), tone: "amber", words: exercise.items.filter((item) => item.contentKind === "word").map((item) => item.text), nonwords: exercise.items.filter((item) => item.contentKind === "nonword").map((item) => item.text) };
  },
  reading_comprehension: (exercise, variant) => {
    if (exercise.kind !== "reading_comprehension") throw new Error("worksheet_print_kind_mismatch");
    return { kind: exercise.kind, title: exercise.title, instructions: clean(exercise.instructions), tone: "sage", passages: exercise.items.map((item) => ({ title: item.passageTitle, text: item.text, questions: item.questions.map((question) => ({ prompt: question.prompt, ...(variant === "therapist" && question.expectedAnswer ? { suggestedAnswer: question.expectedAnswer } : {}) })) })) };
  },
  sentence_reading: (exercise) => {
    if (exercise.kind !== "sentence_reading") throw new Error("worksheet_print_kind_mismatch");
    return { kind: exercise.kind, title: exercise.title, instructions: clean(exercise.instructions), tone: "rose", sentences: exercise.items.map((item) => item.text) };
  },
};

export function getWorksheetPrintRenderer(kind: string): PrintRenderer {
  const renderer = worksheetPrintRendererRegistry[kind as ExerciseDraft["kind"]];
  if (!renderer) throw new Error(`worksheet_print_renderer_missing:${kind}`);
  return renderer;
}

export function buildWorksheetPrintModel(worksheet: WorksheetDraft, variant: WorksheetPrintVariant): WorksheetPrintModel {
  return {
    title: worksheet.title.trim() || "Scheda di attività",
    instructions: clean(worksheet.instructions),
    variant,
    blocks: worksheet.blocks.map((block) => getWorksheetPrintRenderer(block.exercise.kind)(block.exercise, variant)),
  };
}

function clean(value: string) { return value.trim() || undefined; }
function contrastLabel(contrast: Extract<ExerciseDraft, { kind: "minimal_pairs" }>["items"][number]["contrast"]) {
  return contrast.kind === "gemination" ? `Geminazione /${contrast.segment}/` : `/${contrast.phonemeA}/ ↔ /${contrast.phonemeB}/`;
}
