import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export function validateGridManifest(manifest, expectedOutputs = 120) {
  const expectedBatches = expectedOutputs / 8;
  if (!Number.isInteger(expectedBatches) || !Array.isArray(manifest) || manifest.length !== expectedBatches) throw new Error(`Il manifest deve contenere esattamente ${expectedBatches} batch.`);
  const inputs = new Set(), outputs = new Set();
  for (const entry of manifest) {
    if (!entry.input || inputs.has(entry.input)) throw new Error(`Input batch duplicato o mancante: ${entry.input || "?"}`);
    inputs.add(entry.input);
    if (!Array.isArray(entry.files) || entry.files.length !== 8) throw new Error(`${entry.input} deve contenere esattamente 8 filename.`);
    for (const file of entry.files) {
      if (!/^[a-z0-9]+(?:_[a-z0-9]+)*_\d{3}\.webp$/.test(file)) throw new Error(`Filename output non valido: ${file}`);
      if (outputs.has(file)) throw new Error(`Filename output duplicato: ${file}`);
      outputs.add(file);
    }
  }
  if (outputs.size !== expectedOutputs) throw new Error(`Il manifest deve produrre esattamente ${expectedOutputs} file; trovati ${outputs.size}.`);
  return true;
}

export function gridPanelRects(width, height, columns = 4, rows = 2) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < columns || height < rows) throw new Error("Dimensioni griglia non valide.");
  const rects = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const left = Math.floor(column * width / columns), right = Math.floor((column + 1) * width / columns);
    const top = Math.floor(row * height / rows), bottom = Math.floor((row + 1) * height / rows);
    rects.push({ left, top, width: right - left, height: bottom - top, position: row * columns + column + 1 });
  }
  return rects;
}

export async function splitAssetGrids({ manifest, inputDir, outputDir, overwrite = false, quality = 92, expectedOutputs = 120, reviewPath }) {
  validateGridManifest(manifest, expectedOutputs);
  const jobs = [];
  for (const batch of manifest) {
    const inputPath = path.join(inputDir, batch.input);
    try { await access(inputPath); } catch { throw new Error(`Batch richiesto mancante: ${inputPath}`); }
    const metadata = await sharp(inputPath).metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Dimensioni non leggibili: ${inputPath}`);
    const rects = gridPanelRects(metadata.width, metadata.height);
    batch.files.forEach((file, index) => jobs.push({ batch: batch.batch, inputPath, outputPath: path.join(outputDir, file), file, rect: rects[index] }));
  }
  if (jobs.length !== expectedOutputs) throw new Error(`Attesi ${expectedOutputs} output, pianificati ${jobs.length}.`);
  if (!overwrite) for (const job of jobs) {
    try { await access(job.outputPath); throw new Error(`Output già esistente: ${job.outputPath}. Usa --overwrite per rigenerarlo.`); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  await mkdir(outputDir, { recursive: true });
  for (const job of jobs) await sharp(job.inputPath).extract(job.rect).webp({ quality, effort: 6 }).toFile(job.outputPath);
  if (reviewPath) await writeReviewPage(reviewPath, jobs, outputDir);
  return jobs;
}

export async function writeReviewPage(reviewPath, jobs, outputDir) {
  const relativeOutput = path.relative(path.dirname(reviewPath), outputDir).split(path.sep).join("/");
  const cards = jobs.map((job) => `<figure><img src="${escapeHtml(`${relativeOutput}/${job.file}`)}" alt=""><figcaption><strong>${escapeHtml(job.file)}</strong><span>Batch ${String(job.batch).padStart(2, "0")} · posizione ${job.rect.position}</span></figcaption></figure>`).join("\n");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Verifica Banca Asset ARMONIA</title><style>body{margin:0;padding:28px;background:#f6f7f5;color:#24352f;font-family:Arial,sans-serif}h1{margin:0 0 6px}.meta{margin:0 0 24px;color:#647067}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}figure{margin:0;overflow:hidden;border:1px solid #dfe7df;border-radius:18px;background:#fff;box-shadow:0 8px 24px #2b45370d}img{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:#fafbfa}figcaption{padding:12px;overflow-wrap:anywhere}strong,span{display:block;font-size:12px}span{margin-top:4px;color:#78827c}</style></head><body><h1>Verifica Banca Asset ARMONIA</h1><p class="meta">${jobs.length} pannelli · ordine batch e posizione 1→8</p><main class="grid">${cards}</main></body></html>`;
  await mkdir(path.dirname(reviewPath), { recursive: true });
  await writeFile(reviewPath, html, "utf8");
}

function escapeHtml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
