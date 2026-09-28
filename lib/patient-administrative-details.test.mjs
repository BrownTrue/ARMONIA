import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeAppData, readLocalData, serializeLocalData } from "./data/local-store.ts";
import {
  currentDocumentRecipient,
  detailsByPatientId,
  normalizePatientAdministrativeDetails,
  removePatientAdministrativeDetails,
  upsertPatientAdministrativeDetails,
} from "./patient-administrative-details.ts";
import { patientAdministrativeDetailsFromRow, patientAdministrativeDetailsRow } from "./supabase/repository.ts";

const stamp = "2026-09-28T12:00:00.000Z";
const patient = { id:"patient-1", firstName:"Mario", lastName:"Rossi", birthDate:"", contact:"contatto ambiguo", guardian:"Genitore ambiguo", school:"", schoolClass:"", referralReason:"", notes:"", status:"active", createdAt:stamp };
const details = (overrides = {}) => ({ patientId:"patient-1", billingSubjectType:"patient", createdAt:stamp, updatedAt:stamp, ...overrides });

test("archivio locale legacy riceve una collezione vuota senza wipe", () => {
  const legacy = { patients:[patient], appointments:[], locations:[], services:[], sessions:[], payments:[], paymentAllocations:[], goals:[], materials:[], clinicalPathways:[], clinicalAssessments:[], profile:{} };
  const result = readLocalData(JSON.stringify({ schemaVersion:1, savedAt:stamp, data:legacy }), () => normalizeAppData({}));
  assert.equal(result.writable, true);
  assert.equal(result.migrated, true);
  assert.deepEqual(result.data.patients, [patient]);
  assert.deepEqual(result.data.patientAdministrativeDetails, []);
});

test("round-trip locale conserva dettagli parziali", () => {
  const source = normalizeAppData({ patients:[patient], patientAdministrativeDetails:[details({ patientCity:"Roma" })] });
  const parsed = readLocalData(serializeLocalData(source, stamp), () => normalizeAppData({}));
  assert.deepEqual(parsed.data.patientAdministrativeDetails, source.patientAdministrativeDetails);
});

test("mapper Supabase normalizza trim, stringhe vuote e codici fiscali", () => {
  const row = patientAdministrativeDetailsRow(details({ patientTaxCode:" abc123 ", patientAddress:"  ", recipientTaxCode:" xyz789 ", administrativeEmail:" a@example.test " }), "user-1");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.patient_tax_code, "ABC123");
  assert.equal(row.patient_address, null);
  assert.equal(row.recipient_tax_code, "XYZ789");
  assert.equal(row.administrative_email, "a@example.test");
  const mapped = patientAdministrativeDetailsFromRow({ ...row, created_at:stamp, updated_at:row.updated_at });
  assert.equal(mapped.patientId, "patient-1");
  assert.equal(mapped.billingSubjectType, "patient");
  assert.equal(mapped.patientTaxCode, "ABC123");
  assert.equal(mapped.patientAddress, undefined);
  assert.equal(mapped.recipientTaxCode, "XYZ789");
  assert.equal(mapped.administrativeEmail, "a@example.test");
});

test("ogni upsert genera updated_at nuovo e non invia created_at storico", async () => {
  const source = details({ createdAt:"2020-01-01T00:00:00.000Z", updatedAt:"2020-01-01T00:00:00.000Z" });
  const first = patientAdministrativeDetailsRow(source, "user-1");
  await new Promise((resolve) => setTimeout(resolve, 2));
  const second = patientAdministrativeDetailsRow(source, "user-1");
  assert.notEqual(first.updated_at, source.updatedAt);
  assert.notEqual(second.updated_at, first.updated_at);
  assert.equal("created_at" in first, false);
  assert.equal("created_at" in second, false);
});

test("tutti i campi eccetto identità tipo e timestamp sono facoltativi", () => {
  const normalized = normalizePatientAdministrativeDetails(details());
  assert.equal(normalized.patientId, "patient-1");
  assert.equal(normalized.billingSubjectType, "patient");
  assert.equal(normalized.patientTaxCode, undefined);
  assert.equal(normalized.recipientFirstName, undefined);
});

test("recipient other parziale è consentito", () => {
  const partial = normalizePatientAdministrativeDetails(details({ billingSubjectType:"other", recipientFirstName:" Maria " }));
  assert.equal(partial.recipientFirstName, "Maria");
  assert.equal(partial.recipientLastName, undefined);
});

test("upsert consente patient → other e other → patient senza copiare dati ambigui", () => {
  const other = upsertPatientAdministrativeDetails([details()], details({ billingSubjectType:"other", recipientFirstName:"Maria" }));
  assert.equal(other[0].billingSubjectType, "other");
  assert.equal(other[0].recipientFirstName, "Maria");
  const self = upsertPatientAdministrativeDetails(other, details({ billingSubjectType:"patient" }));
  assert.equal(self[0].billingSubjectType, "patient");
  assert.equal(self[0].recipientFirstName, undefined);
  assert.equal(self[0].recipientRelationship, undefined);
});

test("lettura e delete locali sono indicizzati logicamente per patientId", () => {
  const source = [details(), details({ patientId:"patient-2" })];
  assert.equal(detailsByPatientId(source, "patient-2")?.patientId, "patient-2");
  assert.equal(detailsByPatientId(source, "missing"), undefined);
  assert.deepEqual(removePatientAdministrativeDetails(source, "patient-1").map(item=>item.patientId), ["patient-2"]);
});

