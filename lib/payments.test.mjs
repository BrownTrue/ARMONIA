import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activeAllocatedCents,
  autoDistributePayment,
  assertPatientDeleteAllowed,
  assertSessionDeleteAllowed,
  assertSessionPriceAllowed,
  buildMarkPaidInput,
  commitAfterRemoteDelete,
  createLocalPayment,
  economicOperationError,
  economicDeleteError,
  filterPayments,
  openPatientSessions,
  outstandingCents,
  patientEconomicSummary,
  paymentAvailableCreditCents,
  paymentStateForSession,
  receivedCentsInPeriod,
  sessionsCountInPeriod,
  unallocatedCreditCents,
  voidLocalPayment,
} from "./payments.ts";
import { normalizeAppData } from "./data/local-store.ts";

const stamp = "2026-09-28T10:00:00.000Z";
const session = (id, price = 4500, patientId = "patient-1", date = "2026-09-28") => ({ id, patientId, effectivePriceCents: price, date, duration: 45, goalIds: [], activities: "", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: stamp });
const payment = (id, amountCents, overrides = {}) => ({ id, patientId: "patient-1", amountCents, paidAt: stamp, method: "cash", note: "", status: "active", createdAt: stamp, updatedAt: stamp, ...overrides });
const allocation = (paymentId, sessionId, amountCents, patientId = "patient-1") => ({ paymentId, sessionId, patientId, amountCents, createdAt: stamp });
const state = (sessions = [], payments = [], paymentAllocations = []) => ({ patients: [{ id: "patient-1" }, { id: "patient-2" }], sessions, payments, paymentAllocations });
const input = (id, amountCents, allocations = [], overrides = {}) => ({ id, patientId: "patient-1", amountCents, paidAt: stamp, method: "cash", allocations, createdAt: stamp, ...overrides });

test("pagamento completo rende la seduta pagata", () => {
  const summary = paymentStateForSession(session("s1"), [payment("p1", 4500)], [allocation("p1", "s1", 4500)]);
  assert.deepEqual(summary, { state: "paid", allocatedCents: 4500, residualCents: 0 });
});

test("seduta nota senza pagamenti è non pagata", () => assert.equal(paymentStateForSession(session("s1"), [], []).state, "unpaid"));
test("pagamento parziale lascia il residuo", () => assert.deepEqual(paymentStateForSession(session("s1"), [payment("p1", 2000)], [allocation("p1", "s1", 2000)]), { state: "partial", allocatedCents: 2000, residualCents: 2500 }));
test("due pagamenti possono saldare una seduta", () => assert.equal(activeAllocatedCents("s1", [payment("p1", 2000), payment("p2", 2500)], [allocation("p1", "s1", 2000), allocation("p2", "s1", 2500)]), 4500));

test("un pagamento cumulativo copre tre sedute", () => {
  const created = createLocalPayment(state([session("s1"), session("s2"), session("s3")]), input("p1", 13500, [{ sessionId: "s1", amountCents: 4500 }, { sessionId: "s2", amountCents: 4500 }, { sessionId: "s3", amountCents: 4500 }]));
  assert.equal(created.allocations.length, 3);
  assert.equal(created.allocations.reduce((sum, item) => sum + item.amountCents, 0), 13500);
});

test("100 euro su tre sedute lascia la terza parziale", () => {
  const sessions = [session("s1"), session("s2"), session("s3")];
  const created = createLocalPayment(state(sessions), input("p1", 10000, [{ sessionId: "s1", amountCents: 4500 }, { sessionId: "s2", amountCents: 4500 }, { sessionId: "s3", amountCents: 1000 }]));
  assert.equal(paymentStateForSession(sessions[2], [created.payment], created.allocations).residualCents, 3500);
});

test("gratuita e prezzo non specificato hanno stati distinti e nessun debito", () => {
  const unspecified = { ...session("missing"), effectivePriceCents: undefined };
  assert.equal(paymentStateForSession(session("free", 0), [], []).state, "free");
  assert.equal(paymentStateForSession(unspecified, [], []).state, "price_unspecified");
  assert.equal(outstandingCents([session("free", 0), unspecified], [], []), 0);
});

test("pagamento non allocato crea credito", () => {
  const created = createLocalPayment(state([]), input("p1", 20000));
  assert.equal(created.allocations.length, 0);
  assert.equal(unallocatedCreditCents("patient-1", [created.payment], []), 20000);
});

test("credito residuo considera solo la parte non allocata", () => assert.equal(unallocatedCreditCents("patient-1", [payment("p1", 10000)], [allocation("p1", "s1", 4500)]), 5500));

