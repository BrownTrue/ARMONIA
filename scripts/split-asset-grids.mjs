import path from "node:path";
import { fileURLToPath } from "node:url";
import { ASSET_GRID_MANIFEST, EXPECTED_ASSET_GRID_OUTPUTS } from "../data/armonia-assets/grid-manifest.mjs";
import { splitAssetGrids } from "../lib/asset-bank/grid-splitter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const overwrite = process.argv.includes("--overwrite");
const unknown = process.argv.slice(2).filter((argument) => argument !== "--overwrite");
if (unknown.length) throw new Error(`Opzione non riconosciuta: ${unknown.join(" ")}`);

const inputDir = path.join(root, "tmp/asset-grids");
const outputDir = path.join(root, "public/armonia-assets/images");
const reviewPath = path.join(inputDir, "asset-grid-review.html");

const jobs = await splitAssetGrids({ manifest: ASSET_GRID_MANIFEST, inputDir, outputDir, reviewPath, overwrite, expectedOutputs: EXPECTED_ASSET_GRID_OUTPUTS });
console.log(`Creati ${jobs.length} pannelli WebP in ${outputDir}`);
console.log(`Controllo visivo: ${reviewPath}`);
