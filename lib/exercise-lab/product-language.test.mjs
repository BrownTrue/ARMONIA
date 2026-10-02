import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("home Risorse presenta il Laboratorio come area operativa", () => {
  const source = read("../../app/risorse/page.tsx");
  assert.match(source, /title: "Laboratorio esercizi ARMONIA"[\s\S]*description: "Crea schede terapeutiche, combina attività e prepara materiali da usare in seduta o da stampare\."[\s\S]*upcoming: false/);
  assert.doesNotMatch(source, /Mattoncini → Ricette → Esercizi → Compiti/);
});

test("home Laboratorio espone quattro entry point reali senza linguaggio obsoleto", () => {
  const source = read("../../app/risorse/laboratorio/page.tsx");
  for (const label of ["Crea nuova scheda", "Modelli di scheda", "Attività salvate", "Banca contenuti"]) assert.match(source, new RegExp(label));
  assert.match(source, /\/risorse\/laboratorio\/crea\?mode=templates/);
  assert.match(source, /\/risorse\/laboratorio\/crea\?mode=saved/);
  assert.match(source, /\/risorse\/laboratorio\/contenuti/);
  assert.doesNotMatch(source, /Mattoncin|pilota|preview senza salvataggio|In preparazione|futuro spazio|Compiti a casa|Banca Asset|Fondazioni editoriali/);
});

test("composer usa il vocabolario Attività salvate senza rinominare il dominio interno", () => {
  const builder = read("../../components/exercise-lab-builder.tsx");
  const page = read("../../app/risorse/laboratorio/crea/page.tsx");
  for (const label of ["Attività salvate", "Usa attività", "Salva attività", "Modelli di scheda"]) assert.match(builder, new RegExp(label));
  assert.doesNotMatch(builder, /Le mie ricette|Usa ricetta|Salva come ricetta|Salva ricetta/);
  assert.match(page, /initialSection=\{initialSection\}/);
  assert.match(builder, /initialSection === "templates" \? "templates" : initialSection === "saved" \? "choose"/);
  assert.match(builder, /ExerciseRecipeV1/);
});

test("Salva come modello non è prominente nella scheda vuota", () => {
  const source = read("../../components/worksheet-draft-editor.tsx");
  assert.match(source, /worksheet\.blocks\.length > 0 && <button[\s\S]*?Salva come modello<\/button>/);
});

test("composer distingue anteprima, salvataggio paziente e modello", () => {
  const builder = read("../../components/exercise-lab-builder.tsx");
  const editor = read("../../components/worksheet-draft-editor.tsx");
  assert.match(editor, />Anteprima scheda<\/button>/);
  assert.match(editor, /bg-violet-50[\s\S]*Salva come modello/);
  for (const label of ["Salva per un paziente", "Salva modifiche"]) assert.match(builder, new RegExp(label));
  assert.ok(builder.includes("`Salva per ${fullName(patient)}`"));
  assert.match(builder, /!!worksheet\.blocks\.length && <section/);
});

test("salvataggio generale sceglie soltanto pazienti del DataProvider e non mostra UUID", () => {
  const source = read("../../components/exercise-lab-builder.tsx");
  assert.match(source, /<PatientWorksheetDialog patients=\{data\.patients\}/);
  assert.match(source, /data\.patients\.find\(\(item\) => item\.id === selectedPatientId\)/);
  assert.match(source, /patients\.map\(\(item\) => <option key=\{item\.id\} value=\{item\.id\}>\{fullName\(item\)\}<\/option>\)/);
  assert.match(source, /Non hai ancora pazienti disponibili\./);
  assert.doesNotMatch(source, />\{item\.id\}<\/option>/);
});

test("salvataggio PatientWorksheet crea dal generale e aggiorna lo stesso ID in modifica", () => {
  const source = read("../../components/exercise-lab-builder.tsx");
  assert.match(source, /id: patientWorksheet\?\.id \|\| uid\(\)/);
  assert.match(source, /patientId: targetPatient\.id/);
  assert.match(source, /await savePatientWorksheet\(patientWorksheetFromDraft/);
  assert.match(source, /Salvata nelle Risorse di \{fullName\(savedForPatient\)\}/);
  assert.match(source, /Vai alle Risorse del paziente/);
  assert.match(source, /Continua a modificare/);
});