test("contratto E3 usa Patient per il soggetto patient senza guardian o contact", () => {
  const recipient = currentDocumentRecipient(patient, details({ patientTaxCode:"ABC", patientCity:"Roma", administrativeEmail:"admin@example.test" }));
  assert.equal(recipient.firstName, "Mario");
  assert.equal(recipient.lastName, "Rossi");
  assert.equal(recipient.taxCode, "ABC");
  assert.equal(recipient.city, "Roma");
  assert.doesNotMatch(JSON.stringify(recipient), /Genitore ambiguo|contatto ambiguo/);
});

test("contratto E3 usa soltanto i campi recipient per il soggetto other", () => {
  const recipient = currentDocumentRecipient(patient, details({ billingSubjectType:"other", patientTaxCode:"PATIENT", recipientFirstName:"Maria", recipientLastName:"Bianchi", recipientTaxCode:"OTHER", recipientRelationship:"madre" }));
  assert.deepEqual(recipient, { firstName:"Maria", lastName:"Bianchi", taxCode:"OTHER", relationship:"madre", address:undefined, postalCode:undefined, city:undefined, province:undefined, country:undefined, administrativeEmail:undefined });
});

test("migration 021 è additiva, owner-safe e non altera patients", () => {
  const sql = readFileSync(new URL("../supabase/migrations/021_patient_administrative_details.sql", import.meta.url), "utf8");
  assert.match(sql, /primary key \(user_id, patient_id\)/i);
  assert.match(sql, /foreign key \(user_id, patient_id\)[\s\S]*references public\.patients \(user_id, id\)[\s\S]*on delete cascade/i);
  assert.match(sql, /billing_subject_type in \('patient', 'other'\)/i);
  assert.doesNotMatch(sql, /alter table public\.patients[\s\S]*(add|drop|alter) column/i);
  assert.doesNotMatch(sql, /insert into public\.patient_administrative_details|update public\.patients|delete from public\.patients/i);
});

test("migration 021 applica RLS e privilegi browser minimi", () => {
  const sql = readFileSync(new URL("../supabase/migrations/021_patient_administrative_details.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.equal((sql.match(/user_id = auth\.uid\(\)/g)||[]).length, 5);
  assert.match(sql, /revoke all privileges[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete[\s\S]*to authenticated/i);
  assert.doesNotMatch(sql, /grant[\s\S]*(truncate|references|trigger)[\s\S]*to authenticated/i);
});

test("check 021 preflight e postflight sono read-only", () => {
  for (const name of ["preflight", "postflight"]) {
    const sql = readFileSync(new URL(`../supabase/checks/021_patient_administrative_details_${name}.sql`, import.meta.url), "utf8");
    assert.doesNotMatch(sql, /\b(insert|update|delete|alter|create|drop|truncate|grant|revoke)\b\s+(into|table|from|on)/i);
  }
});

test("preflight blocca collisione indice PK e usa fingerprint Patient completo", () => {
  const sql = readFileSync(new URL("../supabase/checks/021_patient_administrative_details_preflight.sql", import.meta.url), "utf8");
  assert.match(sql, /to_regclass\('public\.patient_administrative_details_pkey'\) is null as pkey_index_name_collision_absent/i);
  assert.match(sql, /'ready'[\s\S]*p\.pkey_index_name_collision_absent/i);
  for (const field of ["first_name", "last_name", "birth_date", "phone", "guardian_name", "school_class", "referral_reason", "notes", "status", "created_at", "updated_at"]) assert.match(sql, new RegExp(`\\b${field}\\b`));
});

test("preflight e postflight usano lo stesso fingerprint Patient", () => {
  const preflight = readFileSync(new URL("../supabase/checks/021_patient_administrative_details_preflight.sql", import.meta.url), "utf8");
  const postflight = readFileSync(new URL("../supabase/checks/021_patient_administrative_details_postflight.sql", import.meta.url), "utf8");
  const expression = /md5\(coalesce\(string_agg\(jsonb_build_array\([\s\S]*?\)::text, ',' order by id\), ''\)\)/i;
  assert.equal(preflight.match(expression)?.[0], postflight.match(expression)?.[0]);
});

test("postflight verifica la FK owner-safe tramite cataloghi e ordine colonne", () => {
  const sql = readFileSync(new URL("../supabase/checks/021_patient_administrative_details_postflight.sql", import.meta.url), "utf8");
  assert.match(sql, /c\.contype = 'f'/i);
  assert.match(sql, /c\.conrelid = 'public\.patient_administrative_details'::regclass/i);
  assert.match(sql, /c\.confrelid = 'public\.patients'::regclass/i);
  assert.match(sql, /c\.conkey = array\[[\s\S]*attname = 'user_id'[\s\S]*attname = 'patient_id'/i);
  assert.match(sql, /c\.confkey = array\[[\s\S]*attname = 'user_id'[\s\S]*attname = 'id'/i);
  assert.match(sql, /c\.confdeltype = 'c'/i);
  assert.match(sql, /c\.convalidated/i);
});

test("Patient resta privo di campi amministrativi", () => {
  const source = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
  const patientType = source.match(/export type Patient = \{[^}]+\}/)?.[0] || "";
  assert.doesNotMatch(patientType, /TaxCode|Address|PostalCode|billing|recipient|administrative/i);
});
