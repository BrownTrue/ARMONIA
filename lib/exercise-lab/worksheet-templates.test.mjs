import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getImageNamingCandidates } from "./manual-selection.ts";
import { instantiateWorksheetTemplate, parseWorksheetTemplateV1, worksheetTemplateFromDraft } from "./worksheet-templates.ts";
import { addWorksheetBlock, createWorksheetDraft, editWorksheetDraft, moveWorksheetBlock, removeWorksheetBlock } from "./worksheet-draft.ts";
import { createExerciseDraft } from "./exercise-draft.ts";
import { exerciseRecipeRow, worksheetTemplateFromRow, worksheetTemplateRow } from "../supabase/repository.ts";
import { normalizeAppData } from "../data/local-store.ts";

const stamp = "2026-10-02T12:00:00.000Z";
const firstWords = () => getImageNamingCandidates({ includeDrafts: false }).slice(0, 2);
const manualConfiguration = () => ({ kind: "image_naming", mode: "manual", selectedContentIds: firstWords().map((item) => item.wordId) });
const template = (blocks = []) => ({ schemaVersion: 1, id: "11111111-1111-4111-8111-111111111111", name: "Compito settimanale", description: "Quattro attività", worksheetTitle: "Scheda fonologia", worksheetInstructions: "Procedi in ordine.", blocks, createdAt: stamp, updatedAt: stamp });
const block = (id, configuration = manualConfiguration()) => ({ id, kind: configuration.kind, title: "Denominazione", instructions: "Nomina.", configuration });

test("parser rifiuta zero blocchi e accetta uno o più blocchi, anche dello stesso kind", () => {
  assert.throws(() => parseWorksheetTemplateV1(template()), /worksheet_template_invalid/);
  assert.equal(parseWorksheetTemplateV1(template([block("a")])).blocks.length, 1);
  const parsed = parseWorksheetTemplateV1(template([block("a"), block("b")]));
  assert.deepEqual(parsed.blocks.map((entry) => entry.id), ["a", "b"]);
  assert.deepEqual(parsed.blocks.map((entry) => entry.kind), ["image_naming", "image_naming"]);
});

test("parser rifiuta versioni sconosciute, payload corrotti, ID duplicati e config incoerenti", () => {
  assert.throws(() => parseWorksheetTemplateV1({ ...template(), schemaVersion: 2 }), /worksheet_template_invalid/);
  assert.throws(() => parseWorksheetTemplateV1({ ...template(), blocks: [{}] }), /worksheet_template_invalid/);
  assert.throws(() => parseWorksheetTemplateV1(template([block("a"), block("a")])), /worksheet_template_invalid/);
  assert.throws(() => parseWorksheetTemplateV1(template([{ ...block("a"), kind: "minimal_pairs" }])), /exercise_recipe_invalid/);
});

test("template conserva configurazioni manuali, automatiche, titoli e istruzioni", () => {
  const configurations = [
    manualConfiguration(),
    { kind: "image_naming", mode: "automatic", phoneme: "s", itemCount: 4 },
    { kind: "sentence_reading", mode: "automatic", audience: "adult", itemCount: 4 },
  ];
  const parsed = parseWorksheetTemplateV1(template(configurations.map((configuration, index) => block(`b${index}`, configuration))));
  assert.deepEqual(parsed.blocks.map((entry) => entry.configuration), configurations);
  assert.equal(parsed.worksheetTitle, "Scheda fonologia");
  assert.equal(parsed.blocks[0].instructions, "Nomina.");
});

test("uso del modello risolve contenuti correnti, segnala ID mancanti e crea nuovi block ID", () => {
  const ids = manualConfiguration().selectedContentIds;
  const source = template([block("saved-a", { kind: "image_naming", mode: "manual", selectedContentIds: [ids[0], "missing-word", ids[1]] })]);
  const result = instantiateWorksheetTemplate(source);
  assert.deepEqual(result.missingContentIds, { "saved-a": ["missing-word"] });
  assert.equal(result.worksheet.blocks[0].id, "block-1");
  assert.deepEqual(result.worksheet.blocks[0].exercise.items.map((item) => item.wordId), ids);
});

