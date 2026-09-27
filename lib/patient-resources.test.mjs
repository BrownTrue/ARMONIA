import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getFuturePatientAppointments, getPatientMaterials, getRecentPatientMaterials } from "./patient-resources.ts";

const patientId = "patient-a";
const stamp = "2026-09-27T08:00:00.000Z";
const material = (id, patientIds = []) => ({ id, title: `Materiale ${id}`, description: "", category: "altro", tags: [], fileName: `${id}.pdf`, mimeType: "application/pdf", size: 10, favorite: false, patientIds, createdAt: stamp });
const session = (id, date, materialIds, overrides = {}) => ({ id, patientId, date, duration: 45, goalIds: [], activities: "", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds, createdAt: `${date}T08:00:00.000Z`, ...overrides });
const appointment = (id, date, time = "10:00", overrides = {}) => ({ id, patientId, date, time, duration: 45, type: "regular", notes: "", createdAt: stamp, ...overrides });

test("seleziona soltanto i materiali associati al paziente", () => {
  assert.deepEqual(getPatientMaterials([material("a", [patientId]), material("b", ["patient-b"])], patientId).map((item) => item.id), ["a"]);
});

test("restituisce una lista vuota senza materiali associati", () => {
  assert.deepEqual(getPatientMaterials([material("a", [])], patientId), []);
});

test("ordina i materiali recenti per ultimo utilizzo", () => {
  const result = getRecentPatientMaterials([session("old", "2026-09-01", ["a"]), session("new", "2026-09-20", ["b"])], [material("a"), material("b")], patientId);
  assert.deepEqual(result.map((item) => item.materialId), ["b", "a"]);
});

test("deduplica i materiali recenti anche nella stessa seduta", () => {
  const result = getRecentPatientMaterials([session("one", "2026-09-20", ["a", "a"])], [material("a")], patientId);
  assert.equal(result.length, 1);
});

test("lo stesso materiale usato più volte conserva la data più recente", () => {
  const result = getRecentPatientMaterials([session("old", "2026-09-01", ["a"]), session("new", "2026-09-20", ["a"])], [material("a")], patientId);
  assert.deepEqual(result.map(({ materialId, lastUsedOn }) => ({ materialId, lastUsedOn })), [{ materialId: "a", lastUsedOn: "2026-09-20" }]);
});

test("mantiene rappresentabile un materiale storico eliminato", () => {
  const result = getRecentPatientMaterials([session("one", "2026-09-20", ["missing"])], [], patientId);
  assert.deepEqual(result, [{ materialId: "missing", material: undefined, lastUsedOn: "2026-09-20" }]);
});

test("limita a cinque i materiali recenti unici", () => {
  const ids = ["a", "b", "c", "d", "e", "f"];
  const result = getRecentPatientMaterials([session("one", "2026-09-20", ids)], ids.map((id) => material(id)), patientId);
  assert.deepEqual(result.map((item) => item.materialId), ids.slice(0, 5));
});

test("ordina gli appuntamenti futuri per data e ora", () => {
  const result = getFuturePatientAppointments([appointment("later", "2026-10-02"), appointment("first", "2026-10-01", "09:00")], patientId, new Date("2026-09-30T12:00:00"));
  assert.deepEqual(result.map((item) => item.id), ["first", "later"]);
});

test("esclude gli appuntamenti passati", () => {
  assert.deepEqual(getFuturePatientAppointments([appointment("past", "2026-09-20")], patientId, new Date("2026-09-30T12:00:00")), []);
});

test("esclude gli appuntamenti annullati", () => {
  assert.deepEqual(getFuturePatientAppointments([appointment("cancelled", "2026-10-01", "10:00", { type: "cancelled" })], patientId, new Date("2026-09-30T12:00:00")), []);
});

test("supporta un appuntamento legacy senza campi Calendario V2", () => {
  const legacy = appointment("legacy", "2026-10-01");
  assert.equal(getFuturePatientAppointments([legacy], patientId, new Date("2026-09-30T12:00:00"))[0], legacy);
});

test("la UI può applicare il limite iniziale di cinque appuntamenti", () => {
  const appointments = Array.from({ length: 6 }, (_, index) => appointment(String(index), `2026-10-0${index + 1}`));
  assert.equal(getFuturePatientAppointments(appointments, patientId, new Date("2026-09-30T12:00:00")).slice(0, 5).length, 5);
});

test("le proiezioni non mutano gli input", () => {
  const materials = [material("a", [patientId])];
  const sessions = [session("one", "2026-09-20", ["a"])];
  const appointments = [appointment("future", "2026-10-01")];
  const before = structuredClone({ materials, sessions, appointments });
  getPatientMaterials(materials, patientId);
  getRecentPatientMaterials(sessions, materials, patientId);
  getFuturePatientAppointments(appointments, patientId, new Date("2026-09-30T12:00:00"));
  assert.deepEqual({ materials, sessions, appointments }, before);
});

test("Risorse apre file Storage e link esterni con l'opzione nuova scheda", () => {
  const source = readFileSync(new URL("../app/pazienti/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /openMaterial\(material,\{newTab:true\}\)/);
  assert.match(source, /openMaterial\(entry\.material!,\{newTab:true\}\)/);
});

test("l'helper condiviso preserva la scheda corrente quando newTab è richiesto", () => {
  const source = readFileSync(new URL("../components/data-provider.tsx", import.meta.url), "utf8");
  assert.match(source, /options\?\.newTab\?window\.open\("about:blank","_blank"\):null/);
  assert.match(source, /if\(target\)target\.opener=null/);
  assert.match(source, /if\(options\?\.newTab\).*window\.open\(url,"_blank","noopener,noreferrer"\).*else window\.location\.href=url/);
});

test("un materiale recente non disponibile non espone alcuna azione di apertura", () => {
  const source = readFileSync(new URL("../app/pazienti/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /onOpen=\{entry\.material \? \(\) => void openMaterial\(entry\.material!,\{newTab:true\}\) : undefined\}/);
  assert.match(source, /\{onOpen && <button/);
});
