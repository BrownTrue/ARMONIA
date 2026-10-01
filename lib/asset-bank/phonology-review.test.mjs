import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { armoniaAssetPhonology } from "../../data/armonia-assets/phonology.ts";
import { createDecisionStore } from "../../scripts/review-asset-phonology.mjs";
import { getAssets } from "./catalog.ts";
import { createPhonologyReviewDecision, getPhonologyReviewItems, proposedMetadata, summarizePhonologyReview } from "./phonology-review.ts";

const fixtureItems = getAssets().slice(0, 3).map((asset) => ({
  asset,
  candidate: {
    assetId: asset.id,
    syllabification: asset.syllabification,
    syllableCount: asset.syllableCount,
    phonemicTranscription: asset.phonemicTranscription,
    phonemes: asset.phonemes,
    consonantClusters: asset.consonantClusters,
    geminates: asset.geminates,
    pronunciationNotes: asset.pronunciationNotes,
    phonologyReviewStatus: "needs_review",
  },
  classification: "linear",
}));
const first = fixtureItems[0];

test("il revisore gestisce correttamente la coda corrente vuota", () => {
  assert.equal(getPhonologyReviewItems().length, 0);
  assert.equal(Object.keys(armoniaAssetPhonology).length, 120);
  assert.deepEqual(summarizePhonologyReview([], {}), { total: 0, approved: 0, corrected: 0, deferred: 0, pending: 0 });
});

test("approvazione, correzione e rinvio restano disponibili per candidati futuri", () => {
  const approved = createPhonologyReviewDecision(first, "approved", undefined, "2026-10-01T10:00:00.000Z");
  assert.equal(approved.ok, true);
  assert.equal(approved.decision.status, "approved");
  assert.equal(approved.decision.metadata.phonologyReviewStatus, "reviewed");

  const correction = proposedMetadata(first.candidate);
  correction.syllabification = "ra-na";
  const corrected = createPhonologyReviewDecision(first, "corrected", correction);
  assert.equal(corrected.ok, true);
  assert.equal(corrected.decision.metadata.syllabification, "ra-na");

  const invalid = createPhonologyReviewDecision(first, "corrected", { ...correction, syllabification: "", phonemes: [] });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.errors.length > 0, true);

  const deferred = createPhonologyReviewDecision(first, "deferred");
  assert.equal(deferred.ok, true);
  assert.equal(deferred.decision.metadata, undefined);
});

test("conteggi progresso distinguono decisioni e candidati futuri pendenti", () => {
  const decisions = {
    [fixtureItems[0].asset.id]: createPhonologyReviewDecision(fixtureItems[0], "approved").decision,
    [fixtureItems[1].asset.id]: createPhonologyReviewDecision(fixtureItems[1], "corrected", proposedMetadata(fixtureItems[1].candidate)).decision,
    [fixtureItems[2].asset.id]: createPhonologyReviewDecision(fixtureItems[2], "deferred").decision,
  };
  assert.deepEqual(summarizePhonologyReview(fixtureItems, decisions), { total: 3, approved: 1, corrected: 1, deferred: 1, pending: 0 });
});

test("decision store persiste le decisioni e le ricarica dopo il riavvio", async () => {
  const directory = await mkdtemp(join(tmpdir(), "armonia-phonology-review-"));
  const filePath = join(directory, "decisions.json"), store = createDecisionStore(filePath), before = readFileSync(new URL("../../data/armonia-assets/phonology.ts", import.meta.url), "utf8");
  const approved = createPhonologyReviewDecision(fixtureItems[0], "approved").decision;
  const corrected = createPhonologyReviewDecision(fixtureItems[1], "corrected", proposedMetadata(fixtureItems[1].candidate)).decision;
  const deferred = createPhonologyReviewDecision(fixtureItems[2], "deferred").decision;
  const decisions = { [fixtureItems[0].asset.id]: approved, [fixtureItems[1].asset.id]: corrected, [fixtureItems[2].asset.id]: deferred };
  await store.save(decisions);
  const restartedStore = createDecisionStore(filePath);
  assert.deepEqual(await restartedStore.load(), JSON.parse(JSON.stringify(decisions)));
  assert.equal(JSON.parse(await readFile(filePath, "utf8")).version, 1);
  assert.equal(readFileSync(new URL("../../data/armonia-assets/phonology.ts", import.meta.url), "utf8"), before);
  await rm(directory, { recursive: true, force: true });
});

test("tool resta fuori dal runtime pubblico e usa uno storage locale ignorato", () => {
  const packageJson = readFileSync(new URL("../../package.json", import.meta.url), "utf8"), catalog = readFileSync(new URL("../../data/armonia-assets/catalog.ts", import.meta.url), "utf8"), gitignore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
  assert.match(packageJson, /asset-bank:review-phonology/);
  assert.doesNotMatch(catalog, /phonology-review|review-asset-phonology/);
  assert.match(gitignore, /tmp\/asset-phonology-review\//);
});