test("void conserva il pagamento ma rimuove il suo effetto", () => {
  const voided = voidLocalPayment([payment("p1", 4500)], "p1", "2026-09-29T10:00:00.000Z");
  assert.equal(voided[0].status, "voided");
  assert.equal(paymentStateForSession(session("s1"), voided, [allocation("p1", "s1", 4500)]).state, "unpaid");
  assert.equal(receivedCentsInPeriod(voided, { from: "2026-09-01", to: "2026-09-30T23:59:59Z" }), 0);
});

test("incassato usa paidAt e non la data della seduta", () => {
  const payments = [payment("p1", 4500, { paidAt: "2026-10-02T09:00:00Z" })];
  assert.equal(receivedCentsInPeriod(payments, { from: "2026-09-01", to: "2026-09-30T23:59:59Z" }), 0);
  assert.equal(receivedCentsInPeriod(payments, { from: "2026-10-01", to: "2026-10-31T23:59:59Z" }), 4500);
  assert.equal(sessionsCountInPeriod([session("s1", 4500, "patient-1", "2026-09-10")], { from: "2026-09-01", to: "2026-09-30" }), 1);
});

test("blocca allocazioni oltre pagamento e oltre prezzo seduta", () => {
  assert.throws(() => createLocalPayment(state([session("s1", 9000)]), input("p1", 4000, [{ sessionId: "s1", amountCents: 4500 }])), /allocazioni superano/i);
  assert.throws(() => createLocalPayment(state([session("s1")]), input("p1", 5000, [{ sessionId: "s1", amountCents: 5000 }])), /residuo/i);
});

test("blocca seduta di un altro paziente", () => assert.throws(() => createLocalPayment(state([session("s1", 4500, "patient-2")]), input("p1", 4500, [{ sessionId: "s1", amountCents: 4500 }])), /stesso paziente/i));

test("riduzione sotto allocato è bloccata e aumento consentito", () => {
  const payments = [payment("p1", 3000)], allocations = [allocation("p1", "s1", 3000)];
  assert.throws(() => assertSessionPriceAllowed(session("s1", 2999), payments, allocations), /inferiore/i);
  assert.throws(() => assertSessionPriceAllowed({ ...session("s1"), effectivePriceCents: undefined }, payments, allocations), /inferiore/i);
  assert.doesNotThrow(() => assertSessionPriceAllowed(session("s1", 5000), payments, allocations));
});

test("delete seduta allocata e paziente con storico sono bloccati", () => {
  assert.throws(() => assertSessionDeleteAllowed("s1", [allocation("p1", "s1", 1000)]), /pagamenti associati/i);
  assert.throws(() => assertPatientDeleteAllowed("patient-1", [payment("p1", 1000)]), /storico pagamenti/i);
  assert.doesNotThrow(() => assertSessionDeleteAllowed("s2", [allocation("p1", "s1", 1000)]));
});

test("delete cloud aggiorna lo stato soltanto dopo conferma remota", async () => {
  const order = [];
  await commitAfterRemoteDelete(async () => { order.push("remote"); }, () => { order.push("state"); });
  assert.deepEqual(order, ["remote", "state"]);
});

test("errore delete cloud conserva stato Patient e Session", async () => {
  let patientPresent = true;
  let sessionPresent = true;
  await assert.rejects(commitAfterRemoteDelete(async () => { throw { code: "23503" }; }, () => { patientPresent = false; }));
  await assert.rejects(commitAfterRemoteDelete(async () => { throw { code: "23503" }; }, () => { sessionPresent = false; }));
  assert.equal(patientPresent, true);
  assert.equal(sessionPresent, true);
  assert.match(economicDeleteError({ code: "23503" }, "patient").message, /storico economico/i);
  assert.match(economicDeleteError({ code: "23503" }, "session").message, /pagamenti associati/i);
});

test("Segna pagato prepara Payment e Allocation per il solo residuo", () => {
  const result = buildMarkPaidInput(session("s1"), [payment("old", 2000)], [allocation("old", "s1", 2000)], { id: "new", paidAt: stamp, method: "card", createdAt: stamp });
  assert.equal(result?.amountCents, 2500);
  assert.deepEqual(result?.allocations, [{ sessionId: "s1", amountCents: 2500 }]);
});

test("auto-distribuzione usa le sedute più vecchie e produce 45+45+10", () => {
  const sessions = [session("new", 4500, "patient-1", "2026-09-03"), session("old", 4500, "patient-1", "2026-09-01"), session("middle", 4500, "patient-1", "2026-09-02")];
  assert.deepEqual(autoDistributePayment(10000, sessions, [], []), [
    { sessionId: "old", amountCents: 4500 },
    { sessionId: "middle", amountCents: 4500 },
    { sessionId: "new", amountCents: 1000 },
  ]);
});

