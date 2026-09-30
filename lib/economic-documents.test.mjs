import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeAppData, readLocalData, serializeLocalData } from "./data/local-store.ts";
import {
  addEconomicDocumentLine,
  assertPatientEconomicDocumentDeleteAllowed,
  assertSessionEconomicDocumentDeleteAllowed,
  createEconomicDocumentDraft,
  createManualEconomicDocumentLine,
  currentEconomicDocumentRecipient,
  currentProfessionalDocumentSnapshot,
  deleteLocalEconomicDocumentDraft,
  deleteLocalEconomicDocumentLine,
  documentTotals,
  economicDocumentLineFromSession,
  economicDocumentWithLines,
  isEconomicDocumentInvariantValid,
  professionalDocumentMissingFields,
  recipientDocumentMissingFields,
  saveLocalEconomicDocumentDraft,
  saveLocalEconomicDocumentLine,
  sessionIsInActiveIssuedEconomicDocument,
} from "./economic-documents.ts";
import { economicDocumentFromRow, economicDocumentLineFromRow, economicDocumentRow, professionalDocumentDetailsFromRow, professionalDocumentDetailsRow, saveEconomicDocumentDraft } from "./supabase/repository.ts";

const stamp = "2026-09-30T10:00:00.000Z";
const patient = { id:"patient-1", firstName:"Mario", lastName:"Rossi", birthDate:"2018-01-01", contact:"", guardian:"", school:"", schoolClass:"", referralReason:"", notes:"", status:"active", createdAt:stamp };
const profile = { firstName:" Anna ", lastName:" Bianchi ", profession:" Logopedista ", email:" anna@example.test ", studio:" Studio Armonia " };
const professionalDetails = { userId:"user-1", taxCode:" abc123 ", vatNumber:" it123 ", address:" Via Roma 1 ", postalCode:" 00100 ", city:" Roma ", province:" RM ", country:" Italia ", createdAt:stamp, updatedAt:stamp };
const recipientDetails = { patientId:patient.id, billingSubjectType:"other", recipientFirstName:" Maria ", recipientLastName:" Verdi ", recipientAddress:" Via Milano 2 ", recipientPostalCode:"20100", recipientCity:"Milano", recipientCountry:"Italia", createdAt:stamp, updatedAt:stamp };
const draft = (overrides = {}) => ({ id:"document-1", patientId:patient.id, documentType:"proforma", status:"draft", professionalSnapshot:{}, recipientSnapshot:{}, subtotalCents:0, totalCents:0, currencyCode:"EUR", notes:"", logoIncluded:false, renderTemplateVersion:1, createdAt:stamp, updatedAt:stamp, ...overrides });
const line = (overrides = {}) => ({ id:"line-1", patientId:patient.id, documentId:"document-1", sessionId:"session-1", descriptionSnapshot:"Seduta logopedica", quantity:1, unitAmountCents:4500, lineTotalCents:4500, position:1, createdAt:stamp, updatedAt:stamp, ...overrides });

test("archivio locale legacy aggiunge dettagli professionali e documenti vuoti senza wipe", () => {
  const legacy = { patients:[patient], appointments:[], locations:[], services:[], sessions:[], payments:[], paymentAllocations:[], goals:[], materials:[], clinicalPathways:[], clinicalAssessments:[], profile:{} };
  const parsed = readLocalData(JSON.stringify({ schemaVersion:1, savedAt:stamp, data:legacy }), () => normalizeAppData({}));
  assert.equal(parsed.writable, true);
  assert.equal(parsed.migrated, true);
  assert.deepEqual(parsed.data.economicDocuments, []);
  assert.deepEqual(parsed.data.economicDocumentLines, []);
  assert.equal(parsed.data.professionalDocumentDetails, undefined);
});

