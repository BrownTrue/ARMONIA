import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { clinicalToolCatalog, getClinicalTool, visibleClinicalTools } from "./catalog.ts";
import { filterClinicalTools, primaryLink, searchClinicalTools } from "./search.ts";
import { validateClinicalToolCatalog } from "./validation.ts";

test("il catalogo V1 contiene 38 record reviewed strutturalmente validi e univoci", () => {
  assert.equal(clinicalToolCatalog.length, 38);
  assert.equal(visibleClinicalTools.length, 38);
  assert.equal(new Set(clinicalToolCatalog.map((tool) => tool.id)).size, 38);
  assert.deepEqual(validateClinicalToolCatalog(clinicalToolCatalog), []);
});

test("la coda needs_review editoriale non entra nella directory", () => {
  assert.equal(clinicalToolCatalog.some((tool) => tool.catalogReviewStatus !== "reviewed"), false);
  assert.equal(visibleClinicalTools.some((tool) => tool.name === "CEECCA Questionnaire"), false);
});

test("ricerca nome, acronimo, area, popolazione ed editore", () => {
  assert.ok(searchClinicalTools(visibleClinicalTools, "EAT-10").some((tool) => tool.id.includes("eat-10")));
  assert.ok(searchClinicalTools(visibleClinicalTools, "PVB").some((tool) => tool.id === "pvb-it"));
  assert.ok(searchClinicalTools(visibleClinicalTools, "disfagia").length > 0);
  assert.ok(searchClinicalTools(visibleClinicalTools, "adulti").length > 0);
  assert.ok(searchClinicalTools(visibleClinicalTools, "Giunti").length > 0);
});

test("i filtri principali coprono età, area e stato", () => {
  assert.ok(filterClinicalTools(visibleClinicalTools, "pediatric", "all", "all").length > 0);
  assert.ok(filterClinicalTools(visibleClinicalTools, "adult", "all", "all").length > 0);
  for (const area of ["language", "voice", "swallowing", "fluency", "aac", "literacy"]) assert.ok(filterClinicalTools(visibleClinicalTools, "all", area, "all").length > 0, area);
  for (const status of ["integrated", "open_verified", "external", "permission_required"]) assert.ok(filterClinicalTools(visibleClinicalTools, "all", "all", status).length > 0, status);
  assert.deepEqual(filterClinicalTools(visibleClinicalTools, "all", "all", "integrated").map((tool) => tool.id), ["qab-it"]);
  assert.ok(visibleClinicalTools.some((tool) => tool.licenseStatus === "restricted"));
  assert.ok(visibleClinicalTools.some((tool) => tool.licenseStatus === "unclear"));
});

test("lookup dettaglio e CTA non chiamano PubMed sito ufficiale", () => {
  assert.equal(getClinicalTool("pvb-it")?.acronym, "PVB");
  assert.equal(getClinicalTool("missing"), undefined);
  const vhi = getClinicalTool("vhi-it");
  assert.ok(vhi);
  assert.equal(primaryLink(vhi).label, "Fonte scientifica ↗");
});

test("il dettaglio omette valori mancanti e non contiene label editoriali A-D", () => {
  const source = fs.readFileSync(new URL("../../components/clinical-tools/tool-detail.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!value\) return null/);
  assert.doesNotMatch(source, /italianEvidence/);
});

test("il selector crea snapshot e conserva il percorso manuale", () => {
  const source = fs.readFileSync(new URL("../../components/clinical/assessment-v2-editor.tsx", import.meta.url), "utf8");
  assert.match(source, /source: "manual"/);
  assert.match(source, /source: "catalog"/);
  assert.match(source, /catalogToolId: tool\.id/);
  assert.match(source, /nameSnapshot: tool\.name/);
  assert.match(source, /versionSnapshot: tool\.version/);
  assert.match(source, /areaSnapshot: area/);
});
