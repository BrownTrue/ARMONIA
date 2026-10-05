import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { armoniaOriginalClinicalToolsV1 } from "../../data/clinical-tools/armonia-originals-v1.ts";
import { clinicalToolCatalog } from "./catalog.ts";

const root = path.resolve(import.meta.dirname, "../..");
const zipChecksums = {
  "armonia-cp03": "1e31fe1bededa5e3a241746982900a36f5665b631a72acb82cd000d5c9a1c26b",
  "armonia-pci": "aa00bb64ddffdb592ac34548ee7bf6be0d5fa5968aaef2a1a347c8b98222ba8e",
  "armonia-pip": "879a0d5f55d9395b50b3b5432fe3e23b95d897fb46c480860bd12927328b4fee",
  "armonia-off": "fb0b4d4856274012fe3a0a07d4753d7b8ac5dbfc035ba954ab818fa64a838d85",
  "armonia-plo": "998ed512b1233db92b11ef39f942606033306681724ab7d1fec2514acdb0f8c8",
  "armonia-opa": "2f209dab565b48b7c06cba78fc97c6a72206c3c45db2b50f81736e5e907bc54d",
  "armonia-mot": "3c862bc01036225a71fea66530d847751ff6c893c2835a3ee98261ccb64c377d",
};

test("i sette strumenti originali restano catalog-only e non standardizzati", () => {
  assert.equal(armoniaOriginalClinicalToolsV1.length, 7);
  assert.equal(new Set(armoniaOriginalClinicalToolsV1.map((tool) => tool.acronym)).size, 7);
  for (const tool of armoniaOriginalClinicalToolsV1) {
    assert.equal(tool.version, "1.0");
    assert.equal(tool.origin, "armonia");
    assert.equal(tool.standardizationStatus, "non_standardized");
    assert.equal(tool.integrationStatus, "catalog_only");
    assert.equal(tool.licenseStatus, "armonia_original");
    assert.ok(tool.editorialNotice.length > 40);
    assert.ok(tool.materials.some((material) => material.kind === "zip"));
  }
  assert.deepEqual(clinicalToolCatalog.filter((tool) => tool.integrationStatus === "integrated").map((tool) => tool.id), ["qab-it"]);
  assert.equal(armoniaOriginalClinicalToolsV1.filter((tool) => tool.materials.length === 6).length, 2);
  assert.equal(armoniaOriginalClinicalToolsV1.filter((tool) => tool.materials.length === 5).length, 5);
});

test("tutti i materiali dichiarati esistono, hanno il formato atteso e i pacchetti sono byte-identici", () => {
  for (const tool of armoniaOriginalClinicalToolsV1) {
    const folder = tool.id.replace("armonia-", "");
    for (const material of tool.materials) {
      const filePath = path.join(root, "private", "clinical-tools", "originals", folder, material.fileName);
      const bytes = fs.readFileSync(filePath);
      assert.ok(bytes.byteLength > 0, filePath);
      if (material.kind === "pdf") assert.equal(bytes.subarray(0, 4).toString(), "%PDF", filePath);
      if (material.kind === "docx" || material.kind === "zip") assert.equal(bytes.subarray(0, 2).toString(), "PK", filePath);
      if (material.kind === "zip") assert.equal(createHash("sha256").update(bytes).digest("hex"), zipChecksums[tool.id], filePath);
    }
  }
});

test("i materiali passano soltanto dalla route autenticata e sono inclusi nel tracing Vercel", () => {
  const route = fs.readFileSync(path.join(root, "app/api/clinical-tools/[toolId]/materials/[materialId]/route.ts"), "utf8");
  const config = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.match(route, /authenticatedUserId\(\)/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /service[_-]?role/i);
  assert.match(config, /private\/clinical-tools\/originals\/\*\*\/\*/);
});

test("directory e dettaglio dichiarano origine e non standardizzazione senza renderli nativi", () => {
  const directory = fs.readFileSync(path.join(root, "components/clinical-tools/tool-directory.tsx"), "utf8");
  const detail = fs.readFileSync(path.join(root, "components/clinical-tools/tool-detail.tsx"), "utf8");
  for (const source of [directory, detail]) {
    assert.match(source, /Strumento originale ARMONIA/);
    assert.match(source, /Non standardizzato/);
  }
  assert.match(directory, /Originali ARMONIA/);
  assert.match(detail, /Scarica pacchetto completo/);
  assert.match(detail, /shareMode="authenticated-file"/);
  assert.match(detail, /downloadSource=\{\{kind:"url",url:downloadUrl\}\}/);
  assert.doesNotMatch(detail, /Clinicamente approvato/);
});
