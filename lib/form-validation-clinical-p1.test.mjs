import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("session create and edit expose accessible field validation and a compact summary", () => {
  const create = read("../app/sedute/nuova/page.tsx");
  const editor = read("../components/session-editor.tsx");
  const patient = read("../app/pazienti/[id]/page.tsx");
  assert.match(create, /<SessionEditor/);
  assert.match(editor, /validateSessionForm/);
  assert.match(editor, /Ci sono alcune informazioni da controllare/);
  assert.match(editor, /data-validation-field="date"/);
  assert.match(editor, /data-validation-field="duration"/);
  assert.match(editor, /data-validation-field="price"/);
  assert.match(editor, /sticky bottom-/);
  assert.doesNotMatch(editor, /\balert\s*\(/);
  assert.match(patient, /session-edit-date/);
  assert.match(patient, /session-edit-duration/);
  assert.match(patient, /session-edit-price/);
});

test("empty activities warning remains unchanged and appointment duplicate is contextual", () => {
  const editor = read("../components/session-editor.tsx");
  assert.match(editor, /Registrare senza attività svolte\?/);
  assert.match(editor, /Per questo appuntamento esiste già una seduta/);
  assert.match(editor, /data-validation-field="appointmentId"/);
});

test("pathway goal and new assessment forms use app validation and human server errors", () => {
  const pathway = read("../components/clinical/patient-clinical-pathway.tsx");
  const patient = read("../app/pazienti/[id]/page.tsx");
  const validation = read("./form-validation.ts");
  assert.match(pathway, /validateClinicalPathwayForm/);
  assert.match(pathway, /validateNewAssessmentForm/);
  assert.match(pathway, /Non è stato possibile salvare il percorso\. Riprova\./);
  assert.match(pathway, /Non è stato possibile creare la valutazione\. Riprova\./);
  assert.match(patient, /validateGoalForm/);
  assert.match(validation, /Inserisci un titolo per l’obiettivo/);
});

test("session and goal deletes use awaited application modals and goal state commits after cloud success", () => {
  const patient = read("../app/pazienti/[id]/page.tsx");
  const provider = read("../components/data-provider.tsx");
  assert.match(patient, /DeleteEntityModal/);
  assert.doesNotMatch(patient, /confirm\("Eliminare (?:questa seduta|questo obiettivo)/);
  assert.match(patient, /aria-busy=\{busy\}/);
  assert.match(provider, /deleteGoal=async\(id:string\)=>\{[\s\S]*commitAfterRemoteDelete/);
});
