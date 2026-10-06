import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("app/pazienti/[id]/page.tsx");
const overview = read("components/patients/mobile-patient-overview.tsx");
const activity = read("components/patients/mobile-patient-activity.tsx");
const clinicalPathway = read("components/clinical/patient-clinical-pathway.tsx");
const patientResources = read("components/patient-resources-section.tsx");
const sessionPage = read("app/sedute/nuova/page.tsx");
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
  assert.match(page, /const params = new URLSearchParams\(window\.location\.search\)/);
  assert.match(page, /const requested = params\.get\("tab"\)/);
  assert.match(page, /requested === "sessions"\) setTab\("activity"\)/);
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

test("Attività mobile usa la proiezione condivisa e lascia la timeline desktop separata", () => {
  assert.match(page, /buildMobilePatientActivity\(id, timeline, data\.appointments, data\.sessions\)/);
  assert.match(page, /mobileLayout \? <MobilePatientActivity/);
  assert.match(page, /hidden space-y-4[\s\S]*md:block/);
  assert.match(activity, /groupMobilePatientActivity\(items\)/);
  assert.match(activity, /Seduta da registrare/);
  assert.match(activity, /Appuntamento futuro/);
  assert.match(activity, /Appuntamento annullato/);
});

test("azioni Session mobile riusano edit delete e registrazione canonici", () => {
  assert.match(activity, /onOpenSession\(item\.item\.session\)/);
  assert.match(activity, /onDeleteSession\(session\)/);
  assert.match(activity, /\/sedute\/nuova\?a=\$\{appointment\.id\}&p=\$\{appointment\.patientId\}/);
  assert.match(page, /onOpenSession=\{setDetail\}/);
  assert.match(page, /onDeleteSession=\{setDeleteSessionTarget\}/);
});

test("editor nuova Session usa detail header e ritorna ad Attività", () => {
  assert.match(sessionPage, /title: "Registra seduta"/);
  assert.match(sessionPage, /`\/pazienti\/\$\{patientId\}\?tab=activity`/);
  assert.match(sessionPage, /<SessionEditor/);
  assert.match(sessionPage, /onSaved=\{\(session\) => router\.push\(`\/pazienti\/\$\{session\.patientId\}\?tab=activity`\)\}/);
});

test("Percorso mobile usa una presentazione dedicata sugli stessi controller canonici", () => {
  assert.match(page, /presentation=\{mobileLayout \? "mobile" : "desktop"\}/);
  assert.match(clinicalPathway, /presentation\?: "desktop" \| "mobile"/);
  assert.match(clinicalPathway, /if \(presentation === "mobile"\)/);
  assert.match(clinicalPathway, /saveClinicalPathway/);
  assert.match(clinicalPathway, /createClinicalAssessmentDraft/);
  assert.match(clinicalPathway, /linkGoalToClinicalPathway/);
  assert.doesNotMatch(page, /MobileClinicalPathwayProvider|mobileClinicalPathways/);
});

test("Percorso mobile rende gerarchia, stati e azioni cliniche touch-friendly", () => {
  assert.match(clinicalPathway, /MobileClinicalOverview/);
  assert.match(clinicalPathway, /MobileAssessmentsSubview/);
  assert.match(clinicalPathway, /MobileGoalsSubview/);
  assert.match(clinicalPathway, /Attività collegate/);
  assert.match(clinicalPathway, /Percorsi precedenti/);
  assert.match(clinicalPathway, /Bozza/);
  assert.match(clinicalPathway, /Completata/);
  assert.match(clinicalPathway, /min-h-11/);
  assert.match(clinicalPathway, /aria-label="Azioni percorso"/);
  assert.match(clinicalPathway, /aria-label=\{`Azioni obiettivo \$\{goal\.title\}`\}/);
  assert.match(page, /onEditGoal=\{setGoalEdit\}/);
  assert.match(page, /onDeleteGoal=\{setDeleteGoalTarget\}/);
});

test("drill-down Percorso usa una sola subview tipizzata e URL navigabile", () => {
  assert.match(clinicalPathway, /type MobileClinicalSection = "clinical-overview" \| "assessments" \| "goals" \| "linked-activity" \| "history" \| "history-detail"/);
  assert.match(page, /url\.searchParams\.set\("section", section\)/);
  assert.match(page, /window\.history\.pushState/);
  assert.match(page, /window\.addEventListener\("popstate", syncFromUrl\)/);
  assert.match(page, /mobileDrillDown \? "hidden" : "flex"/);
  assert.match(page, /title: clinicalSectionTitle/);
  assert.match(page, /onBack: closeClinicalDrillDown/);
});

