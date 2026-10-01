import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildImageNamingPreview, buildMinimalPairsPreview, buildRepetitionPreview, matchesPhonology } from "./bricks.ts";

test("denominazione usa solo parole revisionate con immagini reali", () => {
  const result = buildImageNamingPreview({ itemCount: 12 });
  assert.equal(result.availableItemCount, 8);
  assert.match(result.warnings[0], /^8 contenuti/);
  assert.ok(result.items.every((item) => item.imageAssetId && item.imagePath && item.reviewStatus !== "draft"));
});
test("matching fonologico è esatto e non confonde t con tʃ", () => {
  const item = { syllabification: "ci-bo", syllableCount: 2, phonemicTranscription: "/ˈtʃibo/", phonemes: [{ symbol: "tʃ", position: "initial" }], consonantClusters: [], geminates: [] };
  assert.equal(matchesPhonology(item, { phoneme: "t" }), false);
  assert.equal(matchesPhonology(item, { phoneme: "tʃ" }), true);
});
test("coppie draft escluse di default e incluse solo esplicitamente", () => {
  assert.equal(buildMinimalPairsPreview({ itemCount: 10 }).availableItemCount, 0);
  assert.equal(buildMinimalPairsPreview({ itemCount: 10, includeDrafts: true }).availableItemCount, 6);
  assert.equal(buildMinimalPairsPreview({ itemCount: 10, includeDrafts: true, requireImages: true }).availableItemCount, 1);
});
test("contrasto coppie è simmetrico e pairType distingue quasi minime", () => {
  assert.equal(buildMinimalPairsPreview({ itemCount: 4, includeDrafts: true, phonemeA: "k", phonemeB: "p" }).items[0].minimalPairId, "pair_pane_cane_001");
  assert.equal(buildMinimalPairsPreview({ itemCount: 10, includeDrafts: true, pairType: "near_minimal" }).availableItemCount, 1);
});
test("filtri denominazione coprono posizione sillabe cluster e geminata", () => {
  assert.ok(buildImageNamingPreview({ itemCount: 12, phoneme: "s", position: "initial" }).items.every((item) => ["specchio"].includes(item.text)));
  assert.ok(buildImageNamingPreview({ itemCount: 12, syllableCount: 2 }).items.length > 0);
  assert.deepEqual(buildImageNamingPreview({ itemCount: 12, clusterPhoneme: "p" }).items.map((item) => item.text), ["specchio"]);
  assert.deepEqual(buildImageNamingPreview({ itemCount: 12, geminate: "k" }).items.map((item) => item.text), ["specchio"]);
});
test("coppie usano solo record esistenti e filtri posizione", () => {
  const result = buildMinimalPairsPreview({ itemCount: 12, includeDrafts: true, position: "initial" });
  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((item) => item.minimalPairId.startsWith("pair_") && item.contrast.position === "initial"));
  assert.match(result.warnings[0], /contenuti disponibili/);
});
test("ripetizione rispetta kind e stato editoriale", () => {
  assert.equal(buildRepetitionPreview({ itemCount: 30, contentKind: "word" }).availableItemCount, 8);
  assert.equal(buildRepetitionPreview({ itemCount: 30, contentKind: "nonword" }).availableItemCount, 0);
  assert.equal(buildRepetitionPreview({ itemCount: 30, contentKind: "both", includeDrafts: true }).availableItemCount, 20);
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
