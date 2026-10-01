import assert from "node:assert/strict";
import { access, readFileSync } from "node:fs";
import test from "node:test";
import { ASSET_GRID_MANIFEST } from "../../data/armonia-assets/grid-manifest.mjs";
import { filterAssets, getApprovedAssets, getAssets, searchAssets } from "./catalog.ts";
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

test("catalogo reale contiene esattamente i 120 file del manifest con ID e path univoci", async () => {
  const assets = getAssets(), manifestFiles = ASSET_GRID_MANIFEST.flatMap((batch) => batch.files);
  assert.equal(assets.length, 120);
  assert.equal(new Set(assets.map((asset) => asset.id)).size, 120);
  assert.equal(new Set(assets.map((asset) => asset.imagePath)).size, 120);
  assert.deepEqual(assets.map((asset) => asset.imagePath.replace("/armonia-assets/images/", "")).sort(), [...manifestFiles].sort());
  await Promise.all(assets.map((asset) => new Promise((resolve, reject) => access(new URL(`../../public${asset.imagePath}`, import.meta.url), (error) => error ? reject(error) : resolve()))));
});

test("noun verb e concept hanno classificazione editoriale coerente", () => {
  const assets = getAssets();
  assert.equal(assets.filter((asset) => asset.id.startsWith("noun_")).length, 70);
  assert.equal(assets.filter((asset) => asset.id.startsWith("noun_")).every((asset) => asset.partOfSpeech === "noun"), true);
  assert.equal(assets.filter((asset) => asset.id.startsWith("verb_")).length, 30);
  assert.equal(assets.filter((asset) => asset.id.startsWith("verb_")).every((asset) => asset.partOfSpeech === "verb" && asset.semanticCategory === "azioni"), true);
  assert.equal(assets.filter((asset) => asset.id.startsWith("concept_")).length, 20);
  assert.equal(assets.filter((asset) => asset.id.startsWith("concept_")).every((asset) => asset.partOfSpeech === "adjective" && asset.semanticCategory === "concetti"), true);
});

test("ricerca e filtri operano sui 120 asset reali tutti in draft", () => {
  const assets = getAssets();
  assert.deepEqual(searchAssets("rana").map((asset) => asset.id), ["noun_rana_001"]);
  assert.equal(filterAssets(assets, { semanticCategory: "animali" }).length, 10);
  assert.equal(filterAssets(assets, { partOfSpeech: "verb" }).length, 30);
  assert.equal(assets.every((asset) => asset.reviewStatus === "draft" && asset.commercialUseAllowed === false), true);
  assert.equal(getApprovedAssets().length, 0);
});
