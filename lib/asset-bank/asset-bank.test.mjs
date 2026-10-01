import assert from "node:assert/strict";
import { access, readFileSync } from "node:fs";
import test from "node:test";
import { ASSET_GRID_MANIFEST } from "../../data/armonia-assets/grid-manifest.mjs";
import { armoniaAssetPhonologyCandidates } from "../../data/armonia-assets/phonology-candidates.ts";
import { armoniaAssetPhonology } from "../../data/armonia-assets/phonology.ts";
import { filterAssets, getApprovedAssets, getAssets, searchAssets } from "./catalog.ts";
import { validateAssetCatalog } from "./validation.ts";

const validAsset = (overrides = {}) => ({ id: "mela-001", label: "mela", semanticCategory: "alimenti", imagePath: "/armonia-assets/images/mela-001.webp", altText: "Una mela rossa", sourceType: "armonia_original", commercialUseAllowed: true, reviewStatus: "approved", sourceName: "ARMONIA", licenseName: "Contenuto originale ARMONIA", partOfSpeech: "noun", ...overrides });
const reviewedPhonology = (overrides = {}) => validAsset({ syllabification: "ce-na", syllableCount: 2, phonemicTranscription: "/ˈtʃena/", phonemes: [{ symbol: "tʃ", position: "initial", syllable: 1 }, { symbol: "e", position: "medial", syllable: 1 }, { symbol: "n", position: "medial", syllable: 2 }, { symbol: "a", position: "final", syllable: 2 }], consonantClusters: [], geminates: [], phonologyReviewStatus: "reviewed", ...overrides });

