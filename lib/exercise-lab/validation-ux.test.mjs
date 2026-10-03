import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const builder = readFileSync(new URL("../../components/exercise-lab-builder.tsx", import.meta.url), "utf8");
const resources = readFileSync(new URL("../../components/patient-resources-section.tsx", import.meta.url), "utf8");
const materials = readFileSync(new URL("../../app/materiali/page.tsx", import.meta.url), "utf8");

test("Materiali usa errori inline per titolo e link e separa file da server", () => {
  assert.match(materials, /validateMaterialForm/);
  assert.match(materials, /data-validation-field="title"/);
  assert.match(materials, /data-validation-field="externalUrl"/);
  assert.match(materials, /fileError[\s\S]*serverError/);
  assert.match(materials, /validateMaterialFileDeclaration/);
});

test("Laboratorio spiega le CTA incomplete e valida il paziente al click", () => {
  assert.match(builder, /Scegli almeno un contenuto per aggiungere l’attività alla scheda/);
  assert.match(builder, /aria-describedby=\{!preparedExercise\?"add-activity-hint"/);
  assert.match(builder, /Seleziona un paziente per salvare la scheda/);
  assert.doesNotMatch(builder, /disabled=\{!selectedPatientId \|\| saving\}/);
});

test("Ricette e modelli usano dialog applicativi con busy e fallimento visibile", () => {
  assert.match(builder, /function SavedItemDialog/);
  assert.match(builder, /Conferma eliminazione/);
  assert.match(builder, /aria-busy=\{busy\}/);
  assert.match(builder, /Non è stato possibile completare l’operazione/);
  assert.doesNotMatch(builder, /window\.(prompt|confirm|alert)/);
});

test("azioni scheda paziente attendono home assignment duplicazione ed eliminazione", () => {
  assert.match(resources, /busyAction/);
  assert.match(resources, /Aggiornamento…/);
  assert.match(resources, /Duplicazione…/);
  assert.match(resources, /Eliminare questa scheda\?/);
  assert.doesNotMatch(resources, /window\.(prompt|confirm|alert)/);
});
