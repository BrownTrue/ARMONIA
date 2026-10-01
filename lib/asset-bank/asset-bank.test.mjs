import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { filterAssets, getApprovedAssets, searchAssets } from "./catalog.ts";
import { validateAssetCatalog } from "./validation.ts";

const validAsset = (overrides = {}) => ({ id: "mela-001", label: "mela", semanticCategory: "alimenti", imagePath: "/armonia-assets/images/mela-001.webp", altText: "Una mela rossa", sourceType: "armonia_original", commercialUseAllowed: true, reviewStatus: "approved", sourceName: "ARMONIA", licenseName: "Contenuto originale ARMONIA", partOfSpeech: "noun", syllableCount: 2, phonemicTranscription: "ˈmela", ...overrides });

test("catalogo vuoto è valido", () => assert.equal(validateAssetCatalog([]).valid, true));
test("asset completo è valido", () => assert.equal(validateAssetCatalog([validAsset()]).valid, true));
test("ID duplicato viene rifiutato", () => assert.equal(validateAssetCatalog([validAsset(), validAsset()]).errors.some((issue) => issue.message === "ID duplicato."), true));
test("approved senza provenienza o licenza commerciale viene rifiutato", () => {
  const result = validateAssetCatalog([validAsset({ sourceName: "", licenseName: "", commercialUseAllowed: false })]);
  assert.equal(result.valid, false); assert.equal(result.errors.length, 3);
});
test("ricerca e filtri usano solo metadati dichiarati", () => {
  const entries = [validAsset(), validAsset({ id: "correre-001", label: "correre", semanticCategory: "azioni", partOfSpeech: "verb", reviewStatus: "reviewed", phonemicTranscription: "korˈrere" })];
  assert.deepEqual(searchAssets("mela", entries).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(filterAssets(entries, { semanticCategory: "azioni" }).map((asset) => asset.id), ["correre-001"]);
  assert.deepEqual(filterAssets(entries, { partOfSpeech: "noun" }).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(filterAssets(entries, { reviewStatus: "reviewed" }).map((asset) => asset.id), ["correre-001"]);
  assert.deepEqual(filterAssets(entries, { phoneme: "ˈmel" }).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(getApprovedAssets(entries).map((asset) => asset.id), ["mela-001"]);
});
test("route Banca Asset rende empty state senza dati finti", () => {
  const page = readFileSync(new URL("../../app/risorse/laboratorio/banca/page.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../../components/asset-bank-browser.tsx", import.meta.url), "utf8");
  assert.match(page, /getAssets\(\)/); assert.match(browser, /La Banca Asset è pronta/); assert.doesNotMatch(page + browser, /mela-001|correre-001/);
});
