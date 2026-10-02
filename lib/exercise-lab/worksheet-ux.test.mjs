import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const builder = readFileSync(`${root}components/exercise-lab-builder.tsx`, "utf8");
const composition = readFileSync(`${root}components/worksheet-draft-editor.tsx`, "utf8");
const preview = readFileSync(`${root}components/worksheet-preview.tsx`, "utf8");

test("il workspace separa composizione, editor e anteprima senza ricreare la Worksheet", () => {
  assert.match(builder, /type WorkspaceView = "compose" \| "choose" \| "add" \| "edit" \| "preview"/);
  assert.equal((builder.match(/useState\(createWorksheetDraft\)/g) || []).length, 1);
  assert.match(builder, /view === "compose"/);
  assert.match(builder, /view === "edit"/);
  assert.match(builder, /view === "preview"/);
  assert.doesNotMatch(builder, /setWorksheet\(createWorksheetDraft/);
});

test("la composizione resta compatta e delega l'editing a una vista dedicata", () => {
  assert.match(composition, /CompactPreview/);
  assert.match(composition, /onEditActivity/);
  assert.match(composition, /Duplica/);
  assert.doesNotMatch(composition, /ExerciseDraftEditor/);
});

test("empty state e anteprima rispettano la presenza di attività", () => {
  assert.match(composition, /La scheda è ancora vuota/);
  assert.match(composition, /disabled=\{!worksheet\.blocks\.length\}/);
  assert.match(composition, /onClick=\{onPreview\}/);
  assert.match(composition, /worksheet\.blocks\.length\} attività/);
});

test("le azioni secondarie sono raccolte in un menu accessibile", () => {
  assert.match(composition, /<details className="relative">/);
  assert.match(composition, /aria-label="Altre azioni attività"/);
  assert.match(composition, />Duplica<\/button>/);
  assert.match(composition, />Elimina<\/button>/);
  assert.match(composition, /aria-label="Sposta attività su"/);
  assert.match(composition, /aria-label="Sposta attività giù"/);
});

test("l'anteprima segue l'ordine reale, mostra i contenuti e non espone risposte attese", () => {
  assert.match(preview, /worksheet\.blocks\.map/);
  assert.match(preview, /exercise\.items\.map/);
  assert.match(preview, /question\.prompt/);
  assert.doesNotMatch(preview, /expectedAnswer/);
});

test("la UI professionale non espone controlli pilot o metadati tecnici", () => {
  const normalUi = `${builder}\n${composition}\n${preview}`;
  for (const label of ["Includi bozze", "Richiesti", "reviewStatus", "commercialUseAllowed", "sourceType", "ContentItem"]) {
    assert.doesNotMatch(normalUi, new RegExp(label));
  }
  assert.match(builder, /const includeDrafts = false/);
  assert.match(builder, /Scegli manualmente/);
  assert.match(builder, /Usa i filtri/);
});
