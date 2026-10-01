import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { ASSET_GRID_MANIFEST, EXPECTED_ASSET_GRID_OUTPUTS } from "../../data/armonia-assets/grid-manifest.mjs";
import { gridPanelRects, splitAssetGrids, validateGridManifest } from "./grid-splitter.mjs";

test("manifest contiene 15 batch, 8 pannelli ciascuno e 120 nomi unici", () => {
  assert.equal(validateGridManifest(ASSET_GRID_MANIFEST, EXPECTED_ASSET_GRID_OUTPUTS), true);
  assert.equal(new Set(ASSET_GRID_MANIFEST.flatMap((batch) => batch.files)).size, 120);
});

test("suddivisione divisibile segue ordine left-to-right e top-to-bottom", () => {
  assert.deepEqual(gridPanelRects(8, 4), [
    { left: 0, top: 0, width: 2, height: 2, position: 1 }, { left: 2, top: 0, width: 2, height: 2, position: 2 }, { left: 4, top: 0, width: 2, height: 2, position: 3 }, { left: 6, top: 0, width: 2, height: 2, position: 4 },
    { left: 0, top: 2, width: 2, height: 2, position: 5 }, { left: 2, top: 2, width: 2, height: 2, position: 6 }, { left: 4, top: 2, width: 2, height: 2, position: 7 }, { left: 6, top: 2, width: 2, height: 2, position: 8 },
  ]);
});

test("dimensioni non divisibili coprono ogni pixel senza buchi o sovrapposizioni", () => {
  const width = 1774, height = 887, rects = gridPanelRects(width, height), coverage = new Uint8Array(width * height);
  for (const rect of rects) for (let y = rect.top; y < rect.top + rect.height; y++) for (let x = rect.left; x < rect.left + rect.width; x++) coverage[y * width + x]++;
  assert.equal(coverage.every((count) => count === 1), true);
  assert.equal(rects.reduce((total, rect) => total + rect.width * rect.height, 0), width * height);
});

test("split reale conserva ordine cromatico e protegge overwrite", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "armonia-grid-")), inputDir = path.join(temporary, "input"), outputDir = path.join(temporary, "output"), reviewPath = path.join(temporary, "review.html");
  await mkdir(inputDir);
  const colors = [[220,20,60],[255,140,0],[240,220,0],[20,160,60],[30,120,220],[90,60,180],[210,40,180],[40,190,190]];
  const width = 35, height = 17, channels = 3, pixels = Buffer.alloc(width * height * channels);
  for (const rect of gridPanelRects(width, height)) for (let y = rect.top; y < rect.top + rect.height; y++) for (let x = rect.left; x < rect.left + rect.width; x++) { const offset = (y * width + x) * channels; colors[rect.position - 1].forEach((value, channel) => { pixels[offset + channel] = value; }); }
  await sharp(pixels, { raw: { width, height, channels } }).png().toFile(path.join(inputDir, "batch-01.png"));
  const files = colors.map((_, index) => `test_panel_${String(index + 1).padStart(3, "0")}.webp`), manifest = [{ batch: 1, input: "batch-01.png", files }];
  const jobs = await splitAssetGrids({ manifest, inputDir, outputDir, reviewPath, expectedOutputs: 8 });
  assert.deepEqual(jobs.map((job) => job.rect.position), [1,2,3,4,5,6,7,8]);
  for (let index = 0; index < files.length; index++) { const stats = await sharp(path.join(outputDir, files[index])).stats(); const dominant = stats.channels.slice(0, 3).map((channel) => Math.round(channel.mean)); assert.ok(dominant.every((value, channel) => Math.abs(value - colors[index][channel]) < 12)); }
  assert.match(await readFile(reviewPath, "utf8"), /test_panel_001\.webp/);
  await assert.rejects(() => splitAssetGrids({ manifest, inputDir, outputDir, expectedOutputs: 8 }), /Output già esistente/);
});

test("split fallisce prima di scrivere se un batch richiesto manca", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "armonia-grid-missing-"));
  await assert.rejects(() => splitAssetGrids({ manifest: [{ batch: 1, input: "batch-01.png", files: Array.from({ length: 8 }, (_, index) => `missing_panel_${String(index + 1).padStart(3, "0")}.webp`) }], inputDir: temporary, outputDir: path.join(temporary, "output"), expectedOutputs: 8 }), /Batch richiesto mancante/);
});
