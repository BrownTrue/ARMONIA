import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildImageNamingPreview, buildMinimalPairsPreview, buildReadingComprehensionPreview, buildRepetitionPreview, buildSentenceReadingPreview, getAvailableReadingAudiences, getAvailableSentenceAudiences, matchesPhonology } from "./bricks.ts";
import { getContentsByType } from "../content-bank/catalog.ts";

test("denominazione usa solo parole revisionate con immagini reali", () => {
  const result = buildImageNamingPreview({ itemCount: 12 });
  assert.equal(result.availableItemCount, 12);
  assert.equal(result.warnings.length, 0);
  assert.ok(result.items.every((item) => item.imageAssetId && item.imagePath && item.reviewStatus !== "draft"));
});
test("denominazione segnala disponibilità insufficiente senza duplicare", () => {
  const result=buildImageNamingPreview({itemCount:200});
  assert.equal(result.availableItemCount,119);
  assert.match(result.warnings[0],/^119 contenuti/);
  assert.equal(new Set(result.items.map((item)=>item.wordId)).size,119);
});
test("matching fonologico è esatto e non confonde t con tʃ", () => {
  const item = { syllabification: "ci-bo", syllableCount: 2, phonemicTranscription: "/ˈtʃibo/", phonemes: [{ symbol: "tʃ", position: "initial" }], consonantClusters: [], geminates: [] };
  assert.equal(matchesPhonology(item, { phoneme: "t" }), false);
  assert.equal(matchesPhonology(item, { phoneme: "tʃ" }), true);
});
test("coppie draft escluse di default e incluse solo esplicitamente", () => {
  assert.equal(buildMinimalPairsPreview({ itemCount: 100 }).availableItemCount, 55);
  assert.equal(buildMinimalPairsPreview({ itemCount: 100, includeDrafts: true }).availableItemCount, 60);
  assert.equal(buildMinimalPairsPreview({ itemCount: 10, includeDrafts: true, requireImages: true }).availableItemCount, 1);
});
test("contrasto coppie è simmetrico e pairType distingue quasi minime", () => {
  assert.equal(buildMinimalPairsPreview({ itemCount: 4, includeDrafts: true, phonemeA: "k", phonemeB: "p" }).items[0].minimalPairId, "pair_pane_cane_001");
  assert.equal(buildMinimalPairsPreview({ itemCount: 100, includeDrafts: true, pairType: "near_minimal" }).availableItemCount, 6);
});
test("filtri denominazione coprono posizione sillabe cluster e geminata", () => {
  assert.ok(buildImageNamingPreview({ itemCount: 12, phoneme: "s", position: "initial" }).items.every((item) => item.phonemicTranscription.includes("s")));
  assert.ok(buildImageNamingPreview({ itemCount: 12, syllableCount: 2 }).items.length > 0);
  assert.ok(buildImageNamingPreview({ itemCount: 12, clusterPhoneme: "p" }).items.some((item) => item.text === "specchio"));
  assert.ok(buildImageNamingPreview({ itemCount: 12, geminate: "k" }).items.some((item) => item.text === "specchio"));
});
test("coppie usano solo record esistenti e filtri posizione", () => {
  const result = buildMinimalPairsPreview({ itemCount: 12, includeDrafts: true, position: "initial" });
  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((item) => item.minimalPairId.startsWith("pair_") && item.contrast.position === "initial"));
  assert.equal(result.warnings.length, 0);
});
test("ripetizione rispetta kind e stato editoriale", () => {
  assert.equal(buildRepetitionPreview({ itemCount: 30, contentKind: "word" }).availableItemCount, 30);
  assert.equal(buildRepetitionPreview({ itemCount: 100, contentKind: "nonword" }).availableItemCount, 50);
  assert.equal(buildRepetitionPreview({ itemCount: 300, contentKind: "both", includeDrafts: true }).availableItemCount, 273);
});
test("ripetizione applica fonema posizione sillabe cluster e geminata", () => {
  assert.ok(buildRepetitionPreview({ itemCount: 30, contentKind: "both", includeDrafts: true, phoneme: "t", position: "initial" }).items.every((item) => item.phonemicTranscription.includes("t")));
  assert.ok(buildRepetitionPreview({ itemCount: 30, contentKind: "both", includeDrafts: true, syllableCount: 2 }).availableItemCount > 0);
  assert.ok(buildRepetitionPreview({ itemCount: 30, contentKind: "both", includeDrafts: true, clusterPhoneme: "s" }).availableItemCount > 0);
  assert.ok(buildRepetitionPreview({ itemCount: 30, contentKind: "both", includeDrafts: true, geminate: "t" }).availableItemCount > 0);
});
test("selezione è deterministica, senza duplicati e input invalidi non lanciano", () => {
  const params = { itemCount: 6, contentKind: "both", includeDrafts: true };
  const first = buildRepetitionPreview(params), second = buildRepetitionPreview(params);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.items.map((item) => item.contentId)).size, first.items.length);
  assert.equal(buildImageNamingPreview({ itemCount: 0 }).items.length, 0);
  assert.ok(buildImageNamingPreview({ itemCount: 0 }).warnings.length);
});
test("domain layer non usa rete persistenza Supabase o generazione runtime", () => {
  const source = readFileSync(new URL("./bricks.ts", import.meta.url), "utf8");
  for (const forbidden of ["fetch(", "localStorage", "sessionStorage", "supabase", "Math.random", "crypto.random"]) assert.equal(source.includes(forbidden), false, forbidden);
});
test("lettura usa i 10 Passage revisionati reali ed esclude le bozze", () => {
  const result = buildReadingComprehensionPreview();
  const reviewedIds = getContentsByType("passage").filter((item) => ["reviewed", "approved"].includes(item.reviewStatus)).map((item) => item.id);
  assert.equal(result.availablePassages.length, 10);
  assert.deepEqual(result.availablePassages.map((item) => item.passageId), reviewedIds);
  assert.ok(result.availablePassages.every((item) => !item.passageId.startsWith("candidate_")));
  assert.ok(buildReadingComprehensionPreview({ includeDrafts: true }).availablePassages.length > result.availablePassages.length);
});
test("audience lettura sono data-driven e filtrano soltanto brani raggiungibili", () => {
  assert.deepEqual(getAvailableReadingAudiences(), ["adolescent", "adult", "primary_school"]);
  assert.equal(buildReadingComprehensionPreview({ audience: "primary_school" }).availablePassages.length, 5);
  assert.equal(buildReadingComprehensionPreview({ audience: "adolescent" }).availablePassages.length, 5);
  assert.equal(buildReadingComprehensionPreview({ audience: "adult" }).availablePassages.length, 5);
  assert.ok(getAvailableReadingAudiences().every((audience) => buildReadingComprehensionPreview({ audience }).availablePassages.length > 0));
});
test("selezione Passage è deterministica e conserva testo domande e risposte", () => {
  const source = getContentsByType("passage").find((item) => item.id === "passage_001");
  const first = buildReadingComprehensionPreview({ passageId: "passage_001" }), second = buildReadingComprehensionPreview({ passageId: "passage_001" });
  assert.deepEqual(first, second);
  assert.equal(first.selectedPassage?.title, source?.title);
  assert.equal(first.selectedPassage?.text, source?.text);
  assert.deepEqual(first.selectedPassage?.questions, source?.questions);
  assert.equal(first.selectedPassage?.questions.length, 3);
  assert.ok(first.selectedPassage?.questions.every((question) => question.expectedAnswer));
  assert.equal(Object.hasOwn(first.selectedPassage || {}, "score"), false);
});
test("lettura non inventa domande e rifiuta selezioni fuori dal filtro", () => {
  const selected = buildReadingComprehensionPreview({ audience: "primary_school", passageId: "passage_001" }).selectedPassage;
  assert.equal(selected?.questions.length, 3);
  assert.equal(buildReadingComprehensionPreview({ audience: "adult", passageId: "passage_001" }).selectedPassage, undefined);
  assert.equal(buildReadingComprehensionPreview({ audience: "adult", passageId: "passage_001" }).warnings.length, 1);
});
test("lettura frasi usa soltanto Sentence revisionate e reali in normal mode", () => {
  const result = buildSentenceReadingPreview({ itemCount: 100 });
  const source = getContentsByType("sentence");
  assert.equal(result.availableItemCount, 60);
  assert.ok(result.items.every((item) => item.reviewStatus !== "draft" && source.some((sentence) => sentence.id === item.sentenceId && sentence.text === item.text)));
  assert.equal(new Set(result.items.map((item) => item.sentenceId)).size, result.items.length);
  assert.equal(buildSentenceReadingPreview({ itemCount: 100, includeDrafts: true }).availableItemCount, 68);
});
test("audience frasi sono data-driven, non vuote e filtrano correttamente", () => {
  assert.deepEqual(getAvailableSentenceAudiences(), ["adolescent", "adult", "primary_school", "secondary_school"]);
  for (const audience of getAvailableSentenceAudiences()) assert.equal(buildSentenceReadingPreview({ itemCount: 100, audience }).availableItemCount, 20);
});
test("lettura frasi rispetta quantità senza duplicare o riempire", () => {
  assert.equal(buildSentenceReadingPreview({ itemCount: 5 }).availableItemCount, 5);
  assert.equal(buildSentenceReadingPreview({ itemCount: 10 }).availableItemCount, 10);
  const oversized = buildSentenceReadingPreview({ itemCount: 30, audience: "adult" });
  assert.equal(oversized.availableItemCount, 20);
  assert.match(oversized.warnings[0], /^20 contenuti/);
});
test("lettura frasi è deterministica e conserva esattamente i testi", () => {
  const params = { itemCount: 10, audience: "primary_school" };
  const first = buildSentenceReadingPreview(params), second = buildSentenceReadingPreview(params);
  assert.deepEqual(first, second);
  for (const item of first.items) assert.equal(item.text, getContentsByType("sentence").find((sentence) => sentence.id === item.sentenceId)?.text);
});
