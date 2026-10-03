import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const calendar = readFileSync(new URL("../app/calendario/page.tsx", import.meta.url), "utf8");
const proforma = readFileSync(new URL("../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../app/impostazioni/page.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/app-shell.tsx", import.meta.url), "utf8");
const materials = readFileSync(new URL("../app/materiali/page.tsx", import.meta.url), "utf8");
const resources = readFileSync(new URL("../app/risorse/page.tsx", import.meta.url), "utf8");

test("Calendario spiega le azioni indisponibili quando mancano pazienti", () => {
  assert.match(calendar, /calendar-patient-required/);
  assert.match(calendar, /devi prima aggiungere un paziente/);
  assert.match(calendar, /Crea paziente/);
});

test("Proforma spiega il cloud e valida il motivo di annullamento al click", () => {
  assert.match(proforma, /proforma-cloud-required/);
  assert.match(proforma, /Motivo dell’annullamento \*/);
  assert.doesNotMatch(proforma, /disabled=\{voiding \|\| !voidReason\.trim\(\)\}/);
  assert.match(proforma, /Inserisci il motivo dell’annullamento/);
});

test("Logout locale e salvataggio profilo hanno feedback visibile", () => {
  assert.match(settings, /local-signout-hint/);
  assert.match(shell, /mobile-local-signout-hint/);
  assert.match(settings, /role="status"[\s\S]*Modifiche salvate\./);
  assert.match(settings, /setTimeout\(\(\) => setSaved\(false\), 4000\)/);
});

test("Preferiti Materiali attendono il salvataggio e mostrano errori locali", () => {
  for (const source of [materials, resources]) {
    assert.match(source, /await saveMaterial/);
    assert.match(source, /Non è stato possibile aggiornare i preferiti\. Riprova\./);
    assert.match(source, /aria-busy/);
  }
});

test("Quota Storage non disponibile resta esplicita senza bloccare la Libreria", () => {
  assert.match(materials, /Spazio utilizzato temporaneamente non disponibile\./);
  assert.match(materials, />Riprova</);
  assert.match(resources, /Spazio utilizzato temporaneamente non disponibile\./);
});
