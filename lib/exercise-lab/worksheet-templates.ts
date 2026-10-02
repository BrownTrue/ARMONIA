import { buildImageNamingPreview, buildReadingComprehensionPreview, buildRepetitionPreview, buildSentenceReadingPreview } from "./bricks.ts";
import { createExerciseDraft, type ExerciseDraft } from "./exercise-draft.ts";
import { getImageNamingCandidates, getMinimalPairCandidates, getRepetitionCandidates, getSentenceReadingCandidates, minimalPairContrastKey, selectedInOrder } from "./manual-selection.ts";
import { parseExerciseRecipeConfiguration, type ExerciseRecipeConfiguration } from "./recipes.ts";
import type { ExerciseBrickCode, ExercisePreview } from "./types.ts";
import { addWorksheetBlock, createWorksheetDraft, type ExerciseBlockDraft, type WorksheetDraft } from "./worksheet-draft.ts";

export type WorksheetTemplateBlockV1 = {
  id: string;
  kind: ExerciseBrickCode;
  title: string;
  instructions: string;
  configuration: ExerciseRecipeConfiguration;
};

export type WorksheetTemplateV1 = {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  worksheetTitle: string;
  worksheetInstructions?: string;
  blocks: WorksheetTemplateBlockV1[];
  createdAt: string;
  updatedAt: string;
};

export type WorksheetTemplateInstantiation = {
  worksheet: WorksheetDraft;
  missingContentIds: Record<string, string[]>;
};

