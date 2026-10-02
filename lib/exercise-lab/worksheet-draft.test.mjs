import test from "node:test";
import assert from "node:assert/strict";
import { getContents } from "../content-bank/catalog.ts";
import { buildImageNamingPreview, buildSentenceReadingPreview } from "./bricks.ts";
import { createExerciseDraft, editExerciseDraft, removeExerciseDraftItem } from "./exercise-draft.ts";
import {
  getImageNamingCandidates, getMinimalPairCandidates, getMinimalPairContrastOptions, getRepetitionCandidates,
  getSentenceReadingCandidates, searchCandidates, selectedInOrder, toggleSelectedId,
} from "./manual-selection.ts";
import {
  addWorksheetBlock, createWorksheetDraft, duplicateWorksheetBlock, moveWorksheetBlock, removeWorksheetBlock, resetWorksheetBlock,
  updateWorksheetBlock,
} from "./worksheet-draft.ts";

const pictureDraft = () => createExerciseDraft(buildImageNamingPreview({ itemCount: 4 }));
const sentenceDraft = () => createExerciseDraft(buildSentenceReadingPreview({ itemCount: 5 }));

test("Worksheet contiene zero, uno o più blocchi, anche dello stesso kind", () => {
  const empty = createWorksheetDraft();
  const one = addWorksheetBlock(empty, pictureDraft());
  const many = addWorksheetBlock(addWorksheetBlock(one, pictureDraft()), sentenceDraft());
  assert.equal(empty.blocks.length, 0);
  assert.equal(one.blocks.length, 1);
  assert.deepEqual(many.blocks.map((block) => block.exercise.kind), ["picture_naming", "picture_naming", "sentence_reading"]);
  assert.deepEqual(many.blocks.map((block) => block.id), ["block-1", "block-2", "block-3"]);
});

test("add, remove e reorder conservano ordine e ID stabili", () => {
  const worksheet = addWorksheetBlock(addWorksheetBlock(addWorksheetBlock(createWorksheetDraft(), pictureDraft()), sentenceDraft()), pictureDraft());
  const moved = moveWorksheetBlock(worksheet, "block-3", -1);
  assert.deepEqual(moved.blocks.map((block) => block.id), ["block-1", "block-3", "block-2"]);
  assert.deepEqual(removeWorksheetBlock(moved, "block-3").blocks.map((block) => block.id), ["block-1", "block-2"]);
  assert.deepEqual(worksheet.blocks.map((block) => block.id), ["block-1", "block-2", "block-3"]);
});

test("duplica crea un blocco indipendente con un nuovo ID", () => {
  const worksheet = addWorksheetBlock(createWorksheetDraft(), pictureDraft());
  const duplicated = duplicateWorksheetBlock(worksheet, "block-1");
  assert.deepEqual(duplicated.blocks.map((block) => block.id), ["block-1", "block-2"]);
  assert.deepEqual(duplicated.blocks[1].exercise, duplicated.blocks[0].exercise);
  assert.notEqual(duplicated.blocks[1].exercise, duplicated.blocks[0].exercise);
  const changed = updateWorksheetBlock(duplicated, "block-2", editExerciseDraft(duplicated.blocks[1].exercise, { title: "Copia" }));
  assert.notEqual(changed.blocks[0].exercise.title, changed.blocks[1].exercise.title);
});

test("modifica e reset di un blocco non modificano gli altri o i cataloghi", () => {
  const catalogBefore = structuredClone(getContents());
  const worksheet = addWorksheetBlock(addWorksheetBlock(createWorksheetDraft(), pictureDraft()), sentenceDraft());
  const changedExercise = editExerciseDraft(removeExerciseDraftItem(worksheet.blocks[0].exercise, 0), { title: "Immagini scelte" });
  const changed = updateWorksheetBlock(worksheet, "block-1", changedExercise);
  assert.equal(changed.blocks[0].exercise.title, "Immagini scelte");
  assert.deepEqual(changed.blocks[1], worksheet.blocks[1]);
  const reset = resetWorksheetBlock(changed, "block-1");
  assert.deepEqual(reset.blocks[0].exercise, worksheet.blocks[0].exercise);
  assert.deepEqual(getContents(), catalogBefore);
});

test("denominazione manuale cerca, evita duplicati e conserva esattamente la scelta", () => {
  const candidates = getImageNamingCandidates({});
  const named = ["cane", "rana", "gatto", "volpe"];
  const selected = named.reduce((ids, name) => toggleSelectedId(ids, candidates.find((item) => item.text === name).wordId), []);
  const duplicateAttempt = toggleSelectedId(selected, selected[0]);
  assert.equal(duplicateAttempt.includes(selected[0]), false);
  assert.deepEqual(searchCandidates(candidates, "volpe", (item) => item.text).map((item) => item.text), ["volpe"]);
  assert.deepEqual(selectedInOrder(selected, candidates, (item) => item.wordId).map((item) => item.text), named);
});

test("contrasti coppie derivano solo dai dati reali e includono geminazione", () => {
  const pairs = getMinimalPairCandidates({});
  const options = getMinimalPairContrastOptions(pairs);
  assert.ok(options.length > 0);
  assert.ok(options.every((option) => option.count > 0));
  assert.ok(options.some((option) => option.key.startsWith("gemination:") && option.label.includes("semplice ↔ doppia")));
  const selected = selectedInOrder([pairs[1].minimalPairId, pairs[0].minimalPairId], pairs, (item) => item.minimalPairId);
  assert.deepEqual(selected.map((item) => item.minimalPairId), [pairs[1].minimalPairId, pairs[0].minimalPairId]);
  assert.ok(selected.every((item) => item.wordA && item.wordB));
});

test("ripetizione e lettura di frasi espongono candidati reali selezionabili", () => {
  const repetitions = getRepetitionCandidates({ contentKind: "both" });
  const sentences = getSentenceReadingCandidates({ audience: "primary_school" });
  assert.ok(repetitions.length > 0 && sentences.length > 0);
  assert.deepEqual(selectedInOrder([repetitions[2].contentId, repetitions[0].contentId], repetitions, (item) => item.contentId).map((item) => item.contentId), [repetitions[2].contentId, repetitions[0].contentId]);
  assert.deepEqual(selectedInOrder([sentences[1].sentenceId], sentences, (item) => item.sentenceId).map((item) => item.text), [sentences[1].text]);
});
