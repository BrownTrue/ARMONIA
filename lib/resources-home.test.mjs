import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { filterResourceMaterials, materialKind, recentMaterials } from "./resources-home.ts";

const material = (overrides = {}) => ({ id: "m1", title: "Scheda", description: "", category: "linguaggio", tags: [], fileName: "scheda.pdf", mimeType: "application/pdf", size: 100, favorite: false, patientIds: [], createdAt: "2026-01-01T10:00:00Z", ...overrides });

test("home Risorse usa soltanto materiali reali recenti e preferiti", () => {
  const materials = [material(), material({ id: "m2", favorite: true, createdAt: "2026-02-01T10:00:00Z" })];
  assert.deepEqual(recentMaterials(materials).map((entry) => entry.id), ["m2", "m1"]);
  assert.deepEqual(filterResourceMaterials(materials, "favorites").map((entry) => entry.id), ["m2"]);
});

test("tipo risorsa deriva dai dati reali del materiale", () => {
  assert.equal(materialKind(material()), "PDF");
  assert.equal(materialKind(material({ externalUrl: "https://example.test", mimeType: "" })), "Link");
  assert.equal(materialKind(material({ fileName: "audio.mp3", mimeType: "audio/mpeg" })), "Audio");
});

test("route Risorse collega Libreria, Modulistica, directory Strumenti e Laboratorio", () => {
  const page = readFileSync(new URL("../app/risorse/page.tsx", import.meta.url), "utf8");
  assert.match(page, /href: "\/materiali"/);
  for (const route of ["/risorse/documenti", "/risorse/strumenti", "/risorse/laboratorio"]) assert.match(page, new RegExp(route));
  assert.match(page, /title: "Modulistica e handout"[\s\S]*action: "Apri modulistica"[\s\S]*upcoming: false/);
  assert.doesNotMatch(page, /title: "Modulistica e handout"[\s\S]*upcoming: true/);
  assert.match(page, /href: "\/risorse\/strumenti"[\s\S]*upcoming: false/);
  assert.doesNotMatch(page, /EAT-10|VHI/);
});

test("home Risorse mobile usa una directory tappabile e preserva il desktop", () => {
  const page = readFileSync(new URL("../app/risorse/page.tsx", import.meta.url), "utf8");
  const mobile = readFileSync(new URL("../components/resources/mobile-resource-directory.tsx", import.meta.url), "utf8");
  assert.match(page, /<MobileResourceDirectory areas=\{areas\}\/>[\s\S]*<div className="hidden md:block">/);
  assert.match(mobile, /<nav className="md:hidden" aria-label="Aree Risorse">/);
  assert.match(mobile, /areas\.map\(\(area\) => <Link[\s\S]*href=\{area\.href\}/);
  assert.match(mobile, /min-h-\[5\.25rem\][\s\S]*active:bg-\[#e4ebe0\]/);
  assert.match(mobile, /ChevronRightIcon/);
  assert.match(mobile, /aria-hidden="true"/);
  assert.doesNotMatch(mobile, /shadow|emoji|data\.materials|Risorse recenti/);
  for (const route of ["/materiali", "/risorse/documenti", "/risorse/strumenti"]) assert.match(mobile, new RegExp(route));
});