test("dettagli professionali sono opzionali, normalizzati e round-trip fra app e Supabase", () => {
  const row = professionalDocumentDetailsRow(professionalDetails, "user-1");
  assert.equal(row.tax_code, "ABC123");
  assert.equal(row.vat_number, "IT123");
  assert.equal(row.address, "Via Roma 1");
  const mapped = professionalDocumentDetailsFromRow({ ...row, created_at:stamp, updated_at:stamp });
  assert.equal(mapped.taxCode, "ABC123");
  assert.equal(mapped.vatNumber, "IT123");
  assert.equal(mapped.city, "Roma");
  const local = normalizeAppData({ professionalDocumentDetails:mapped });
  assert.deepEqual(readLocalData(serializeLocalData(local, stamp), () => normalizeAppData({})).data.professionalDocumentDetails, mapped);
});

test("snapshot professionista combina Profile e dettagli senza inventare campi", () => {
  const snapshot = currentProfessionalDocumentSnapshot(profile, professionalDetails);
  assert.deepEqual(snapshot, { firstName:"Anna", lastName:"Bianchi", professionalName:"Anna Bianchi", profession:"Logopedista", studio:"Studio Armonia", taxCode:"ABC123", vatNumber:"IT123", address:"Via Roma 1", postalCode:"00100", city:"Roma", province:"RM", country:"Italia", email:"anna@example.test" });
  assert.deepEqual(professionalDocumentMissingFields(snapshot), []);
  assert.deepEqual(professionalDocumentMissingFields(currentProfessionalDocumentSnapshot({ firstName:"", lastName:"", profession:"", email:"", studio:"" })), ["nome professionista", "professione", "codice fiscale o partita IVA", "indirizzo", "CAP", "comune", "paese"]);
});

test("snapshot destinatario riusa A1 senza guardian, contact o dati clinici", () => {
  const snapshot = currentEconomicDocumentRecipient(patient, recipientDetails);
  assert.equal(snapshot.billingSubjectType, "other");
  assert.equal(snapshot.firstName, "Maria");
  assert.equal(snapshot.lastName, "Verdi");
  assert.deepEqual(recipientDocumentMissingFields(snapshot), []);
  assert.doesNotMatch(JSON.stringify(snapshot), /guardian|contact|notes/i);
});

test("draft conserva snapshot incompleti, numero nullo e invarianti di status", () => {
  assert.equal(isEconomicDocumentInvariantValid(draft()), true);
  assert.equal(isEconomicDocumentInvariantValid(draft({ sequenceNumber:1 })), false);
  assert.equal(isEconomicDocumentInvariantValid(draft({ status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp })), true);
  assert.equal(isEconomicDocumentInvariantValid(draft({ status:"voided", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp, voidedAt:stamp })), true);
});

test("mapper documento e riga conserva snapshot, importi in centesimi e null delle bozze", () => {
  const documentRow = economicDocumentRow(draft({ professionalSnapshot:{ professionalName:"Anna" }, recipientSnapshot:{ firstName:"Mario" } }), "user-1");
  assert.equal(documentRow.sequence_number, null);
  assert.equal(documentRow.issue_date, null);
  const mapped = economicDocumentFromRow({ ...documentRow, created_at:stamp, updated_at:stamp });
  assert.deepEqual(mapped.professionalSnapshot, { professionalName:"Anna" });
  const mappedLine = economicDocumentLineFromRow({ id:"line-1", patient_id:patient.id, document_id:"document-1", session_id:"session-1", service_id:null, service_name_snapshot:null, service_date_snapshot:null, description_snapshot:"Seduta logopedica", quantity:1, unit_amount_cents:4500, line_total_cents:4500, position:1, created_at:stamp, updated_at:stamp });
  assert.equal(mappedLine.unitAmountCents, 4500);
  assert.equal(mappedLine.serviceId, undefined);
});

test("totali controllano quantità e importi senza IVA o fallback", () => {
  assert.deepEqual(documentTotals([line(), line({ id:"line-2", quantity:2, unitAmountCents:1000, lineTotalCents:2000, position:2 })]), { subtotalCents:6500, totalCents:6500 });
  assert.throws(() => documentTotals([line({ lineTotalCents:1 })]), /economic_document_line_total_invalid/);
  assert.throws(() => documentTotals([line({ quantity:0, lineTotalCents:0 })]), /economic_document_line_total_invalid/);
});

