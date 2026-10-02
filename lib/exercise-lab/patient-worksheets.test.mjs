import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getImageNamingCandidates } from "./manual-selection.ts";
import { createExerciseDraft } from "./exercise-draft.ts";
import { addWorksheetBlock, createWorksheetDraft, editWorksheetDraft } from "./worksheet-draft.ts";
import {
  duplicatePatientWorksheet,
  parsePatientWorksheetV1,
  patientWorksheetFromDraft,
  removePatientWorksheet,
  savePatientWorksheet,
  worksheetDraftFromPatientWorksheet,
} from "./patient-worksheets.ts";
import { normalizeAppData } from "../data/local-store.ts";
import { patientWorksheetFromRow, patientWorksheetRow } from "../supabase/repository.ts";

const stamp = "2026-10-02T12:00:00.000Z";
const patient = { id: "11111111-1111-4111-8111-111111111111", firstName: "Ada", lastName: "Rossi", birthDate: "", contact: "", guardian: "", school: "", schoolClass: "", referralReason: "", notes: "", status: "active", createdAt: stamp };

function worksheetDraft() {
  const items = getImageNamingCandidates({ includeDrafts: false }).slice(0, 2);
  const preview = { brickCode: "image_naming", title: "Denominazione", items, requestedItemCount: 2, availableItemCount: 2, warnings: [] };
  return addWorksheetBlock(editWorksheetDraft(createWorksheetDraft(), { title: "Scheda /s/", instructions: "Nomina le figure." }), createExerciseDraft(preview), { kind: "image_naming", mode: "manual", selectedContentIds: items.map((item) => item.wordId) });
}

function patientWorksheet(overrides = {}) {
  return patientWorksheetFromDraft({ id: "22222222-2222-4222-8222-222222222222", patientId: patient.id, worksheet: worksheetDraft(), createdAt: stamp, updatedAt: stamp, ...overrides });
}

test("snapshot concreto conserva esattamente titolo, istruzioni, ordine e item risolti", () => {
  const value = patientWorksheet();
  const parsed = parsePatientWorksheetV1(structuredClone(value));
  assert.deepEqual(parsed, value);
  assert.deepEqual(parsed.worksheetSnapshot.blocks[0].exercise.items.map((item) => item.wordId), value.worksheetSnapshot.blocks[0].exercise.items.map((item) => item.wordId));
});

test("parser rifiuta versione futura, payload corrotto e scheda senza attività", () => {
  const value = patientWorksheet();
  assert.throws(() => parsePatientWorksheetV1({ ...value, schemaVersion: 2 }), /patient_worksheet_invalid/);
  assert.throws(() => parsePatientWorksheetV1({ ...value, worksheetSnapshot: { ...value.worksheetSnapshot, blocks: [] } }), /patient_worksheet_snapshot_invalid/);
  assert.throws(() => parsePatientWorksheetV1({ ...value, worksheetSnapshot: { ...value.worksheetSnapshot, blocks: [{}] } }), /patient_worksheet_snapshot_invalid/);
});

test("creazione richiede un paziente esistente e modifica conserva lo stesso ID", () => {
  const value = patientWorksheet();
  assert.throws(() => savePatientWorksheet([], [], value), /patient_worksheet_patient_not_found/);
  const created = savePatientWorksheet([], [patient], value);
  const updated = savePatientWorksheet(created, [patient], { ...value, title: "Titolo aggiornato", updatedAt: "2026-10-03T12:00:00.000Z" });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, value.id);
  assert.equal(updated[0].title, "Titolo aggiornato");
});

test("duplicazione crea ID e timestamp nuovi con snapshot indipendente", () => {
  const source = patientWorksheet();
  const copy = duplicatePatientWorksheet(source, "33333333-3333-4333-8333-333333333333", "2026-10-04T12:00:00.000Z");
  copy.worksheetSnapshot.blocks[0].exercise.title = "Cambiata";
  assert.equal(copy.title, "Copia di Scheda /s/");
  assert.notEqual(copy.id, source.id);
  assert.equal(copy.createdAt, copy.updatedAt);
  assert.notEqual(source.worksheetSnapshot.blocks[0].exercise.title, "Cambiata");
});

