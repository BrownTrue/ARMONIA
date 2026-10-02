import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildWorksheetPrintModel, getWorksheetPrintRenderer, worksheetPrintRendererRegistry } from "./worksheet-print.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const documentSource = readFileSync(`${root}components/worksheet-print-document.tsx`, "utf8");
const viewSource = readFileSync(`${root}components/worksheet-print-view.tsx`, "utf8");
const css = readFileSync(`${root}app/globals.css`, "utf8");

const exercises = {
  picture_naming: { kind: "picture_naming", title: "Immagini", instructions: "Nomina.", items: [{ wordId: "technical-word", imageAssetId: "asset", imagePath: "/asset.png", altText: "Una casa", text: "casa" }] },
  minimal_pairs: { kind: "minimal_pairs", title: "Coppie", instructions: "", items: [
    { minimalPairId: "pair-1", wordAId: "a", wordBId: "b", wordA: "pane", wordB: "cane", imagePathA: "/pane.png", imagePathB: "/cane.png", contrast: { kind: "phoneme", phonemeA: "p", phonemeB: "k", position: "initial" }, pairType: "minimal" },
    { minimalPairId: "pair-2", wordAId: "c", wordBId: "d", wordA: "fato", wordB: "fatto", imagePathA: "/fato.png", contrast: { kind: "gemination", segment: "t", sideA: "singleton", sideB: "geminate", position: "medial" }, pairType: "minimal" },
    { minimalPairId: "pair-3", wordAId: "e", wordBId: "f", wordA: "rana", wordB: "lana", contrast: { kind: "phoneme", phonemeA: "r", phonemeB: "l", position: "initial" }, pairType: "minimal" },
  ] },
  repetition: { kind: "repetition", title: "Ripetizione", instructions: "Ripeti.", items: [{ contentId: "w", contentKind: "word", text: "casa", phonemicTranscription: "/kasa/", syllabification: "ca-sa" }, { contentId: "n", contentKind: "nonword", text: "pame", phonemicTranscription: "/pame/", syllabification: "pa-me" }] },
  sentence_reading: { kind: "sentence_reading", title: "Frasi", instructions: "Leggi.", items: [{ sentenceId: "s", text: "La casa è grande.", wordCount: 4 }] },
  reading_comprehension: { kind: "reading_comprehension", title: "Comprensione", instructions: "Leggi e rispondi.", items: [{ passageId: "p", passageTitle: "Il viaggio", text: "Un breve testo.", wordCount: 3, questions: [{ id: "q", type: "literal", prompt: "Dove va?", expectedAnswer: "A casa." }] }] },
};

function worksheet(kinds = Object.keys(exercises)) {
  return { title: "Scheda prova", instructions: "Lavora con calma.", blocks: kinds.map((kind, index) => ({ id: `block-${index + 1}`, exercise: structuredClone(exercises[kind]), initialExercise: structuredClone(exercises[kind]) })) };
}

test("il registry copre esattamente tutti i kind correnti e fallisce in modo controllato", () => {
  assert.deepEqual(Object.keys(worksheetPrintRendererRegistry).sort(), Object.keys(exercises).sort());
  assert.throws(() => getWorksheetPrintRenderer("future_kind"), /worksheet_print_renderer_missing:future_kind/);
});

test("la stampa preserva ordine, duplicati di kind e contenuti senza mutare la Worksheet", () => {
  const source = worksheet(["picture_naming", "picture_naming", "repetition"]);
  const before = structuredClone(source);
  const model = buildWorksheetPrintModel(source, "patient");
  assert.deepEqual(model.blocks.map((block) => block.kind), ["picture_naming", "picture_naming", "repetition"]);
  assert.equal(model.blocks[2].words[0], "casa");
  assert.deepEqual(source, before);
});

test("denominazione paziente nasconde label e terapista la mostra", () => {
  const patient = buildWorksheetPrintModel(worksheet(["picture_naming"]), "patient").blocks[0];
  const therapist = buildWorksheetPrintModel(worksheet(["picture_naming"]), "therapist").blocks[0];
  assert.equal(patient.items[0].label, undefined);
  assert.equal(therapist.items[0].label, "casa");
  assert.equal(patient.items[0].imagePath, "/asset.png");
});

test("coppie con due, una o zero immagini restano unità senza placeholder tecnici", () => {
  const patient = buildWorksheetPrintModel(worksheet(["minimal_pairs"]), "patient").blocks[0];
  assert.deepEqual(patient.items.map((item) => [Boolean(item.imagePathA), Boolean(item.imagePathB)]), [[true, true], [true, false], [false, false]]);
  assert.ok(patient.items.every((item) => item.contrast === undefined));
  assert.doesNotMatch(documentSource, /solo testo/i);
});

test("ripetizione separa parole e non-parole senza metadata tecnici", () => {
  const block = buildWorksheetPrintModel(worksheet(["repetition"]), "patient").blocks[0];
  assert.deepEqual(block.words, ["casa"]);
  assert.deepEqual(block.nonwords, ["pame"]);
  assert.equal(JSON.stringify(block).includes("phonemicTranscription"), false);
  assert.equal(JSON.stringify(block).includes("syllabification"), false);
});

test("frasi conservano il testo senza wordCount", () => {
  const block = buildWorksheetPrintModel(worksheet(["sentence_reading"]), "patient").blocks[0];
  assert.deepEqual(block.sentences, ["La casa è grande."]);
  assert.equal(JSON.stringify(block).includes("wordCount"), false);
});

test("comprensione nasconde expectedAnswer al paziente e la etichetta al terapista", () => {
  const patient = buildWorksheetPrintModel(worksheet(["reading_comprehension"]), "patient").blocks[0];
  const therapist = buildWorksheetPrintModel(worksheet(["reading_comprehension"]), "therapist").blocks[0];
  assert.equal(patient.passages[0].questions[0].suggestedAnswer, undefined);
  assert.equal(therapist.passages[0].questions[0].suggestedAnswer, "A casa.");
  assert.match(documentSource, /Risposta suggerita/);
});

test("la print view usa browser print, default paziente e documento isolato dalla UI", () => {
  assert.match(viewSource, /useState<WorksheetPrintVariant>\("patient"\)/);
  assert.match(viewSource, /window\.print\(\)/);
  assert.match(viewSource, /Stampa \/ Salva PDF/);
  assert.match(css, /body:has\(\.worksheet-print-document\) \*/);
  assert.match(css, /break-inside:avoid-page/);
  for (const forbidden of ["wordId", "passageId", "reviewStatus", "wordCount", "sourceType"]) assert.doesNotMatch(documentSource, new RegExp(forbidden));
});
