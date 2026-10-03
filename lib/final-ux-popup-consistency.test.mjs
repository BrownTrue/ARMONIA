import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const browserPopup = /window\.(?:confirm|alert|prompt)\s*\(|\bif\s*\(\s*(?:confirm|alert|prompt)\s*\(/;

const touchedFlows = [
  "components/clinical/assessment-v2-editor.tsx",
  "components/clinical-tools/qab-it/qab-runner.tsx",
  "components/calendar-feed-settings.tsx",
  "components/settings/data-export-section.tsx",
  "app/impostazioni/page.tsx",
];

test("i flussi UX toccati non usano popup browser", () => {
  for (const path of touchedFlows) {
    assert.doesNotMatch(read(path), browserPopup, path);
  }
});

test("Assessment usa dialog applicativi per area e anamnesi e mostra errori inline", () => {
  const source = read("components/clinical/assessment-v2-editor.tsx");
  assert.match(source, /title="Rimuovere questa area\?"/);
  assert.match(source, /title="Rimuovere questa sezione anamnestica\?"/);
  assert.match(source, /role="alert"/);
  assert.match(source, /Non è stato possibile rimuovere l’area clinica\. Riprova\./);
});

test("QAB apre una conferma locale prima di azzerare la somministrazione", () => {
  const source = read("components/clinical-tools/qab-it/qab-runner.tsx");
  assert.match(source, /setResetOpen\(true\)/);
  assert.match(source, /title="Cambiare modulo\?"/);
  assert.match(source, /Cambia modulo e ricomincia/);
  assert.match(source, /querySelectorAll\('\[role="dialog"\]'\)\.length === 1/);
});

test("Calendar Feed conserva busy ed errori nelle conferme applicative", () => {
  const source = read("components/calendar-feed-settings.tsx");
  assert.match(source, /title="Rigenerare il link calendario\?"/);
  assert.match(source, /title="Disattivare il calendario\?"/);
  assert.match(source, /busy=\{busy\}/);
  assert.match(source, /error=\{message\?\.kind === "error"/);
});

test("export completo richiede conferma informativa senza cambiare il tipo di archivio", () => {
  const source = read("components/settings/data-export-section.tsx");
  assert.match(source, /title="Esportare tutti i dati\?"/);
  assert.match(source, /zipExport\(snapshot,kind\)/);
  assert.match(source, /run\("all"\)/);
});

test("rimozione logo mantiene busy, errore e branding provider esistenti", () => {
  const source = read("app/impostazioni/page.tsx");
  assert.match(source, /title="Rimuovere il logo\?"/);
  assert.match(source, /await removeLogo\(\)/);
  assert.match(source, /busy=\{brandingBusy\}/);
  assert.match(source, /Non è stato possibile rimuovere il logo\. Riprova\./);
});