test("configurazione automatica viene rieseguita e resta snapshot indipendente", () => {
  const source = template([block("saved-a", { kind: "image_naming", mode: "automatic", itemCount: 2 })]);
  const result = instantiateWorksheetTemplate(source);
  assert.equal(result.worksheet.blocks[0].exercise.items.length, 2);
  result.worksheet.blocks[0].configuration.itemCount = 1;
  assert.equal(source.blocks[0].configuration.itemCount, 2);
});

test("salvataggio da Worksheet usa gli ID manuali ancora presenti e conserva testo e ordine", () => {
  const words = firstWords();
  const preview = { brickCode: "image_naming", title: "Denominazione", items: words, requestedItemCount: 2, availableItemCount: 2, warnings: [] };
  let worksheet = editWorksheetDraft(createWorksheetDraft(), { title: "Titolo", instructions: "Istruzione" });
  worksheet = addWorksheetBlock(worksheet, createExerciseDraft(preview), manualConfiguration());
  worksheet.blocks[0].exercise.items = worksheet.blocks[0].exercise.items.slice(1);
  const saved = worksheetTemplateFromDraft({ id: template().id, name: "Modello", worksheet, createdAt: stamp, updatedAt: stamp });
  assert.deepEqual(saved.blocks[0].configuration.selectedContentIds, [words[1].wordId]);
  assert.equal(saved.worksheetTitle, "Titolo");
  assert.equal(saved.worksheetInstructions, "Istruzione");
});

test("Worksheet derivata è indipendente dal template durante remove, reorder e modifica titolo", () => {
  const source = template([block("a"), block("b")]);
  const derived = instantiateWorksheetTemplate(source).worksheet;
  const changed = editWorksheetDraft(moveWorksheetBlock(removeWorksheetBlock(derived, "block-1"), "block-2", -1), { title: "Titolo modificato" });
  assert.equal(changed.blocks.length, 1);
  assert.equal(source.blocks.length, 2);
  assert.equal(source.worksheetTitle, "Scheda fonologia");
});

test("mapper DB/domain conserva template_data e updated_at", () => {
  const source = template([block("a")]);
  const row = worksheetTemplateRow(source, "user-1");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.updated_at, stamp);
  assert.deepEqual(worksheetTemplateFromRow(row), source);
  assert.equal(exerciseRecipeRow({ id: source.id, schemaVersion: 1, kind: "image_naming", name: "Singola", configuration: manualConfiguration(), createdAt: stamp, updatedAt: stamp }, "user-1").kind, "image_naming");
});

test("modalità locale conserva i modelli validi e scarta quelli senza attività", () => {
  const valid = template([block("a")]);
  const normalized = normalizeAppData({ worksheetTemplates: [template(), valid] });
  assert.deepEqual(normalized.worksheetTemplates, [valid]);
});

test("migration 027 è additiva, forward-compatible, owner-only e priva di kind whitelist", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/027_worksheet_templates.sql", import.meta.url), "utf8").toLowerCase();
  assert.match(sql, /\bbegin\s*;/);
  assert.match(sql, /\bcommit\s*;/);
  assert.match(sql, /create table public\.worksheet_templates/);
  assert.match(sql, /schema_version >= 1/);
  assert.doesNotMatch(sql, /\bkind\b/);
  assert.match(sql, /jsonb_typeof\(template_data\) = 'object'/);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.equal((sql.match(/user_id = auth\.uid\(\)/g) || []).length, 5);
  assert.match(sql, /revoke all privileges .* from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update, delete .* to authenticated/);
});

test("UX espone salva, usa, modifica ed elimina senza fondere Ricette e Modelli", () => {
  const source = readFileSync(new URL("../../components/exercise-lab-builder.tsx", import.meta.url), "utf8");
  for (const label of ["Salva come modello", "Modelli di scheda", "Usa modello", "Modifica dettagli", "Elimina"]) assert.match(source, new RegExp(label));
  assert.match(source, /instantiateWorksheetTemplate/);
  assert.match(source, /worksheetTemplateFromDraft/);
  assert.match(source, /if \(!worksheet\.blocks\.length\)/);
  assert.match(source, /Aggiungi almeno un’attività prima di salvare il modello\./);
});
