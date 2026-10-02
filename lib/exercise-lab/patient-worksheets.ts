import { parseExerciseRecipeConfiguration } from "./recipes.ts";
import type { ExerciseDraft } from "./exercise-draft.ts";
import type { ExerciseBlockDraft, WorksheetDraft } from "./worksheet-draft.ts";
import type { Patient } from "../types.ts";

export type PatientWorksheetV1 = {
  schemaVersion: 1;
  id: string;
  patientId: string;
  title: string;
  worksheetSnapshot: WorksheetDraft;
  createdAt: string;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const recipeKind = (kind: ExerciseDraft["kind"]) => kind === "picture_naming" ? "image_naming" : kind === "repetition" ? "word_nonword_repetition" : kind;

export function parsePatientWorksheetV1(value: unknown): PatientWorksheetV1 {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== "string" || !value.id || typeof value.patientId !== "string" || !value.patientId || typeof value.title !== "string" || !value.title.trim() || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") throw new Error("patient_worksheet_invalid");
  const worksheetSnapshot = parseWorksheetSnapshot(value.worksheetSnapshot);
  return { schemaVersion: 1, id: value.id, patientId: value.patientId, title: value.title.trim(), worksheetSnapshot, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

export function patientWorksheetFromDraft(input: { id: string; patientId: string; worksheet: WorksheetDraft; createdAt: string; updatedAt: string }): PatientWorksheetV1 {
  return parsePatientWorksheetV1({ schemaVersion: 1, id: input.id, patientId: input.patientId, title: input.worksheet.title.trim() || "Scheda di attività", worksheetSnapshot: input.worksheet, createdAt: input.createdAt, updatedAt: input.updatedAt });
}

export function worksheetDraftFromPatientWorksheet(value: PatientWorksheetV1): WorksheetDraft {
  return structuredClone(parsePatientWorksheetV1(value).worksheetSnapshot);
}

export function savePatientWorksheet(items: PatientWorksheetV1[], patients: Patient[], value: PatientWorksheetV1) {
  const worksheet = parsePatientWorksheetV1(value);
  if (!patients.some((patient) => patient.id === worksheet.patientId)) throw new Error("patient_worksheet_patient_not_found");
  return items.some((item) => item.id === worksheet.id) ? items.map((item) => item.id === worksheet.id ? worksheet : item) : [worksheet, ...items];
}

export function duplicatePatientWorksheet(value: PatientWorksheetV1, id: string, timestamp: string): PatientWorksheetV1 {
  const source = parsePatientWorksheetV1(value);
  return parsePatientWorksheetV1({ ...structuredClone(source), id, title: `Copia di ${source.title}`, createdAt: timestamp, updatedAt: timestamp });
}

export function removePatientWorksheet(items: PatientWorksheetV1[], id: string) {
  return items.filter((item) => item.id !== id);
}

function parseWorksheetSnapshot(value: unknown): WorksheetDraft {
  if (!isRecord(value) || typeof value.title !== "string" || typeof value.instructions !== "string" || !Array.isArray(value.blocks) || value.blocks.length === 0) throw new Error("patient_worksheet_snapshot_invalid");
  const seen = new Set<string>();
  const blocks = value.blocks.map((raw) => parseBlock(raw, seen));
  return { title: value.title, instructions: value.instructions, blocks };
}

function parseBlock(value: unknown, seen: Set<string>): ExerciseBlockDraft {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id || seen.has(value.id)) throw new Error("patient_worksheet_snapshot_invalid");
  seen.add(value.id);
  const exercise = parseExercise(value.exercise);
  const initialExercise = parseExercise(value.initialExercise);
  if (exercise.kind !== initialExercise.kind) throw new Error("patient_worksheet_snapshot_invalid");
  const configuration = value.configuration === undefined ? undefined : structuredClone(parseExerciseRecipeConfiguration(value.configuration, recipeKind(exercise.kind)));
  return { id: value.id, exercise, initialExercise, ...(configuration ? { configuration } : {}) };
}

function parseExercise(value: unknown): ExerciseDraft {
  if (!isRecord(value) || typeof value.kind !== "string" || typeof value.title !== "string" || typeof value.instructions !== "string" || !Array.isArray(value.items) || value.items.length === 0) throw new Error("patient_worksheet_snapshot_invalid");
  const items = value.items;
  switch (value.kind) {
    case "picture_naming":
      if (!items.every((item) => hasStrings(item, ["wordId", "imageAssetId", "imagePath", "altText", "text"]))) break;
      return structuredClone(value) as ExerciseDraft;
    case "minimal_pairs":
      if (!items.every((item) => hasStrings(item, ["minimalPairId", "wordAId", "wordBId", "wordA", "wordB", "pairType"]) && isRecord(item) && isRecord(item.contrast))) break;
      return structuredClone(value) as ExerciseDraft;
    case "repetition":
      if (!items.every((item) => hasStrings(item, ["contentId", "contentKind", "text", "phonemicTranscription", "syllabification"]))) break;
      return structuredClone(value) as ExerciseDraft;
    case "reading_comprehension":
      if (!items.every((item) => hasStrings(item, ["passageId", "passageTitle", "text"]) && isRecord(item) && typeof item.wordCount === "number" && Array.isArray(item.questions) && item.questions.every((question) => hasStrings(question, ["id", "type", "prompt"])))) break;
      return structuredClone(value) as ExerciseDraft;
    case "sentence_reading":
      if (!items.every((item) => hasStrings(item, ["sentenceId", "text"]) && isRecord(item) && typeof item.wordCount === "number")) break;
      return structuredClone(value) as ExerciseDraft;
  }
  throw new Error("patient_worksheet_snapshot_invalid");
}

function hasStrings(value: unknown, keys: string[]) {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string" && value[key] !== "");
}
