import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { HANDOUTS_V1 } from "../data/resources/handouts-v1.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

test("catalogo handout V1 contiene i quattro PDF definitivi con path coerenti", () => {
  assert.equal(HANDOUTS_V1.length, 4);
  assert.equal(new Set(HANDOUTS_V1.map((handout) => handout.id)).size, 4);
  for (const handout of HANDOUTS_V1) {
    assert.equal(handout.version, "1.0");
    assert.equal(handout.pdfPath, `/resources/handouts/${handout.fileName}`);
    assert.match(handout.fileName, /^ARMONIA_Handout_.+_v1\.0\.pdf$/);
    const path = `${root}/public${handout.pdfPath}`;
    assert.equal(existsSync(path), true, `${handout.fileName} deve esistere`);
    assert.equal(readFileSync(path).subarray(0, 5).toString(), "%PDF-");
  }
});

test("pagina Modulistica mostra attestazioni e handout senza ricerca o filtri", () => {
  const page = readFileSync(new URL("../app/risorse/documenti/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Modulistica e handout/);
  assert.match(page, /Attestazione di presenza/);
  assert.match(page, /Attestazione di percorso logopedico/);
  assert.match(page, /Apri anteprima/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /Scarica PDF/);
  assert.match(page, /DocumentActions/);
  assert.match(page, /source=\{\{ kind: "url", url: handout\.pdfPath \}\}/);
  assert.match(page, /className="mt-6 md:hidden"/);
  assert.doesNotMatch(page, /type="search"|Filtra|Cerca/);
});