test("snapshot riaperto resta indipendente da sorgenti e può essere eliminato isolatamente", () => {
  const sourceDraft = worksheetDraft();
  const saved = patientWorksheetFromDraft({ id: "a", patientId: patient.id, worksheet: sourceDraft, createdAt: stamp, updatedAt: stamp });
  sourceDraft.blocks[0].exercise.items.splice(0, 1);
  sourceDraft.blocks[0].configuration.selectedContentIds.splice(0, 1);
  const reopened = worksheetDraftFromPatientWorksheet(saved);
  reopened.blocks[0].exercise.items.splice(0, 1);
  assert.equal(saved.worksheetSnapshot.blocks[0].exercise.items.length, 2);
  assert.equal(saved.worksheetSnapshot.blocks[0].configuration.selectedContentIds.length, 2);
  assert.deepEqual(removePatientWorksheet([saved, { ...saved, id: "b" }], "a").map((item) => item.id), ["b"]);
});

test("modalità locale conserva payload validi e scarta quelli corrotti", () => {
  const valid = patientWorksheet();
  const normalized = normalizeAppData({ patientWorksheets: [valid, { ...valid, id: "bad", worksheetSnapshot: {} }] });
  assert.deepEqual(normalized.patientWorksheets, [valid]);
});

test("mapper DB/domain conserva snapshot e timestamp", () => {
  const value = patientWorksheet();
  const row = patientWorksheetRow(value, "user-1");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.patient_id, patient.id);
  assert.equal(row.updated_at, stamp);
  assert.deepEqual(patientWorksheetFromRow(row), value);
});

test("migration 028 è additiva, owner-safe, forward-compatible e owner-only", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/028_patient_worksheets.sql", import.meta.url), "utf8").toLowerCase();
  assert.match(sql, /\bbegin\s*;/);
  assert.match(sql, /\bcommit\s*;/);
  assert.match(sql, /create table public\.patient_worksheets/);
  assert.match(sql, /foreign key \(user_id, patient_id\)[\s\S]*references public\.patients \(user_id, id\) on delete cascade/);
  assert.match(sql, /schema_version >= 1/);
  assert.match(sql, /jsonb_typeof\(worksheet_snapshot\) = 'object'/);
  assert.doesNotMatch(sql, /check\s*\([^)]*kind\s+in/i);
  assert.equal((sql.match(/user_id = auth\.uid\(\)/g) || []).length, 5);
  assert.match(sql, /revoke all privileges .* from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update, delete .* to authenticated/);
  assert.doesNotMatch(sql, /create trigger/);
});

test("repository filtra sempre per owner e lista per paziente", () => {
  const source = readFileSync(new URL("../supabase/repository.ts", import.meta.url), "utf8");
  assert.match(source, /from\("patient_worksheets"\)\.select\("\*"\)\.eq\("user_id",userId\)\.eq\("patient_id",patientId\)/);
  assert.match(source, /from\("patient_worksheets"\)\.select\("\*"\)\.eq\("user_id",userId\)\.eq\("id",id\)\.maybeSingle\(\)/);
  assert.match(source, /from\("patient_worksheets"\)\.insert\(patientWorksheetRow\(validated,userId\)\)/);
  assert.match(source, /update\(\{title:row\.title,worksheet_snapshot:row\.worksheet_snapshot,updated_at:row\.updated_at\}\)\.eq\("user_id",userId\)\.eq\("id",worksheet\.id\)/);
  assert.match(source, /from\("patient_worksheets"\)\.delete\(\)\.eq\("user_id",userId\)\.eq\("id",id\)/);
});

test("UI collega Risorse al Laboratorio e riusa preview e stampa esistenti", () => {
  const resources = readFileSync(new URL("../../components/patient-resources-section.tsx", import.meta.url), "utf8");
  const builder = readFileSync(new URL("../../components/exercise-lab-builder.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../app/risorse/laboratorio/crea/page.tsx", import.meta.url), "utf8");
  for (const label of ["Schede ed esercizi", "Crea scheda nel Laboratorio", "Apri", "Stampa", "Duplica", "Elimina"]) assert.match(resources, new RegExp(label));
  assert.match(builder, /Salva per il paziente/);
  assert.match(builder, /WorksheetPrintView/);
  assert.match(page, /item\.id === worksheetId && item\.patientId === patientId/);
  assert.match(page, /Stai preparando una scheda per/);
});
