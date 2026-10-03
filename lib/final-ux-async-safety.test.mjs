import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const settings = read("app/impostazioni/page.tsx");
const proforma = read("components/economy/economic-documents-panel.tsx");
const administrative = read("components/patient-administrative-details.tsx");
const materials = read("app/materiali/page.tsx");
const locations = read("components/settings/locations-settings.tsx");
const services = read("components/settings/services-settings.tsx");
const assessment = read("components/clinical/assessment-v2-editor.tsx");
const destructiveModal = read("components/destructive-action-modal.tsx");

test("Google disconnect verifica HTTP prima di cambiare lo stato locale e protegge il doppio click", () => {
  const request = settings.indexOf('fetch("/api/google-calendar/disconnect"');
  const responseCheck = settings.indexOf("if(!response.ok)", request);
  const clear = settings.indexOf("clearGoogleCalendarLocalState()", request);
  assert.ok(request >= 0 && responseCheck > request && clear > responseCheck);
  assert.match(settings, /googleActionFlight\.current/);
  assert.match(settings, /Non è stato possibile scollegare Google Calendar\. Riprova\./);
  assert.doesNotMatch(settings, /confirm\("Scollegare Google Calendar/);
  assert.doesNotMatch(settings, /confirm\("Rimettere in coda tutti gli appuntamenti/);
});

test("delete Proforma ha conferma applicativa busy failure e single flight", () => {
  assert.match(proforma, /title="Eliminare questa bozza\?"/);
  assert.match(proforma, /deleteFlight\.current/);
  assert.match(proforma, /await onDelete\(document\)/);
  assert.match(proforma, /Non è stato possibile eliminare la bozza\. Riprova\./);
  assert.doesNotMatch(proforma, /window\.confirm/);
});

test("azioni distruttive selezionate usano la modal ARMONIA senza confirm browser", () => {
  for (const source of [administrative, materials, locations, services]) {
    assert.match(source, /DestructiveActionModal/);
    assert.doesNotMatch(source, /(?:window\.)?confirm\s*\(/);
  }
  assert.match(administrative, /await onDelete\(patient\.id\)/);
  assert.match(materials, /deletingRef\.current/);
  assert.match(locations, /humanLocationError/);
  assert.match(services, /humanServiceError/);
});

test("la modal distruttiva è accessibile e blocca la chiusura durante busy", () => {
  assert.match(destructiveModal, /if \(!busy\) onClose\(\)/);
  assert.match(destructiveModal, /aria-busy=\{busy\}/);
  assert.match(destructiveModal, /role="alert"/);
  assert.match(destructiveModal, /disabled=\{busy\}/);
});

test("Assessment V2 non mostra cause tecniche nelle operazioni utente", () => {
  assert.doesNotMatch(assessment, /cause instanceof Error \? cause\.message/);
  for (const message of [
    "Non è stato possibile completare la valutazione",
    "Non è stato possibile salvare le correzioni",
    "Non è stato possibile eliminare la valutazione",
    "Non è stato possibile rimuovere l’area clinica",
  ]) assert.match(assessment, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