test("auto-distribuzione esclude gratuita prezzo assente e già pagata", () => {
  const sessions = [session("free", 0), { ...session("missing"), effectivePriceCents: undefined }, session("paid"), session("open")];
  const payments = [payment("p1", 4500)];
  const allocations = [allocation("p1", "paid", 4500)];
  assert.deepEqual(openPatientSessions("patient-1", sessions, payments, allocations).map(item => item.id), ["open"]);
  assert.deepEqual(autoDistributePayment(5000, sessions, payments, allocations), [{ sessionId: "open", amountCents: 4500 }]);
});

test("metriche e riepilogo paziente reagiscono al void", () => {
  const sessions = [session("s1"), session("s2", 0), { ...session("s3"), effectivePriceCents: undefined }];
  const payments = [payment("p1", 5000)];
  const allocations = [allocation("p1", "s1", 3000)];
  assert.deepEqual(patientEconomicSummary("patient-1", sessions, payments, allocations), { outstandingCents: 1500, availableCreditCents: 2000, unpaidSessions: 1 });
  const voided = voidLocalPayment(payments, "p1", stamp);
  assert.equal(paymentAvailableCreditCents(voided[0], allocations), 0);
  assert.deepEqual(patientEconomicSummary("patient-1", sessions, voided, allocations), { outstandingCents: 4500, availableCreditCents: 0, unpaidSessions: 1 });
  assert.equal(receivedCentsInPeriod(voided, { from: "2026-09-01", to: "2026-09-30T23:59:59Z" }), 0);
});

test("filtri pagamenti combinano periodo paziente metodo e stato", () => {
  const payments = [payment("match", 1000, { paidAt: "2026-09-10T10:00:00Z", method: "card" }), payment("wrong-method", 1000, { paidAt: "2026-09-10T10:00:00Z" }), payment("voided", 1000, { paidAt: "2026-09-10T10:00:00Z", method: "card", status: "voided" }), payment("other-patient", 1000, { patientId: "patient-2", paidAt: "2026-09-10T10:00:00Z", method: "card" })];
  assert.deepEqual(filterPayments(payments, { from: "2026-09-01", to: "2026-09-30T23:59:59Z", patientId: "patient-1", method: "card", status: "active" }).map(item => item.id), ["match"]);
});

test("error mapping economico non espone errori SQL grezzi", () => {
  assert.match(economicOperationError({ code: "23514", message: "session_overallocated internal" }).message, /superano/i);
  assert.match(economicOperationError({ code: "23503", message: "private constraint" }).message, /stesso paziente/i);
  assert.doesNotMatch(economicOperationError({ code: "XX000", message: "sensitive sql detail" }).message, /sensitive|sql/i);
});

test("UI E2B distingue Incassa dalla registrazione generale e mantiene il riepilogo paziente", () => {
  const economy = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
  const patient = readFileSync(new URL("../app/pazienti/[id]/page.tsx", import.meta.url), "utf8");
  for (const text of ["Incassato questo mese", "Da incassare", "Prestazioni del mese", "Incassa prestazione", "Registra incasso", "Credito disponibile", "Pagamenti recenti", "Annulla pagamento"]) assert.match(economy, new RegExp(text, "i"));
  assert.doesNotMatch(economy, /Registra pagamento/i);
  assert.match(economy, /actionable[\s\S]*state === "unpaid"[\s\S]*state === "partial"[\s\S]*Incassa/i);
  assert.match(economy, /Dettaglio economico[\s\S]*Nessun incasso registrato[\s\S]*Apri seduta clinica/i);
  assert.match(patient, /Situazione economica[\s\S]*Apri in Economia/i);
});

test("UX Economia usa tre tab, filtri collassati mobile e non rende il catalogo permanente", () => {
  const economy = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
  assert.match(economy, /mobileSection[\s\S]*Prestazioni[\s\S]*Pagamenti[\s\S]*Documenti/i);
  assert.match(economy, /setFilterPanel\("services"\)[\s\S]*Filtri/i);
  assert.match(economy, /setFilterPanel\("payments"\)[\s\S]*Filtri/i);
  assert.match(economy, /Gestisci prestazioni/i);
  assert.doesNotMatch(economy, /Catalogo prestazioni/i);
  assert.match(economy, /Vedi tutte/i);
});

test("modal Incassa consente completo e parziale senza cambiare modello E2A", () => {
  const economy = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
  assert.match(economy, /initialResidual[\s\S]*setAmount[\s\S]*String\(initialResidual \/ 100\)/i);
  assert.match(economy, /remaining > 0[\s\S]*resteranno[\s\S]*da saldare[\s\S]*risulterà saldata/i);
  assert.match(economy, /allocations: selected/i);
});

