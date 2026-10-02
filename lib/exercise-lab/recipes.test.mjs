import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exerciseRecipeFromRow, exerciseRecipeRow } from "../supabase/repository.ts";
import { getExerciseRecipe, missingRecipeContentIds, parseExerciseRecipeV1, removeExerciseRecipe, upsertExerciseRecipe } from "./recipes.ts";
import { normalizeAppData, readLocalData, serializeLocalData } from "../data/local-store.ts";

const stamp = "2026-10-02T10:00:00.000Z";
const recipe = (configuration = { kind: "image_naming", mode: "manual", selectedContentIds: ["word_casa"] }) => ({ id: "11111111-1111-4111-8111-111111111111", schemaVersion: 1, kind: configuration.kind, name: "Denominazione /s/", description: "Selezione stabile", configuration, createdAt: stamp, updatedAt: stamp });

test("valida una ricetta V1 discriminata e rifiuta versioni o payload corrotti", () => {
  assert.equal(parseExerciseRecipeV1(recipe()).name, "Denominazione /s/");
  assert.throws(() => parseExerciseRecipeV1({ ...recipe(), schemaVersion: 2 }), /exercise_recipe_invalid/);
  assert.throws(() => parseExerciseRecipeV1({ ...recipe(), configuration: { kind: "minimal_pairs", mode: "manual", selectedContentIds: [] } }), /exercise_recipe_invalid/);
});

test("modalità manuale conserva ID, automatica conserva criteri e lettura conserva il Passage", () => {
  assert.deepEqual(parseExerciseRecipeV1(recipe()).configuration.selectedContentIds, ["word_casa"]);
  const automatic = parseExerciseRecipeV1(recipe({ kind: "word_nonword_repetition", mode: "automatic", contentKind: "both", phoneme: "s", itemCount: 8 }));
  assert.equal(automatic.configuration.mode, "automatic");
  const reading = parseExerciseRecipeV1(recipe({ kind: "reading_comprehension", selectedPassageId: "passage_001" }));
  assert.equal(reading.configuration.selectedPassageId, "passage_001");
});

test("contenuti mancanti sono segnalati senza sostituzione silenziosa", () => {
  assert.deepEqual(missingRecipeContentIds(recipe(), ["word_altro"]), ["word_casa"]);
  assert.deepEqual(missingRecipeContentIds(recipe(), ["word_casa"]), []);
});

test("CRUD locale e round trip localStorage preservano la ricetta", () => {
  const inserted = upsertExerciseRecipe([], recipe());
  assert.equal(inserted.length, 1);
  const renamed = upsertExerciseRecipe(inserted, { ...recipe(), name: "Nuovo nome" });
  assert.equal(renamed[0].name, "Nuovo nome");
  assert.equal(getExerciseRecipe(renamed, recipe().id)?.name, "Nuovo nome");
  assert.equal(removeExerciseRecipe(renamed, recipe().id).length, 0);
  const data = normalizeAppData({ exerciseRecipes: inserted });
  assert.deepEqual(readLocalData(serializeLocalData(data, stamp), () => normalizeAppData({})).data.exerciseRecipes, inserted);
});

test("loader locale ignora ricette corrotte o di versione sconosciuta", () => {
  const data = normalizeAppData({ exerciseRecipes: [recipe(), { ...recipe(), id: "bad", schemaVersion: 2 }] });
  assert.deepEqual(data.exerciseRecipes, [recipe()]);
});

test("mapper Supabase usa schema_version, kind TEXT e configuration JSONB", () => {
  const row = exerciseRecipeRow(recipe(), "user-1");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.schema_version, 1);
  assert.deepEqual(exerciseRecipeFromRow(row), recipe());
});

test("il layer applicativo persiste il nuovo updated_at fornito dagli update", () => {
  const updatedAt = "2026-10-02T11:30:00.000Z";
  const updated = { ...recipe(), name: "Nome aggiornato", updatedAt };
  const row = exerciseRecipeRow(updated, "user-1");
  assert.equal(row.updated_at, updatedAt);
  assert.equal(exerciseRecipeFromRow(row).updatedAt, updatedAt);
});

test("UI espone salvataggio, riuso, gestione e messaggio per contenuti mancanti", () => {
  const source = readFileSync(new URL("../../components/exercise-lab-builder.tsx", import.meta.url), "utf8");
  for (const label of ["Salva come ricetta", "Le mie ricette", "Usa ricetta", "Modifica dettagli", "Elimina", "non sono più disponibili"]) assert.match(source, new RegExp(label));
  assert.match(source, /setView\("add"\)/);
});

test("migration è additiva, privata e lascia kind e versioni future al dominio applicativo", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/026_exercise_recipes.sql", import.meta.url), "utf8").toLowerCase();
  assert.match(sql, /\bbegin\s*;/);
  assert.match(sql, /\bcommit\s*;/);
  assert.match(sql, /create table public\.exercise_recipes/);
  assert.match(sql, /kind text not null/);
  assert.doesNotMatch(sql, /create type/);
  assert.doesNotMatch(sql, /kind\s+in\s*\(/);
  assert.match(sql, /exercise_recipes_kind_check check \(length\(btrim\(kind\)\) > 0\)/);
  assert.match(sql, /exercise_recipes_schema_version_check check \(schema_version >= 1\)/);
  assert.doesNotMatch(sql, /schema_version\s*=\s*1/);
  assert.match(sql, /jsonb_typeof\(configuration\) = 'object'/);
  assert.match(sql, /enable row level security/);
  assert.equal((sql.match(/user_id = auth\.uid\(\)/g) || []).length, 5);
  assert.match(sql, /revoke all privileges on table public\.exercise_recipes from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update, delete on table public\.exercise_recipes to authenticated/);
  assert.match(sql, /exercise_recipes_user_updated_idx/);
});
