import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("app/pazienti/[id]/page.tsx");
const overview = read("components/patients/mobile-patient-overview.tsx");
const shell = read("components/app-shell.tsx");
const mobileShell = read("components/app-shell/mobile-shell-chrome.tsx");
const header = read("components/app-shell/mobile-header.tsx");

test("patient detail riusa lookup e controller canonici senza una route mobile parallela", () => {
  assert.match(page, /data\.patients\.find\(\(x\) => x\.id === id\)/);
  assert.match(page, /getPatientOverview\(data, id\)/);
  assert.match(page, /buildPatientTimeline\(id, data\.sessions/);
  assert.match(page, /patientEconomicSummary\(id, data\.sessions/);
  assert.match(page, /PatientClinicalPathway/);
  assert.match(page, /PatientResourcesSection/);
  assert.doesNotMatch(page, /\/mobile\/pazienti/);
});

test("shell mobile supporta un detail header accessibile senza aprire il drawer", () => {
  assert.match(shell, /MobileHeaderDetail/);
  assert.match(shell, /detailHeader=\{mobileHeader\}/);
  assert.match(mobileShell, /detail=\{detailHeader\}/);
  assert.match(header, /detail\.backHref/);
  assert.match(header, /detail\.backLabel \|\| "Torna indietro"/);
  assert.match(page, /backHref: "\/pazienti"/);
  assert.match(page, /backLabel: "Torna ai pazienti"/);
});

test("presentazione mobile espone identità, azioni e sole sezioni canoniche", () => {
  assert.match(page, /id="mobile-patient-name"/);
  assert.match(page, /Registra seduta/);
  assert.match(page, /Azioni paziente/);
  assert.match(page, /Modifica paziente/);
  assert.match(page, /Elimina paziente/);
  assert.match(page, /\['overview','Panoramica'\],\['clinical','Percorso'\],\['activity','Attività'\],\['resources','Risorse'\]/);
  assert.match(page, /min-h-11/);
});

test("tab e deep link restano nello stato query canonico", () => {
  assert.match(page, /new URLSearchParams\(window\.location\.search\)\.get\("tab"\)/);
  assert.match(page, /if \(requested === "sessions"\) setTab\("activity"\)/);
  assert.match(page, /url\.searchParams\.set\("tab", nextTab\)/);
  assert.match(page, /window\.history\.replaceState/);
});

test("panoramica mobile mostra fatti esistenti senza KPI o outcome inventati", () => {
  assert.match(overview, /Dove siamo adesso\?/);
  assert.match(overview, /Prossimo appuntamento/);
  assert.match(overview, /Ultima seduta/);
  assert.match(overview, /Obiettivi/);
  assert.match(overview, /Attività recenti/);
  assert.match(overview, /Situazione economica/);
  assert.match(overview, /PatientAdministrativeDetailsCard/);
  assert.doesNotMatch(overview, /diagnosi|outcome|miglioramento clinico/i);
});

test("desktop resta separato e i componenti con side effect non sono duplicati", () => {
  assert.match(page, /hidden gap-4 md:grid lg:grid-cols-12/);
  assert.match(page, /mobileLayout \? <MobilePatientOverview/);
  assert.equal((page.match(/<PatientClinicalPathway/g) || []).length, 1);
  assert.equal((page.match(/<PatientResourcesSection/g) || []).length, 1);
  assert.equal((page.match(/<PatientForm/g) || []).length, 1);
  assert.equal((page.match(/<AppShell/g) || []).length, 3);
});