test("azioni cliniche mobile applicano una sola overlay state machine", () => {
  assert.match(clinicalPathway, /type MobileClinicalOverlay = \{ kind: "none" \}/);
  assert.match(clinicalPathway, /useState<MobileClinicalOverlay>\(\{ kind: "none" \}\)/);
  assert.doesNotMatch(clinicalPathway, /showGoals|showAssessments|showHistory|openPanel/);
  assert.match(clinicalPathway, /setMobileOverlay\(\{ kind: "none" \}\); onEditGoal\(goal\)/);
  assert.match(clinicalPathway, /setMobileOverlay\(\{ kind: "none" \}\); onDeleteGoal\(goal\)/);
  assert.match(page, /MobileGoalEditorPanel/);
  assert.match(page, /fixed inset-0 z-50 flex flex-col/);
});

test("valutazioni mobile mantengono route canonica e affordance draft/completed", () => {
  assert.match(clinicalPathway, /href=\{`\/pazienti\/\$\{patientId\}\/percorso\/\$\{assessment\.id\}`\}/);
  assert.match(clinicalPathway, /draft \? "bozza, continua" : "completata, apri"/);
  assert.match(clinicalPathway, /assessmentAreaLabel\(assessment\)/);
  assert.match(clinicalPathway, /setNewAssessmentOpen\(true\)/);
});

test("Percorso desktop resta il ramo preesistente e non duplica il componente stateful", () => {
  assert.equal((page.match(/<PatientClinicalPathway/g) || []).length, 1);
  assert.match(clinicalPathway, /return <div className="space-y-5">/);
  assert.match(clinicalPathway, /<PathwayWorkspace overview=\{overview\}/);
});

test("Risorse mobile usa una sola state machine URL senza duplicare il dominio", () => {
  assert.match(patientResources, /type MobilePatientResourceSection = "resources-overview" \| "worksheets" \| "home-assignments" \| "materials" \| "recent-materials" \| "worksheet-detail" \| "home-assignment-detail" \| "material-detail" \| "recent-material-detail"/);
  assert.match(page, /url\.searchParams\.set\("tab", "resources"\)/);
  assert.match(page, /url\.searchParams\.set\("section", section\)/);
  assert.match(page, /window\.history\[replace \? "replaceState" : "pushState"\]/);
  assert.match(page, /mobileDrillDown \? "hidden" : "flex"/);
  assert.equal((page.match(/<PatientResourcesSection/g) || []).length, 1);
});

test("overview Risorse espone soltanto le quattro categorie reali", () => {
  for (const label of ["Schede ed esercizi", "Compiti a casa", "Materiali associati", "Usati nelle sedute"]) assert.match(patientResources, new RegExp(label));
  assert.match(patientResources, /homeWorksheets = worksheets\.filter/);
  assert.match(patientResources, /getPatientMaterials/);
  assert.match(patientResources, /getRecentPatientMaterials/);
  assert.doesNotMatch(patientResources, /Completato|completionStatus|homeworkProgress/);
});

test("liste e dettagli mobile conservano azioni canoniche e affordance accessibili", () => {
  assert.match(patientResources, /MobileWorksheetList/);
  assert.match(patientResources, /mobileSection === "home-assignments" \? "home-assignment-detail" : "worksheet-detail"/);
  assert.match(patientResources, /MobileMaterialList/);
  assert.match(patientResources, /MobileWorksheetDetail/);
  assert.match(patientResources, /openMaterial\(selectedMaterial/);
  assert.match(patientResources, /setPatientWorksheetHomeAssignment/);
  assert.match(patientResources, /duplicatePatientWorksheet/);
  assert.match(patientResources, /deletePatientWorksheet/);
  assert.match(patientResources, /role="dialog"/);
  assert.match(patientResources, /min-h-16/);
});

test("desktop Risorse conserva card, griglia e controlli preesistenti", () => {
  assert.match(patientResources, /if \(presentation === "mobile"\)/);
  assert.match(patientResources, /return <div className="mt-4 space-y-4 sm:mt-5">/);
  assert.match(patientResources, /grid gap-3 lg:grid-cols-2/);
  assert.match(patientResources, /Apri Libreria/);
});