const kinds: ExerciseBrickCode[] = ["image_naming", "minimal_pairs", "word_nonword_repetition", "reading_comprehension", "sentence_reading"];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function parseWorksheetTemplateV1(value: unknown): WorksheetTemplateV1 {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== "string" || !value.id || typeof value.name !== "string" || !value.name.trim() || typeof value.worksheetTitle !== "string" || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" || !Array.isArray(value.blocks) || value.blocks.length === 0) throw new Error("worksheet_template_invalid");
  if (value.description !== undefined && typeof value.description !== "string") throw new Error("worksheet_template_invalid");
  if (value.worksheetInstructions !== undefined && typeof value.worksheetInstructions !== "string") throw new Error("worksheet_template_invalid");
  const seen = new Set<string>();
  const blocks = value.blocks.map((raw) => {
    if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id || seen.has(raw.id) || !kinds.includes(raw.kind as ExerciseBrickCode) || typeof raw.title !== "string" || typeof raw.instructions !== "string") throw new Error("worksheet_template_invalid");
    seen.add(raw.id);
    const kind = raw.kind as ExerciseBrickCode;
    return { id: raw.id, kind, title: raw.title, instructions: raw.instructions, configuration: parseExerciseRecipeConfiguration(raw.configuration, kind) };
  });
  return { schemaVersion: 1, id: value.id, name: value.name.trim(), description: value.description?.trim() || undefined, worksheetTitle: value.worksheetTitle, worksheetInstructions: value.worksheetInstructions?.trim() || undefined, blocks, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

export function worksheetTemplateFromDraft(input: { id: string; name: string; description?: string; worksheet: WorksheetDraft; createdAt: string; updatedAt: string }): WorksheetTemplateV1 {
  const blocks = input.worksheet.blocks.map((block, index) => {
    if (!block.configuration) throw new Error("worksheet_template_configuration_missing");
    const configuration = currentConfigurationSnapshot(block);
    return { id: `template-block-${index + 1}`, kind: configuration.kind, title: block.exercise.title, instructions: block.exercise.instructions, configuration };
  });
  return parseWorksheetTemplateV1({ schemaVersion: 1, id: input.id, name: input.name, description: input.description, worksheetTitle: input.worksheet.title, worksheetInstructions: input.worksheet.instructions || undefined, blocks, createdAt: input.createdAt, updatedAt: input.updatedAt });
}

function currentConfigurationSnapshot(block: ExerciseBlockDraft): ExerciseRecipeConfiguration {
  const configuration = block.configuration!;
  if (configuration.kind === "reading_comprehension") return { ...configuration, selectedPassageId: block.exercise.kind === "reading_comprehension" ? block.exercise.items[0]?.passageId || configuration.selectedPassageId : configuration.selectedPassageId };
  if (configuration.mode === "automatic") return structuredClone(configuration);
  return { ...configuration, selectedContentIds: exerciseContentIds(block.exercise) } as ExerciseRecipeConfiguration;
}

function exerciseContentIds(exercise: ExerciseDraft) {
  if (exercise.kind === "picture_naming") return exercise.items.map((item) => item.wordId);
  if (exercise.kind === "minimal_pairs") return exercise.items.map((item) => item.minimalPairId);
  if (exercise.kind === "repetition") return exercise.items.map((item) => item.contentId);
  if (exercise.kind === "reading_comprehension") return exercise.items.map((item) => item.passageId);
  return exercise.items.map((item) => item.sentenceId);
}

export function instantiateWorksheetTemplate(templateValue: WorksheetTemplateV1): WorksheetTemplateInstantiation {
  const template = parseWorksheetTemplateV1(templateValue);
  let worksheet = { ...createWorksheetDraft(), title: template.worksheetTitle, instructions: template.worksheetInstructions || "" };
  const missingContentIds: Record<string, string[]> = {};
  for (const block of template.blocks) {
    const resolved = resolveTemplateConfiguration(block.configuration);
    if (resolved.missing.length) missingContentIds[block.id] = resolved.missing;
    if (!resolved.exercise) continue;
    const exercise = { ...resolved.exercise, title: block.title, instructions: block.instructions } as ExerciseDraft;
    worksheet = addWorksheetBlock(worksheet, exercise, structuredClone(block.configuration));
  }
  return { worksheet, missingContentIds };
}

function resolveTemplateConfiguration(configuration: ExerciseRecipeConfiguration): { exercise?: ExerciseDraft; missing: string[] } {
  if (configuration.kind === "reading_comprehension") {
    const preview = buildReadingComprehensionPreview({ includeDrafts: false, passageId: configuration.selectedPassageId });
    return { exercise: createExerciseDraft(preview), missing: preview.selectedPassage ? [] : [configuration.selectedPassageId] };
  }
  if (configuration.mode === "manual") {
    const candidates = configuration.kind === "image_naming" ? getImageNamingCandidates({ includeDrafts: false }) : configuration.kind === "minimal_pairs" ? getMinimalPairCandidates({ includeDrafts: false }) : configuration.kind === "word_nonword_repetition" ? getRepetitionCandidates({ includeDrafts: false, contentKind: configuration.contentKind }) : getSentenceReadingCandidates({ includeDrafts: false });
    const ids = candidates.map(candidateId), missing = configuration.selectedContentIds.filter((id) => !ids.includes(id));
    const items = selectedInOrder(configuration.selectedContentIds, candidates, candidateId);
    return { exercise: createExerciseDraft(asPreview(configuration.kind, items) as Parameters<typeof createExerciseDraft>[0]), missing };
  }
  if (configuration.kind === "image_naming") return { exercise: createExerciseDraft(buildImageNamingPreview({ includeDrafts: false, ...configuration })), missing: [] };
  if (configuration.kind === "word_nonword_repetition") return { exercise: createExerciseDraft(buildRepetitionPreview({ includeDrafts: false, ...configuration })), missing: [] };
  if (configuration.kind === "sentence_reading") return { exercise: createExerciseDraft(buildSentenceReadingPreview({ includeDrafts: false, ...configuration })), missing: [] };
  let items = getMinimalPairCandidates({ includeDrafts: false, position: configuration.position, requireImages: configuration.requireImages });
  if (configuration.contrastKey) items = items.filter((item) => minimalPairContrastKey(item) === configuration.contrastKey);
  return { exercise: createExerciseDraft(asPreview(configuration.kind, items.slice(0, configuration.itemCount))), missing: [] };
}

function candidateId(item: ReturnType<typeof getImageNamingCandidates>[number] | ReturnType<typeof getMinimalPairCandidates>[number] | ReturnType<typeof getRepetitionCandidates>[number] | ReturnType<typeof getSentenceReadingCandidates>[number]) {
  return "wordId" in item ? item.wordId : "minimalPairId" in item ? item.minimalPairId : "contentId" in item ? item.contentId : item.sentenceId;
}

function asPreview<T>(brickCode: ExerciseBrickCode, items: T[]): ExercisePreview<T> {
  return { brickCode, title: "Attività", items, requestedItemCount: items.length, availableItemCount: items.length, warnings: [] };
}

export function upsertWorksheetTemplate(templates: WorksheetTemplateV1[], template: WorksheetTemplateV1) {
  const validated = parseWorksheetTemplateV1(template);
  return templates.some((entry) => entry.id === validated.id) ? templates.map((entry) => entry.id === validated.id ? validated : entry) : [validated, ...templates];
}

export function removeWorksheetTemplate(templates: WorksheetTemplateV1[], id: string) { return templates.filter((template) => template.id !== id); }
export function getWorksheetTemplate(templates: WorksheetTemplateV1[], id: string) { return templates.find((template) => template.id === id); }