test("E3B crea una bozza proforma senza numero e senza effetti sui pagamenti", () => {
  const created = createEconomicDocumentDraft({ id:"draft-e3b", patientId:patient.id, professionalSnapshot:{ professionalName:"Anna Bianchi" }, recipientSnapshot:{ firstName:"Mario", lastName:"Rossi", billingSubjectType:"patient" }, logoIncluded:true, createdAt:stamp });
  assert.equal(created.status, "draft");
  assert.equal(created.documentNumber, undefined);
  assert.equal(created.totalCents, 0);
  assert.equal(created.logoIncluded, true);
  assert.doesNotMatch(JSON.stringify(created), /payment|allocation/i);
});

test("E3B copia le Session in snapshot, distingue prezzo mancante e gratuito", () => {
  const baseSession = { id:"session-e3b", patientId:patient.id, date:"2026-09-29", duration:45, goalIds:[], activities:"", response:"", helpLevel:"", result:"", nextPlan:"", homework:"", notes:"", materialIds:[], serviceId:"service-1", serviceNameSnapshot:"Seduta logopedica", createdAt:stamp };
  assert.throws(() => economicDocumentLineFromSession({ id:"line-missing", documentId:"draft-e3b", session:baseSession, position:1, createdAt:stamp }), /economic_document_session_price_required/);
  const free = economicDocumentLineFromSession({ id:"line-free", documentId:"draft-e3b", session:{ ...baseSession, effectivePriceCents:0 }, position:1, createdAt:stamp });
  assert.equal(free.unitAmountCents, 0);
  assert.equal(free.lineTotalCents, 0);
  assert.equal(free.serviceDateSnapshot, "2026-09-29");
  assert.equal(free.descriptionSnapshot, "Seduta logopedica");
});

test("E3B impedisce doppioni Session e calcola righe manuali e totale bozza", () => {
  const first = line({ documentId:"draft-e3b" });
  assert.throws(() => addEconomicDocumentLine([first], line({ id:"line-duplicate", documentId:"draft-e3b" })), /economic_document_session_duplicate/);
  const manual = createManualEconomicDocumentLine({ id:"line-manual", documentId:"draft-e3b", patientId:patient.id, description:"  Relazione  ", quantity:2, unitAmountCents:1500, position:2, createdAt:stamp });
  assert.equal(manual.descriptionSnapshot, "Relazione");
  assert.equal(manual.lineTotalCents, 3000);
  const document = economicDocumentWithLines(createEconomicDocumentDraft({ id:"draft-e3b", patientId:patient.id, professionalSnapshot:{}, recipientSnapshot:{ firstName:"", lastName:"" }, createdAt:stamp }), [{ ...first, documentId:"draft-e3b" }, manual], stamp);
  assert.equal(document.totalCents, 7500);
  assert.throws(() => createManualEconomicDocumentLine({ id:"bad", documentId:"draft-e3b", patientId:patient.id, description:"", quantity:1, unitAmountCents:100, position:3, createdAt:stamp }), /economic_document_manual_line_invalid/);
});

