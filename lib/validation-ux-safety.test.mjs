import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const assessmentSource = await readFile(new URL("../components/clinical/assessment-v2-editor.tsx", import.meta.url), "utf8");
const patientSource = await readFile(new URL("../app/pazienti/[id]/page.tsx", import.meta.url), "utf8");
const settingsSource = await readFile(new URL("../app/impostazioni/page.tsx", import.meta.url), "utf8");

test("Salva e chiudi attende il flush, naviga solo dopo successo e rende visibile il fallimento", () => {
  assert.match(assessmentSource, /await forceSave\(\);\s*router\.push/);
  assert.match(assessmentSource, /Non è stato possibile salvare la valutazione\. Controlla la connessione e riprova\./);
  assert.match(assessmentSource, /disabled=\{closing\}/);
  assert.match(assessmentSource, /aria-busy=\{closing\}/);
  assert.doesNotMatch(assessmentSource, /catch \{\}\s*\}\}\s*className="btn btn-quiet[^>]*>Salva e chiudi/);
});

test("eliminazione paziente richiede la modal e attende il delete prima del redirect", () => {
  assert.match(patientSource, /title="Eliminare questo paziente\?"/);
  assert.match(patientSource, /await deletePatient\(p\.id\); router\.push\("\/pazienti"\)/);
  assert.match(patientSource, /Non è stato possibile eliminare il paziente\. Riprova tra poco\./);
  assert.match(patientSource, /disabled=\{deleting\}/);
  assert.doesNotMatch(patientSource, /confirm\("Eliminare il paziente e tutti i dati collegati\?"\)/);
});

test("annullare la conferma paziente non invoca il delete e un errore consente il retry", () => {
  assert.match(patientSource, /onClick=\{onClose\}[^>]*>Annulla<\/button>/);
  assert.match(patientSource, /catch \{ setError\([^)]*\); setDeleting\(false\); \}/);
  assert.match(patientSource, /error \? "Riprova eliminazione" : "Elimina paziente"/);
});

test("profilo espone loading, successo e fallimento senza rejection silenziosa", () => {
  assert.match(settingsSource, /setProfileSaving\(true\);setSaved\(false\);setProfileError\(""\)/);
  assert.match(settingsSource, /catch\{setProfileError\("Non è stato possibile salvare le modifiche\. Riprova\."\);\}/);
  assert.match(settingsSource, /finally\{setProfileSaving\(false\);\}/);
  assert.match(settingsSource, /role="alert"/);
  assert.match(settingsSource, /profileSaving\?"Salvataggio…":"Salva dati professionali"/);
});