test("selector non mutano gli input", () => {
  const sessions = Object.freeze([Object.freeze(session("s1"))]);
  const payments = Object.freeze([Object.freeze(payment("p1", 1000))]);
  const allocations = Object.freeze([Object.freeze(allocation("p1", "s1", 1000))]);
  paymentStateForSession(sessions[0], payments, allocations);
  outstandingCents(sessions, payments, allocations);
  unallocatedCreditCents("patient-1", payments, allocations);
  assert.equal(payments[0].status, "active");
});

test("dati locali legacy ricevono collezioni economiche vuote", () => {
  const normalized = normalizeAppData({ sessions: [{ ...session("legacy"), effectivePriceCents: undefined }] });
  assert.deepEqual(normalized.payments, []);
  assert.deepEqual(normalized.paymentAllocations, []);
});

test("migration impone ownership, restrict, RLS e RPC protette", () => {
  const sql = readFileSync(new URL("../supabase/migrations/020_payments_allocations_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /foreign key \(user_id, patient_id\)[\s\S]*patients \(user_id, id\)[\s\S]*on delete restrict/i);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\) on delete restrict/i);
  assert.doesNotMatch(sql, /user_id uuid not null references auth\.users\(id\) on delete cascade/i);
  assert.match(sql, /foreign key \(user_id, patient_id, payment_id\)[\s\S]*payments \(user_id, patient_id, id\)[\s\S]*on delete restrict/i);
  assert.match(sql, /foreign key \(user_id, patient_id, session_id\)[\s\S]*sessions \(user_id, patient_id, id\)[\s\S]*on delete restrict/i);
  assert.match(sql, /enable row level security[\s\S]*user_id = auth\.uid\(\)/i);
  assert.match(sql, /revoke all on table public\.payments from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.payments to authenticated/i);
  assert.match(sql, /security definer[\s\S]*set search_path = pg_catalog, public/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /session_overallocated/i);
  assert.match(sql, /session_price_below_allocated_amount/i);
});

test("migration impedisce cross-user e cross-patient tramite FK composite", () => {
  const sql = readFileSync(new URL("../supabase/migrations/020_payments_allocations_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /payments_user_patient_id_key unique \(user_id, patient_id, id\)/i);
  assert.match(sql, /sessions_user_patient_id_key unique \(user_id, patient_id, id\)/i);
  assert.match(sql, /where s\.user_id = v_user_id and s\.patient_id = p_patient_id/i);
});

test("preflight e postflight 020 sono read-only e verificano sicurezza e assenza di backfill", () => {
  const preflight = readFileSync(new URL("../supabase/checks/020_payments_allocations_preflight.sql", import.meta.url), "utf8");
  const postflight = readFileSync(new URL("../supabase/checks/020_payments_allocations_postflight.sql", import.meta.url), "utf8");
  assert.doesNotMatch(preflight, /^\s*(insert|update|delete|alter|create|drop|truncate)\b/im);
  assert.doesNotMatch(postflight, /^\s*(insert|update|delete|alter|create|drop|truncate)\b/im);
  for (const field of ["ready", "server_version_num", "patients_before", "sessions_before", "payments_absent", "allocations_absent", "session_price_present", "patient_owner_key_present", "session_owner_key_collision_absent", "function_name_collisions_absent", "trigger_name_collision_absent", "default_privileges", "current_delete_structure"]) assert.match(preflight, new RegExp(field, "i"));
  assert.match(postflight, /payments_count = 0[\s\S]*allocations_count = 0/i);
  for (const field of ["auth_user_restrict_ok", "patient_restrict_ok", "allocation_payment_restrict_ok", "allocation_session_restrict_ok", "authenticated_mutations_blocked", "anon_blocked", "public_blocked", "functions_present", "public_execute_blocked", "trigger_ok"]) assert.match(postflight, new RegExp(field, "i"));
  assert.match(postflight, /session_economic_fingerprint_after\s*=\s*e\.session_economic_fingerprint_before/i);
});

test("DataProvider usa il commit remoto-first per Patient e Session cloud", () => {
  const source = readFileSync(new URL("../components/data-provider.tsx", import.meta.url), "utf8");
  assert.match(source, /deletePatient=async\(id:string\)=>\{[\s\S]*?commitAfterRemoteDelete\(client\?async\(\)=>\{[\s\S]*?from\("patients"\)\.delete\(\)[\s\S]*?,commit\)/i);
  assert.match(source, /deleteSession=async\(id:string\)=>\{[\s\S]*?commitAfterRemoteDelete\(client\?async\(\)=>\{[\s\S]*?from\("sessions"\)\.delete\(\)[\s\S]*?setData/i);
});
