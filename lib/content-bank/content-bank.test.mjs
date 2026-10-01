import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAssets } from "../asset-bank/catalog.ts";
import { CONTENT_TYPES } from "./types.ts";
import { filterWords, getAvailableRepresentations, getContentById, getContents, getContentsByType, getMinimalPairs, getWordById, searchContents } from "./catalog.ts";
import { validateContentCatalog } from "./validation.ts";

const contents = getContents();
const ids = (items) => items.map((item) => item.id);

test("la discriminated union contiene esattamente i sei tipi V1", () => {
  assert.deepEqual(CONTENT_TYPES, ["word", "nonword", "minimal_pair", "sentence", "passage", "sequence"]);
  assert.deepEqual(Object.fromEntries(CONTENT_TYPES.map((type) => [type, getContentsByType(type).length])), { word: 14, nonword: 6, minimal_pair: 6, sentence: 8, passage: 3, sequence: 3 });
});

test("mini corpus ha 40 ID univoci e tutti i riferimenti validi", () => {
  assert.equal(contents.length, 40);
  assert.equal(new Set(ids(contents)).size, 40);
  assert.equal(validateContentCatalog(contents).valid, true);
});

test("parole illustrate riusano fonologia e ID reali della Banca Asset", () => {
  const cane = getWordById("word_cane_001"), asset = getAssets().find((item) => item.id === "noun_cane_001");
  assert.deepEqual(cane?.phonemes, asset?.phonemes);
  assert.equal(cane?.phonemicTranscription, asset?.phonemicTranscription);
  assert.deepEqual(cane?.imageAssetIds, ["noun_cane_001"]);
});

test("parola con e senza immagine espongono rappresentazioni calcolate", () => {
  assert.deepEqual(getAvailableRepresentations("word_cane_001"), { text: true, image: true });
  assert.deepEqual(getAvailableRepresentations("word_lana_001"), { text: true, image: false });
  assert.deepEqual(getAvailableRepresentations("missing"), { text: false, image: false });
  assert.equal(filterWords({ hasImage: true }).length, 8);
  assert.equal(filterWords({ hasImage: false }).length, 6);
});

test("pane/cane e rana/lana sono coppie minime dichiarate", () => {
  const pairs = getMinimalPairs({ pairType: "minimal" });
  assert.equal(ids(pairs).includes("pair_pane_cane_001"), true);
  assert.equal(ids(pairs).includes("pair_rana_lana_001"), true);
  assert.deepEqual(getContentById("pair_pane_cane_001")?.contrast, { phonemeA: "p", phonemeB: "k", position: "initial" });
});

test("ricerca fonema è esatta e t non corrisponde a tʃ", () => {
  assert.equal(ids(filterWords({ phoneme: "tʃ" })).includes("word_cane_001"), false);
  assert.equal(ids(filterWords({ phoneme: "t" })).includes("word_gatto_001"), true);
  assert.equal(ids(filterWords({ phoneme: "t" })).some((id) => id === "word_cane_001"), false);
  const synthetic = { ...getWordById("word_cane_001"), id: "word_affricata_test", phonemes: [{ symbol: "tʃ", position: "initial", syllable: 1 }] };
  assert.equal(filterWords({ phoneme: "t" }, [synthetic]).length, 0);
  assert.equal(filterWords({ phoneme: "tʃ" }, [synthetic]).length, 1);
});

test("filtri parola coprono posizione, sillabe, cluster e geminate", () => {
  assert.equal(ids(filterWords({ phoneme: "r", phonemePosition: "initial" })).includes("word_rana_001"), true);
  assert.equal(ids(filterWords({ syllableCount: 2 })).includes("word_pane_001"), true);
  assert.equal(ids(filterWords({ consonantCluster: ["s", "t", "r"] })).includes("word_strada_001"), true);
  assert.equal(ids(filterWords({ geminate: "t" })).includes("word_gatto_001"), true);
});

test("le sei non-parole sono draft, plausibili e valide strutturalmente", () => {
  const nonwords = getContentsByType("nonword");
  assert.equal(nonwords.length, 6);
  assert.equal(nonwords.every((item) => item.reviewStatus === "draft" && item.notes?.includes("nessuna validazione clinica")), true);
  assert.equal(validateContentCatalog(nonwords).valid, true);
});

test("frasi hanno collegamenti Word validi e ricerca testuale", () => {
  const sentences = getContentsByType("sentence");
  assert.equal(sentences.length, 8);
  assert.equal(sentences.every((sentence) => sentence.linkedWordIds?.every((id) => Boolean(getWordById(id)))), true);
  assert.deepEqual(ids(searchContents("finestra")).sort(), ["passage_stanza_luminosa_001", "passage_passeggiata_001", "sentence_gatto_001"].sort());
});

test("brani originali hanno 50–100 parole e domande tipizzate", () => {
  const passages = getContentsByType("passage");
  assert.equal(passages.length, 3);
  assert.equal(passages.every((passage) => passage.wordCount >= 50 && passage.wordCount <= 100 && (passage.questions?.length || 0) >= 2), true);
  assert.equal(passages.flatMap((passage) => passage.questions || []).some((question) => question.type === "inferential"), true);
  assert.equal(passages.flatMap((passage) => passage.questions || []).some((question) => question.type === "sequence"), true);
});

test("sequenze usano soltanto asset reali con ordine coerente", () => {
  const assets = new Set(getAssets().map((asset) => asset.id)), sequences = getContentsByType("sequence");
  assert.equal(sequences.length, 3);
  assert.equal(sequences.every((sequence) => sequence.steps.length >= 2 && sequence.steps.every((step, index) => step.order === index + 1 && assets.has(step.imageAssetId))), true);
});

test("validator rifiuta riferimenti rotti, duplicati e affricate spezzate", () => {
  const cane = getWordById("word_cane_001");
  const broken = [
    ...contents,
    { ...cane, id: "word_broken_001", imageAssetIds: ["missing_asset"], phonemicTranscription: "/tʃa/", phonemes: [{ symbol: "t", position: "initial", syllable: 1 }, { symbol: "ʃ", position: "final", syllable: 1 }] },
    { ...getContentById("pair_pane_cane_001"), id: "pair_broken_001", wordBId: "missing_word" },
  ];
  const result = validateContentCatalog(broken);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some((issue) => issue.message.includes("Asset inesistente")), true);
  assert.equal(result.errors.some((issue) => issue.message.includes("WordContent inesistente")), true);
  assert.equal(result.errors.some((issue) => issue.message.includes("unità atomica")), true);
});

test("la Banca Asset resta separata e non dipende dalla Banca Contenuti", () => {
  const assetCatalog = readFileSync(new URL("../../data/armonia-assets/catalog.ts", import.meta.url), "utf8");
  const assetDomain = readFileSync(new URL("../asset-bank/catalog.ts", import.meta.url), "utf8");
  assert.equal(getAssets().length, 120);
  assert.doesNotMatch(assetCatalog + assetDomain, /armonia-content|content-bank/);
});

test("la preview è read-only e non espone CRUD o generazione esercizi", () => {
  const page = readFileSync(new URL("../../app/risorse/laboratorio/contenuti/page.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../../components/content-bank-browser.tsx", import.meta.url), "utf8");
  assert.match(page, /getContents\(\)/);
  assert.doesNotMatch(page + browser, /Crea contenuto|Modifica contenuto|Elimina contenuto|Genera esercizio/);
});