test("UI E3B espone bozze, preview e Documenti senza emissione o PDF", () => {
  const panel = readFileSync(new URL("../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
  const economy = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
  for (const label of ["Nuovo proforma", "Salva bozza", "Salva modifiche", "Elimina bozza", "Destinatario documento", "I tuoi dati nel documento", "Anteprima"]) assert.match(panel, new RegExp(label));
  assert.doesNotMatch(panel, />Continua</);
  assert.match(panel, /className="btn btn-primary" onClick=\{\(\) => void save\(\)\}/);
  assert.match(economy, /EconomicDocumentsPanel/);
  assert.match(economy, /"documents"/);
  assert.match(economy, /\+ Crea proforma/);
  assert.match(economy, /grid grid-cols-3 rounded-xl/);
  assert.doesNotMatch(economy, /service-catalog-title/);
  assert.match(panel, /document && document\.status !== "draft"/);
  assert.match(panel, /document\?\.status === "draft"/);
  assert.doesNotMatch(panel, />\s*(Emetti|Genera PDF|Annulla documento)\s*</i);
});

test("Impostazioni riuniscono Profile e dettagli amministrativi senza duplicare il modello", () => {
  const settings = readFileSync(new URL("../app/impostazioni/page.tsx", import.meta.url), "utf8");
  assert.match(settings, /Dati professionali e documenti/);
  assert.match(settings, /saveProfile\(v\)/);
  assert.match(settings, /saveProfessionalDocumentDetails\(professionalDetails\)/);
  assert.match(settings, /deleteProfessionalDocumentDetails/);
  for (const label of ["Codice fiscale", "Partita IVA", "Indirizzo", "CAP", "Città", "Provincia", "Paese", "Logo dei documenti"]) assert.match(settings, new RegExp(label));
});

test("local mode consente solo draft create/update/delete e non emissione", () => {
  const created = saveLocalEconomicDocumentDraft([], draft());
  const updated = saveLocalEconomicDocumentDraft(created, draft({ notes:"Bozza aggiornata" }));
  assert.equal(updated[0].notes, "Bozza aggiornata");
  assert.throws(() => saveLocalEconomicDocumentDraft(updated, draft({ status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp })), /economic_document_draft_invalid/);
  const removed = deleteLocalEconomicDocumentDraft(updated, [line()], "document-1");
  assert.deepEqual(removed.documents, []);
  assert.deepEqual(removed.lines, []);
});

test("repository e DataProvider non offrono una scrittura cloud issued dal browser", async () => {
  await assert.rejects(() => saveEconomicDocumentDraft(null, "user-1", draft({ status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp })), /economic_document_draft_required/);
  const provider = readFileSync(new URL("../components/data-provider.tsx", import.meta.url), "utf8");
  assert.match(provider, /normalized=\{\.\.\.normalized,userId:user\.id\}/);
  assert.doesNotMatch(provider, /issueEconomicDocument|voidEconomicDocument/);
});

test("linee si modificano solo nella bozza dello stesso paziente e owner logico", () => {
  const documents = [draft()];
  const saved = saveLocalEconomicDocumentLine([], documents, line());
  assert.equal(saved.length, 1);
  const changed = saveLocalEconomicDocumentLine(saved, documents, line({ descriptionSnapshot:"Seduta aggiornata", quantity:2, unitAmountCents:4500, lineTotalCents:9000, sessionId:"session-2", serviceId:"service-2" }));
  assert.equal(changed[0].descriptionSnapshot, "Seduta aggiornata");
  assert.equal(changed[0].sessionId, "session-2");
  assert.throws(() => saveLocalEconomicDocumentLine(saved, [draft(), draft({ id:"document-2" })], line({ documentId:"document-2" })), /economic_document_line_identity_immutable/);
  assert.throws(() => saveLocalEconomicDocumentLine(saved, [draft(), draft({ patientId:"patient-2" })], line({ patientId:"patient-2" })), /economic_document_line_identity_immutable/);
  assert.throws(() => saveLocalEconomicDocumentLine([], documents, line({ patientId:"patient-2" })), /economic_document_line_not_mutable/);
  assert.throws(() => saveLocalEconomicDocumentLine([], [draft({ status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp })], line()), /economic_document_line_not_mutable/);
  assert.throws(() => deleteLocalEconomicDocumentLine([line()], [draft({ status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp })], "line-1"), /economic_document_line_not_mutable/);
});

test("una sessione può stare in più bozze ma una issued attiva la rende non selezionabile", () => {
  const documents = [draft({ id:"draft-1" }), draft({ id:"draft-2" }), draft({ id:"issued-1", status:"issued", sequenceNumber:1, numberYear:2026, documentNumber:"PF-2026-0001", issueDate:"2026-09-30", issuedAt:stamp }), draft({ id:"voided-1", status:"voided", sequenceNumber:2, numberYear:2026, documentNumber:"PF-2026-0002", issueDate:"2026-09-30", issuedAt:stamp, voidedAt:stamp })];
  const twoDraftLines = [line({ documentId:"draft-1" }), line({ id:"line-2", documentId:"draft-2" })];
  assert.equal(sessionIsInActiveIssuedEconomicDocument("session-1", documents, twoDraftLines), false);
  assert.equal(sessionIsInActiveIssuedEconomicDocument("session-1", documents, [...twoDraftLines, line({ id:"line-3", documentId:"issued-1" })]), true);
  assert.equal(sessionIsInActiveIssuedEconomicDocument("session-2", documents, [line({ documentId:"voided-1", sessionId:"session-2" })]), false);
});

test("documenti e linee bloccano delete di Patient o Session anche in locale", () => {
  assert.throws(() => assertPatientEconomicDocumentDeleteAllowed(patient.id, [draft()]), /patient_has_economic_documents/);
  assert.throws(() => assertSessionEconomicDocumentDeleteAllowed("session-1", [line()]), /session_has_economic_document_lines/);
  assert.doesNotThrow(() => assertPatientEconomicDocumentDeleteAllowed("other", [draft()]));
  assert.doesNotThrow(() => assertSessionEconomicDocumentDeleteAllowed("other", [line()]));
});

test("migration 022 ha namespace, FK owner-safe, invarianti e numerazione annuale", () => {
  const sql = readFileSync(new URL("../supabase/migrations/022_economic_documents_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /create table public\.professional_document_details/i);
  assert.match(sql, /create table public\.economic_documents/i);
  assert.match(sql, /create table public\.economic_document_lines/i);
  assert.match(sql, /create table public\.economic_document_sequences/i);
  assert.match(sql, /references public\.patients \(user_id, id\) on delete restrict/i);
  assert.match(sql, /references public\.sessions \(user_id, patient_id, id\) on delete restrict/i);
  assert.match(sql, /references public\.appointment_services \(user_id, id\) on delete set null \(service_id\)/i);
  assert.match(sql, /economic_documents_issued_sequence_unique_idx/i);
  assert.match(sql, /document_number = format\('PF-%s-%s'/i);
  assert.match(sql, /status = 'draft'[\s\S]*sequence_number is null/i);
  assert.match(sql, /status = 'voided'[\s\S]*voided_at is not null/i);
  assert.match(sql, /create function public\.enforce_economic_document_line_identity\(\)[\s\S]*new\.user_id is distinct from old\.user_id[\s\S]*new\.patient_id is distinct from old\.patient_id[\s\S]*new\.document_id is distinct from old\.document_id/i);
  assert.match(sql, /create trigger economic_document_lines_identity_guard\s+before update on public\.economic_document_lines/i);
  assert.doesNotMatch(sql, /create function public\.enforce_economic_document_line_identity\(\)[\s\S]*security definer/i);
  assert.doesNotMatch(sql, /insert into public\.(patients|sessions|payments)|update public\.(patients|sessions|payments)|delete from public\.(patients|sessions|payments)/i);
});

test("migration 022 applica RLS draft-only e privilegi browser minimi", () => {
  const sql = readFileSync(new URL("../supabase/migrations/022_economic_documents_foundation.sql", import.meta.url), "utf8");
  assert.equal((sql.match(/enable row level security/g) || []).length, 4);
  assert.match(sql, /economic documents insert draft own[\s\S]*status = 'draft'/i);
  assert.match(sql, /economic documents update draft own[\s\S]*status = 'draft'[\s\S]*status = 'draft'/i);
  assert.match(sql, /economic document lines insert draft own[\s\S]*d\.status = 'draft'/i);
  assert.match(sql, /revoke all privileges on table public\.economic_document_sequences from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /grant[\s\S]*(truncate|references|trigger)[\s\S]*to authenticated/i);
  assert.doesNotMatch(sql, /grant[\s\S]*economic_document_sequences[\s\S]*to authenticated/i);
});

test("check 022 preflight e postflight sono read-only e il postflight richiede snapshot", () => {
  for (const name of ["preflight", "postflight"]) {
    const sql = readFileSync(new URL(`../supabase/checks/022_economic_documents_${name}.sql`, import.meta.url), "utf8");
    assert.doesNotMatch(sql, /\b(insert|update|delete|alter|create|drop|truncate|grant|revoke)\b\s+(into|table|from|on)/i);
  }
  const postflight = readFileSync(new URL("../supabase/checks/022_economic_documents_postflight.sql", import.meta.url), "utf8");
  assert.match(postflight, /2::bigint as profiles_before[\s\S]*18::bigint as patients_before[\s\S]*25::bigint as sessions_before/i);
  assert.match(postflight, /s\.professional_details_count=0 and s\.documents_count=0 and s\.lines_count=0 and s\.sequences_count=0/i);
  assert.match(postflight, /service_set_null_only_service_id_ok/i);
  assert.match(postflight, /identity_trigger_ok/i);
  assert.match(postflight, /service_role_privileges/i);
});

test("preflight 022 copre collisioni implicite, guard e owner key ordinate", () => {
  const sql = readFileSync(new URL("../supabase/checks/022_economic_documents_preflight.sql", import.meta.url), "utf8");
  for (const name of ["professional_document_details_pkey","economic_documents_pkey","economic_documents_user_patient_id_key","economic_document_lines_pkey","economic_document_lines_document_position_key","economic_document_sequences_pkey"]) assert.match(sql, new RegExp(name));
  assert.match(sql, /to_regprocedure\('public\.enforce_economic_document_line_identity\(\)'\) is null/i);
  assert.match(sql, /tgname='economic_document_lines_identity_guard'/i);
  assert.match(sql, /array\['user_id','patient_id','id'\]::name\[\]/i);
  for (const fingerprint of ["profile_fingerprint","patient_fingerprint","session_fingerprint","payment_fingerprint","appointment_service_fingerprint"]) assert.match(sql, new RegExp(fingerprint));
});

test("postflight 022 verifica schema, check, chiavi, FK, policy e ACL", () => {
  const sql = readFileSync(new URL("../supabase/checks/022_economic_documents_postflight.sql", import.meta.url), "utf8");
  for (const marker of ["complete_schema_ok","all_checks_ok","primary_unique_keys_ok","explicit_indexes_ok","service_set_null_only_service_id_ok","identity_trigger_ok","professional_policies_ok","document_policies_ok","line_policies_ok","authenticated_exact","service_role_privileges"]) assert.match(sql, new RegExp(marker));
  assert.match(sql, /confdelsetcols/i);
  assert.match(sql, /roles=array\['authenticated'\]::name\[\]/i);
  assert.match(sql, /economic_documents_document_type_check'[\s\S]*document_type='proforma'::text/i);
  assert.match(sql, /string_to_array\(\$check\$status=anyarray\|'draft'::text\|'issued'::text\|'voided'::text\$check\$,'\|'\)/i);
  assert.doesNotMatch(sql, /array\['status=anyarray'/i);
  assert.equal((sql.match(/\$check\$/g) || []).length % 2, 0);
  assert.match(sql, /economic_document_lines_position_check'[\s\S]*position>0/i);
  assert.match(sql, /economic_document_lines_line_total_cents_check'[\s\S]*line_total_cents::bigint=quantity::bigint\*unit_amount_cents::bigint/i);
});

test("i checker E3A usano strpos senza POSITION dinamico per i frammenti CHECK", () => {
  const checkerNames = [
    "022_economic_documents_preflight.sql",
    "022_economic_documents_postflight.sql",
    "022_economic_documents_failure_diagnostic.sql",
    "023_fix_economic_document_line_policies_preflight.sql",
    "023_fix_economic_document_line_policies_postflight.sql",
  ];
  const checkers = checkerNames.map((name) =>
    readFileSync(new URL(`../supabase/checks/${name}`, import.meta.url), "utf8")
  );
  for (const sql of checkers) {
    assert.doesNotMatch(sql, /position\s*\(\s*(?:required\.)?fragment\s+in\b/i);
  }
  for (const sql of [checkers[1], checkers[2], checkers[4]]) {
    assert.match(sql, /strpos\(\s*(?:actual\.)?normalized_expression\s*,\s*required\.fragment\s*\)\s*=\s*0/i);
  }
});

test("migration 023 corregge soltanto le tre policy mutation con correlazioni esplicite", () => {
  const sql = readFileSync(new URL("../supabase/migrations/023_fix_economic_document_line_policies.sql", import.meta.url), "utf8");
  assert.equal((sql.match(/alter policy/gi) || []).length, 3);
  assert.doesNotMatch(sql, /alter policy "economic document lines select own"/i);
  for (const name of ["insert draft own","update draft own","delete draft own"]) assert.match(sql, new RegExp(`alter policy "economic document lines ${name}"`, "i"));
  assert.match(sql, /d\.id = economic_document_lines\.document_id/i);
  assert.match(sql, /d\.user_id = economic_document_lines\.user_id/i);
  assert.match(sql, /d\.patient_id = economic_document_lines\.patient_id/i);
  assert.doesNotMatch(sql, /d\.patient_id\s*=\s*patient_id\b/i);
  assert.doesNotMatch(sql, /d\.patient_id\s*=\s*d\.patient_id/i);
  assert.doesNotMatch(sql, /create table|alter table|insert into|update public\.|delete from/i);
});

test("check 023 sono read-only e verificano policy, trigger, FK, CHECK, ACL e snapshot", () => {
  for (const name of ["preflight","postflight"]) {
    const sql = readFileSync(new URL(`../supabase/checks/023_fix_economic_document_line_policies_${name}.sql`, import.meta.url), "utf8");
    assert.doesNotMatch(sql, /^\s*(insert|update|delete|alter|create|drop|truncate|grant|revoke|call|do)\b/im);
  }
  const preflight = readFileSync(new URL("../supabase/checks/023_fix_economic_document_line_policies_preflight.sql", import.meta.url), "utf8");
  assert.match(preflight, /d\.patient_id=d\.patient_id/i);
  assert.match(preflight, /identity_trigger_ok/i);
  assert.match(preflight, /composite_document_fk_ok/i);
  const postflight = readFileSync(new URL("../supabase/checks/023_fix_economic_document_line_policies_postflight.sql", import.meta.url), "utf8");
  for (const marker of ["line_select_policy_ok","line_insert_policy_ok","line_update_using_ok","line_update_with_check_ok","line_delete_policy_ok","tautology_absent","all_foundation_checks_ok","identity_trigger_ok","composite_document_fk_ok","authenticated_exact","preexisting_data_unchanged"]) assert.match(postflight, new RegExp(marker));
  assert.match(postflight, /economic_documents_document_type_check'[\s\S]*document_type='proforma'::text/i);
  assert.match(postflight, /string_to_array\(\$check\$status=anyarray\|'draft'::text\|'issued'::text\|'voided'::text\$check\$,'\|'\)/i);
  assert.doesNotMatch(postflight, /array\['status=anyarray'/i);
  assert.equal((postflight.match(/\$check\$/g) || []).length % 2, 0);
  assert.match(postflight, /economic_document_lines_position_check'[\s\S]*position>0/i);
  assert.match(postflight, /economic_document_lines_line_total_cents_check'[\s\S]*line_total_cents::bigint=quantity::bigint\*unit_amount_cents::bigint/i);
});