test("catalogo vuoto è valido", () => assert.equal(validateAssetCatalog([]).valid, true));
test("asset completo è valido", () => assert.equal(validateAssetCatalog([validAsset()]).valid, true));
test("ID duplicato viene rifiutato", () => assert.equal(validateAssetCatalog([validAsset(), validAsset()]).errors.some((issue) => issue.message === "ID duplicato."), true));
test("approved senza provenienza o licenza commerciale viene rifiutato", () => {
  const result = validateAssetCatalog([validAsset({ sourceName: "", licenseName: "", commercialUseAllowed: false })]);
  assert.equal(result.valid, false); assert.equal(result.errors.length, 3);
});
test("ricerca e filtri usano solo metadati dichiarati", () => {
  const entries = [validAsset({ phonemes: [{ symbol: "m", position: "initial" }] }), validAsset({ id: "correre-001", label: "correre", semanticCategory: "azioni", partOfSpeech: "verb", reviewStatus: "reviewed" })];
  assert.deepEqual(searchAssets("mela", entries).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(filterAssets(entries, { semanticCategory: "azioni" }).map((asset) => asset.id), ["correre-001"]);
  assert.deepEqual(filterAssets(entries, { partOfSpeech: "noun" }).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(filterAssets(entries, { reviewStatus: "reviewed" }).map((asset) => asset.id), ["correre-001"]);
  assert.deepEqual(filterAssets(entries, { phoneme: "m" }).map((asset) => asset.id), ["mela-001"]);
  assert.deepEqual(getApprovedAssets(entries).map((asset) => asset.id), ["mela-001"]);
});

test("asset senza fonologia resta valido", () => assert.equal(validateAssetCatalog([validAsset()]).valid, true));
test("metadati fonologici espliciti completi sono validi", () => assert.equal(validateAssetCatalog([reviewedPhonology()]).valid, true));
test("syllableCount invalido viene rifiutato", () => assert.equal(validateAssetCatalog([validAsset({ syllableCount: 0 })]).errors.some((issue) => issue.field === "syllableCount"), true));
test("position fonemica invalida viene rifiutata", () => assert.equal(validateAssetCatalog([validAsset({ phonemes: [{ symbol: "r", position: "sillabica" }] })]).errors.some((issue) => issue.message === "Posizione fonemica non valida."), true));
test("cluster con meno di due fonemi viene rifiutato", () => assert.equal(validateAssetCatalog([validAsset({ consonantClusters: [{ phonemes: ["r"], position: "initial" }] })]).errors.some((issue) => issue.field === "consonantClusters"), true));
test("reviewed senza dati minimi viene rifiutato", () => {
  const result = validateAssetCatalog([validAsset({ phonologyReviewStatus: "reviewed" })]);
  for (const field of ["syllabification", "syllableCount", "phonemicTranscription", "phonemes"]) assert.equal(result.errors.some((issue) => issue.field === field), true);
});
test("filtri fonologici usano unità e posizioni esplicite", () => {
  const cena = reviewedPhonology(), fragola = reviewedPhonology({ id: "fragola-001", label: "fragola", syllabification: "fra-go-la", syllableCount: 3, phonemicTranscription: "/ˈfraɡola/", phonemes: [{ symbol: "f", position: "initial", syllable: 1 }, { symbol: "r", position: "medial", syllable: 1 }], consonantClusters: [{ phonemes: ["f", "r"], position: "initial", syllable: 1 }], geminates: [] }), gatto = reviewedPhonology({ id: "gatto-001", label: "gatto", phonemes: [{ symbol: "g", position: "initial" }, { symbol: "t", position: "medial" }], geminates: ["t"] });
  const entries = [cena, fragola, gatto];
  assert.deepEqual(filterAssets(entries, { phoneme: "r" }).map((asset) => asset.id), ["fragola-001"]);
  assert.deepEqual(filterAssets(entries, { phoneme: "r", phonemePosition: "medial" }).map((asset) => asset.id), ["fragola-001"]);
  assert.deepEqual(filterAssets(entries, { syllableCount: 3 }).map((asset) => asset.id), ["fragola-001"]);
  assert.deepEqual(filterAssets(entries, { consonantCluster: ["f", "r"] }).map((asset) => asset.id), ["fragola-001"]);
  assert.deepEqual(filterAssets(entries, { clusterPhoneme: "r" }).map((asset) => asset.id), ["fragola-001"]);
  assert.deepEqual(filterAssets(entries, { geminate: "t" }).map((asset) => asset.id), ["gatto-001"]);
  assert.deepEqual(filterAssets(entries, { phonologyReviewStatus: "reviewed" }).map((asset) => asset.id), ["mela-001", "fragola-001", "gatto-001"]);
});
test("affricata tʃ resta una singola unità e non corrisponde a t", () => {
  const entries = [reviewedPhonology()];
  assert.equal(filterAssets(entries, { phoneme: "tʃ" }).length, 1);
  assert.equal(filterAssets(entries, { phoneme: "t" }).length, 0);
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

test("il campione fonologico reale comprende esattamente 12 asset: 11 reviewed e 1 needs_review", () => {
  const assets = getAssets(), withPhonology = assets.filter((asset) => asset.phonologyReviewStatus);
  assert.equal(withPhonology.length, 12);
  assert.equal(withPhonology.filter((asset) => asset.phonologyReviewStatus === "reviewed").length, 11);
  assert.deepEqual(withPhonology.filter((asset) => asset.phonologyReviewStatus === "needs_review").map((asset) => asset.id), ["noun_zebra_001"]);
  assert.equal(assets.filter((asset) => !asset.phonologyReviewStatus).length, 108);
});

test("il campione reale è interrogabile per fonemi atomici, posizione, cluster e geminate", () => {
  const ids = (filters) => filterAssets(getAssets(), filters).map((asset) => asset.id);
  assert.deepEqual(ids({ phoneme: "r", phonemePosition: "initial" }), ["noun_rana_001"]);
  assert.deepEqual(ids({ consonantCluster: ["f", "r"] }), ["noun_fragola_001"]);
  assert.deepEqual(ids({ consonantCluster: ["ɡ", "r"] }), ["noun_tigre_001"]);
  assert.deepEqual(ids({ geminate: "t" }), ["noun_gatto_001"]);
  assert.deepEqual(ids({ phoneme: "ʃ" }), ["noun_pesce_001", "noun_scimmia_001"]);
  assert.deepEqual(ids({ phoneme: "ʃ", geminate: "ʃ" }), ["noun_pesce_001"]);
  assert.deepEqual(ids({ phoneme: "ʎ" }), ["noun_coniglio_001", "noun_maglia_001"]);
  assert.deepEqual(ids({ phoneme: "ɲ" }), ["noun_bagno_001"]);
  assert.deepEqual(ids({ phoneme: "dz" }), ["noun_zebra_001"]);
  assert.deepEqual(ids({ geminate: "m" }), ["noun_scimmia_001"]);
  assert.deepEqual(ids({ geminate: "k" }), ["noun_ginocchio_001", "noun_specchio_001"]);
});

test("le affricate del campione restano unità atomiche nelle ricerche esatte", () => {
  assert.deepEqual(filterAssets(getAssets(), { phoneme: "dʒ" }).map((asset) => asset.id), ["noun_ginocchio_001"]);
  assert.equal(filterAssets(getAssets(), { phoneme: "d" }).some((asset) => asset.id === "noun_ginocchio_001"), false);
  assert.equal(filterAssets(getAssets(), { phoneme: "t" }).some((asset) => asset.phonemes?.some((phoneme) => phoneme.symbol === "tʃ")), false);
});

test("i valori editoriali del campione sono conservati senza modificare lo stato generale", () => {
  const assets = getAssets(), zebra = assets.find((asset) => asset.id === "noun_zebra_001"), ginocchio = assets.find((asset) => asset.id === "noun_ginocchio_001");
  assert.equal(validateAssetCatalog(assets).valid, true);
  assert.equal(zebra?.phonemicTranscription, "/ˈdzɛbra/");
  assert.equal(zebra?.phonemes?.[0]?.symbol, "dz");
  assert.equal(zebra?.pronunciationNotes, "Voce mantenuta in revisione editoriale per possibili variazioni di pronuncia nell'uso italiano.");
  assert.equal(ginocchio?.phonemes?.[0]?.symbol, "dʒ");
  assert.equal(assets.every((asset) => asset.reviewStatus === "draft" && asset.commercialUseAllowed === false), true);
});

test("le proposte coprono esattamente i 108 asset non revisionati senza sovrapposizioni", () => {
  const assets = getAssets(), catalogIds = new Set(assets.map((asset) => asset.id)), reviewedIds = new Set(Object.keys(armoniaAssetPhonology));
  const candidateIds = armoniaAssetPhonologyCandidates.map((candidate) => candidate.assetId);
  assert.equal(reviewedIds.size, 12);
  assert.equal(candidateIds.length, 108);
  assert.equal(new Set(candidateIds).size, 108);
  assert.equal(candidateIds.every((id) => catalogIds.has(id) && !reviewedIds.has(id)), true);
  assert.deepEqual(new Set([...reviewedIds, ...candidateIds]), catalogIds);
});

test("tutte le proposte rispettano il contratto fonologico e restano needs_review", () => {
  const assetsById = new Map(getAssets().map((asset) => [asset.id, asset]));
  const proposedAssets = armoniaAssetPhonologyCandidates.map(({ assetId, ...metadata }) => ({ ...assetsById.get(assetId), ...metadata }));
  assert.equal(validateAssetCatalog(proposedAssets).valid, true);
  assert.equal(armoniaAssetPhonologyCandidates.every((candidate) => candidate.phonologyReviewStatus === "needs_review"), true);
  for (const candidate of armoniaAssetPhonologyCandidates) {
    const syllableCount = candidate.syllableCount || 0;
    assert.equal(Boolean(candidate.syllabification && candidate.syllableCount && candidate.phonemicTranscription && candidate.phonemes?.length), true);
    assert.equal(candidate.phonemes?.every((phoneme) => phoneme.syllable !== undefined && phoneme.syllable <= syllableCount), true);
    assert.equal(candidate.consonantClusters?.every((cluster) => cluster.syllable !== undefined && cluster.syllable <= syllableCount), true);
  }
});

test("le affricate delle proposte sono unità fonemiche atomiche", () => {
  const affricates = ["tʃ", "dʒ", "ts", "dz"];
  for (const candidate of armoniaAssetPhonologyCandidates) {
    for (const affricate of affricates) {
      if (candidate.phonemicTranscription?.includes(affricate)) assert.equal(candidate.phonemes?.some((phoneme) => phoneme.symbol === affricate), true, `${candidate.assetId}: ${affricate}`);
    }
  }
});

test("le proposte restano isolate dal catalogo e dalla UI di produzione", () => {
  const productionCatalog = readFileSync(new URL("../../data/armonia-assets/catalog.ts", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../../components/asset-bank-browser.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(productionCatalog + browser, /phonology-candidates/);
  assert.equal(getAssets().filter((asset) => asset.phonologyReviewStatus).length, 12);
  assert.match(browser, /Non ancora revisionato\./);
});
