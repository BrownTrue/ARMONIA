import type { ContentAudience } from "../content-bank/types.ts";
import type { ExerciseBrickCode, SyllableCountFilter } from "./types.ts";

export type RecipeSelectionMode = "manual" | "automatic";
export type PhonologyRecipeCriteria = {
  phoneme?: string;
  position?: "initial" | "medial" | "final";
  syllableCount?: SyllableCountFilter;
  clusterPhoneme?: string;
  geminate?: string;
};

export type ExerciseRecipeConfiguration =
  | { kind: "image_naming"; mode: "manual"; selectedContentIds: string[] }
  | ({ kind: "image_naming"; mode: "automatic"; itemCount: number } & PhonologyRecipeCriteria)
  | { kind: "minimal_pairs"; mode: "manual"; selectedContentIds: string[] }
  | { kind: "minimal_pairs"; mode: "automatic"; contrastKey?: string; position?: "initial" | "medial" | "final"; requireImages: boolean; itemCount: number }
  | { kind: "word_nonword_repetition"; mode: "manual"; contentKind: "word" | "nonword" | "both"; selectedContentIds: string[] }
  | ({ kind: "word_nonword_repetition"; mode: "automatic"; contentKind: "word" | "nonword" | "both"; itemCount: number } & PhonologyRecipeCriteria)
  | { kind: "reading_comprehension"; selectedPassageId: string }
  | { kind: "sentence_reading"; mode: "manual"; selectedContentIds: string[] }
  | { kind: "sentence_reading"; mode: "automatic"; audience?: ContentAudience; itemCount: number };

export type ExerciseRecipeV1 = {
  id: string;
  schemaVersion: 1;
  kind: ExerciseBrickCode;
  name: string;
  description?: string;
  configuration: ExerciseRecipeConfiguration;
  createdAt: string;
  updatedAt: string;
};

const kinds: ExerciseBrickCode[] = ["image_naming", "minimal_pairs", "word_nonword_repetition", "reading_comprehension", "sentence_reading"];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string" && entry.length > 0);
const positiveInteger = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const optionalString = (value: unknown) => value === undefined || typeof value === "string";

export function parseExerciseRecipeV1(value: unknown): ExerciseRecipeV1 {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== "string" || !value.id || typeof value.name !== "string" || !value.name.trim() || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" || !kinds.includes(value.kind as ExerciseBrickCode) || !isRecord(value.configuration)) throw new Error("exercise_recipe_invalid");
  if (value.description !== undefined && typeof value.description !== "string") throw new Error("exercise_recipe_invalid");
  const configuration = parseExerciseRecipeConfiguration(value.configuration, value.kind as ExerciseBrickCode);
  return { ...value, name: value.name.trim(), description: value.description?.trim() || undefined, configuration } as ExerciseRecipeV1;
}

export function parseExerciseRecipeConfiguration(value: unknown, expectedKind?: ExerciseBrickCode): ExerciseRecipeConfiguration {
  if (!isRecord(value) || !kinds.includes(value.kind as ExerciseBrickCode) || (expectedKind && value.kind !== expectedKind)) throw new Error("exercise_recipe_invalid");
  validateConfiguration(value);
  return value as ExerciseRecipeConfiguration;
}

function validateConfiguration(configuration: Record<string, unknown>) {
  if (configuration.kind === "reading_comprehension") {
    if (typeof configuration.selectedPassageId !== "string" || !configuration.selectedPassageId) throw new Error("exercise_recipe_invalid");
    return;
  }
  if (configuration.mode !== "manual" && configuration.mode !== "automatic") throw new Error("exercise_recipe_invalid");
  if (configuration.mode === "manual" && !strings(configuration.selectedContentIds)) throw new Error("exercise_recipe_invalid");
  if (configuration.mode === "automatic" && !positiveInteger(configuration.itemCount)) throw new Error("exercise_recipe_invalid");
  if (configuration.kind === "word_nonword_repetition" && !["word", "nonword", "both"].includes(String(configuration.contentKind))) throw new Error("exercise_recipe_invalid");
  if (configuration.kind === "minimal_pairs" && configuration.mode === "automatic" && typeof configuration.requireImages !== "boolean") throw new Error("exercise_recipe_invalid");
  if (configuration.mode === "automatic") {
    for (const key of ["phoneme", "clusterPhoneme", "geminate", "contrastKey", "audience"]) if (!optionalString(configuration[key])) throw new Error("exercise_recipe_invalid");
    if (configuration.position !== undefined && !["initial", "medial", "final"].includes(String(configuration.position))) throw new Error("exercise_recipe_invalid");
    if (configuration.syllableCount !== undefined && configuration.syllableCount !== "4+" && !positiveInteger(configuration.syllableCount)) throw new Error("exercise_recipe_invalid");
  }
}

export function missingRecipeContentIds(recipe: ExerciseRecipeV1, availableIds: Iterable<string>) {
  const available = new Set(availableIds);
  const configuration = recipe.configuration;
  const referenced = configuration.kind === "reading_comprehension" ? [configuration.selectedPassageId] : configuration.mode === "manual" ? configuration.selectedContentIds : [];
  return referenced.filter((id) => !available.has(id));
}

export function upsertExerciseRecipe(recipes: ExerciseRecipeV1[], recipe: ExerciseRecipeV1) {
  const validated = parseExerciseRecipeV1(recipe);
  return recipes.some((entry) => entry.id === validated.id) ? recipes.map((entry) => entry.id === validated.id ? validated : entry) : [validated, ...recipes];
}

export function removeExerciseRecipe(recipes: ExerciseRecipeV1[], id: string) {
  return recipes.filter((recipe) => recipe.id !== id);
}

export function getExerciseRecipe(recipes: ExerciseRecipeV1[], id: string) {
  return recipes.find((recipe) => recipe.id === id);
}
