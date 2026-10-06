import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { filterPatients, patientDirectoryMeta } from "./patient-directory.ts";

const patient = (id, firstName, lastName, overrides = {}) => ({ id, firstName, lastName, birthDate: "", contact: "", guardian: "", school: "", schoolClass: "", referralReason: "", notes: "", status: "active", createdAt: "2026-01-01T00:00:00.000Z", ...overrides });

test("ricerca pazienti riusa nome completo, ignora maiuscole e preserva ordine", () => {
  const patients = [patient("1", "Mario", "Rossi"), patient("2", "Giulia", "Bianchi"), patient("3", "Maria", "Verdi")];
  assert.deepEqual(filterPatients(patients, "mAr").map((item) => item.id), ["1", "3"]);
  assert.deepEqual(filterPatients(patients, "").map((item) => item.id), ["1", "2", "3"]);
  assert.deepEqual(filterPatients(patients, "nessuno"), []);
});

test("metadata directory usa soltanto età e stato già presenti", () => {
  assert.equal(patientDirectoryMeta(patient("1", "Mario", "Rossi")), "Età non indicata · Attivo");
  assert.match(patientDirectoryMeta(patient("2", "Giulia", "Bianchi", { birthDate: "2000-01-01", status: "suspended" })), /^\d+ anni · Sospeso$/);
});

test("pagina mobile usa lista tappabile, stati vuoti distinti e flusso canonico", () => {
  const page = readFileSync(new URL("../app/pazienti/page.tsx", import.meta.url), "utf8");
  const mobile = readFileSync(new URL("../components/patients/mobile-patient-directory.tsx", import.meta.url), "utf8");
  assert.match(page, /const list = filterPatients\(data\.patients, query\)/);
  assert.match(page, /MobilePatientDirectory[\s\S]*hidden md:block/);
  assert.match(page, /<PatientForm onDone=/);
  assert.match(mobile, /type="search"[\s\S]*placeholder="Cerca paziente"/);
  assert.match(mobile, /onClick=\{onCreate\}[\s\S]*\+ Nuovo/);
  assert.match(mobile, /href=\{\`\/pazienti\/\$\{patient\.id\}\`\}/);
  assert.match(mobile, /aria-label=\{\`Apri \$\{fullName\(patient\)\}\`\}/);
  assert.match(mobile, /active:bg-\[#e4ebe0\]/);
  assert.match(mobile, /Nessun paziente ancora\./);
  assert.match(mobile, /Nessun paziente trovato\./);
  assert.doesNotMatch(mobile, /grid-cols|shadow/);
});
