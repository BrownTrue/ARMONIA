import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildDeliveredServiceRows,
  detachServiceFromSessions,
  deliveredValueCents,
  filterEconomySessions,
  groupSessionsByService,
  missingPriceCount,
  resolveNewSessionDraft,
  sessionWithAppointmentSnapshot,
  sessionWithService,
  sessionsInPeriod,
} from "./economy.ts";
import { removeAppointmentService } from "./calendar-v2.ts";
import { normalizeAppData } from "./data/local-store.ts";
import { sessionFromRow, sessionRow } from "./supabase/repository.ts";

const stamp = "2026-09-28T08:00:00.000Z";
const session = (id, overrides = {}) => ({ id, patientId: "patient-1", date: "2026-09-28", duration: 45, goalIds: [], activities: "Attività", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: stamp, ...overrides });
const service = (overrides = {}) => ({ id: "service-1", name: "Seduta logopedica", description: "", defaultDurationMinutes: 45, defaultPriceCents: 4000, isActive: true, displayOrder: 0, createdAt: stamp, updatedAt: stamp, ...overrides });
const appointment = (overrides = {}) => ({ id: "appointment-1", patientId: "patient-1", date: "2026-09-28", time: "10:00", duration: 60, type: "regular", notes: "", serviceId: "service-1", serviceNameSnapshot: "Prima visita", effectivePriceCents: 6000, createdAt: stamp, ...overrides });
const patient = { id: "patient-1", firstName: "Mario", lastName: "Rossi", birthDate: "", contact: "", guardian: "", school: "", schoolClass: "", referralReason: "", notes: "", status: "active", createdAt: stamp };

test("Session legacy resta valida senza dati economici", () => {
  const model = sessionFromRow({ id: "legacy", patient_id: "patient-1", appointment_id: null, occurred_at: "2026-09-28T12:00:00Z", duration_minutes: 45, created_at: stamp });
  assert.equal(model.serviceId, undefined);
  assert.equal(model.serviceNameSnapshot, undefined);
  assert.equal(model.effectivePriceCents, undefined);
  assert.equal(sessionRow(model, "user-1").effective_price_cents, null);
});

test("archivio locale legacy conserva le Session senza richiedere snapshot economici", () => {
  const legacy = session("local-legacy");
  const normalized = normalizeAppData({ sessions: [legacy] });
  assert.deepEqual(normalized.sessions, [legacy]);
});

test("snapshot da Appointment copia una sola volta servizio prezzo data e durata", () => {
  const result = sessionWithAppointmentSnapshot(session("s1"), appointment());
  assert.equal(result.serviceId, "service-1");
  assert.equal(result.serviceNameSnapshot, "Prima visita");
  assert.equal(result.effectivePriceCents, 6000);
  assert.equal(result.duration, 60);
  const changed = appointment({ serviceNameSnapshot: "Nuovo nome", effectivePriceCents: 9000 });
  assert.equal(result.effectivePriceCents, 6000);
  assert.equal(changed.effectivePriceCents, 9000);
});

test("inizializzazione da URL attende i dati e poi copia lo snapshot una sola volta", () => {
  const waiting = resolveNewSessionDraft(null, { dataReady: false, appointmentId: "appointment-1", appointments: [], fallbackPatientId: "", fallbackDate: "2026-09-30", createId: () => "session-1", createdAt: () => stamp });
  assert.equal(waiting.session, null);
  const ready = resolveNewSessionDraft(null, { dataReady: true, appointmentId: "appointment-1", appointments: [appointment()], fallbackPatientId: "", fallbackDate: "2026-09-30", createId: () => "session-1", createdAt: () => stamp });
  assert.equal(ready.session?.appointmentId, "appointment-1");
  assert.equal(ready.session?.date, "2026-09-28");
  assert.equal(ready.session?.duration, 60);
  assert.equal(ready.session?.serviceId, "service-1");
  assert.equal(ready.session?.serviceNameSnapshot, "Prima visita");
  assert.equal(ready.session?.effectivePriceCents, 6000);
  const userEdited = { ...ready.session, effectivePriceCents: 3500 };
  const later = resolveNewSessionDraft(userEdited, { dataReady: true, appointmentId: "appointment-1", appointments: [appointment({ effectivePriceCents: 9000 })], fallbackPatientId: "", fallbackDate: "2026-09-30", createId: () => "other", createdAt: () => stamp });
  assert.equal(later.session, userEdited);
  assert.equal(later.session?.effectivePriceCents, 3500);
});

test("appointment inesistente dopo il caricamento produce una seduta manuale e non resta in attesa", () => {
  const result = resolveNewSessionDraft(null, { dataReady: true, appointmentId: "missing", appointments: [], fallbackPatientId: "patient-1", fallbackDate: "2026-09-30", createId: () => "session-1", createdAt: () => stamp });
  assert.equal(result.appointmentMissing, true);
  assert.equal(result.session?.appointmentId, undefined);
  assert.equal(result.session?.patientId, "patient-1");
});

test("prezzo NULL e zero restano distinti nel mapper", () => {
  assert.equal(sessionRow(session("missing"), "user-1").effective_price_cents, null);
  assert.equal(sessionRow(session("free", { effectivePriceCents: 0 }), "user-1").effective_price_cents, 0);
  assert.equal(sessionFromRow({ id: "free", patient_id: "patient-1", occurred_at: "2026-09-28T12:00:00Z", effective_price_cents: 0, created_at: stamp }).effectivePriceCents, 0);
});

test("Session manuale può usare catalogo e prezzo personalizzato", () => {
  const selected = sessionWithService(session("manual"), service());
  const customized = { ...selected, effectivePriceCents: 3500 };
  assert.equal(customized.serviceNameSnapshot, "Seduta logopedica");
  assert.equal(customized.effectivePriceCents, 3500);
  const removed = sessionWithService(customized, null);
  assert.equal(removed.serviceId, undefined);
  assert.equal(removed.serviceNameSnapshot, undefined);
  assert.equal(removed.effectivePriceCents, 3500);
});

test("selezionare il catalogo non muta Session o prestazione", () => {
  const source = session("s1");
  const catalog = service();
  const before = structuredClone({ source, catalog });
  sessionWithService(source, catalog);
  assert.deepEqual({ source, catalog }, before);
});

test("modificare il catalogo dopo la copia non cambia lo storico della Session", () => {
  const catalog = service();
  const historical = sessionWithService(session("historical"), catalog);
  const changedCatalog = { ...catalog, name: "Nuovo nome", defaultPriceCents: 9000 };
  assert.equal(historical.serviceNameSnapshot, "Seduta logopedica");
  assert.equal(historical.effectivePriceCents, 4000);
  assert.equal(changedCatalog.defaultPriceCents, 9000);
});

test("eliminare una prestazione scollega solo serviceId e conserva snapshot, prezzo e gratuità", () => {
  const source = [
    session("paid", { serviceId: "service-1", serviceNameSnapshot: "Seduta logopedica", effectivePriceCents: 4000 }),
    session("free", { serviceId: "service-1", serviceNameSnapshot: "Seduta gratuita", effectivePriceCents: 0 }),
    session("other", { serviceId: "service-2", serviceNameSnapshot: "Altro", effectivePriceCents: 5000 }),
  ];
  const result = detachServiceFromSessions(source, "service-1");
  assert.equal(result[0].serviceId, undefined);
  assert.equal(result[0].serviceNameSnapshot, "Seduta logopedica");
  assert.equal(result[0].effectivePriceCents, 4000);
  assert.equal(result[1].serviceId, undefined);
  assert.equal(result[1].serviceNameSnapshot, "Seduta gratuita");
  assert.equal(result[1].effectivePriceCents, 0);
  assert.equal(result[2], source[2]);
});

test("un Appointment che usa la prestazione continua a impedirne la cancellazione", () => {
  assert.throws(() => removeAppointmentService([service()], [appointment()], "service-1"), /disattivarla/);
});

test("selector del mese somma solo prezzi specificati e conta i mancanti", () => {
  const source = [session("priced", { effectivePriceCents: 4000 }), session("free", { effectivePriceCents: 0 }), session("missing"), session("outside", { date: "2026-08-31", effectivePriceCents: 9000 })];
  const month = sessionsInPeriod(source, { from: "2026-09-01", to: "2026-09-30" });
  assert.equal(month.length, 3);
  assert.equal(deliveredValueCents(month), 4000);
  assert.equal(missingPriceCount(month), 1);
});

test("filtri periodo paziente e prestazione si combinano", () => {
  const source = [session("one", { serviceId: "a", serviceNameSnapshot: "A" }), session("two", { patientId: "patient-2", serviceId: "a", serviceNameSnapshot: "A" }), session("three", { serviceId: "b", serviceNameSnapshot: "B" })];
  assert.deepEqual(filterEconomySessions(source, { from: "2026-09-01", to: "2026-09-30", patientId: "patient-1", serviceKey: "id:a" }).map((item) => item.id), ["one"]);
});

test("raggruppamento per prestazione conserva gratuità e prezzi mancanti", () => {
  const groups = groupSessionsByService([session("one", { serviceId: "a", serviceNameSnapshot: "A", effectivePriceCents: 0 }), session("two", { serviceId: "a", serviceNameSnapshot: "A" })]);
  assert.deepEqual(groups, [{ serviceId: "a", serviceName: "A", count: 2, valueCents: 0, missingPriceCount: 1 }]);
});

test("righe delle prestazioni sono ordinate senza fallback Appointment", () => {
  const rows = buildDeliveredServiceRows([session("old", { date: "2026-09-01", serviceNameSnapshot: undefined }), session("new", { date: "2026-09-20", serviceNameSnapshot: "Valutazione", effectivePriceCents: 7000 })], [patient]);
  assert.deepEqual(rows.map((row) => row.session.id), ["new", "old"]);
  assert.equal(rows[1].serviceName, undefined);
});

test("migration 019 è additiva nullable senza backfill e con ownership composita", () => {
  const sql = readFileSync(new URL("../supabase/migrations/019_session_economic_snapshots.sql", import.meta.url), "utf8");
  assert.match(sql, /^\s*--[\s\S]*?\nbegin;/i);
  assert.match(sql, /commit;\s*$/i);
  assert.match(sql, /add column service_id uuid/i);
  assert.match(sql, /add column service_name_snapshot text/i);
  assert.match(sql, /add column effective_price_cents integer/i);
  assert.match(sql, /foreign key \(user_id, service_id\)[\s\S]*appointment_services \(user_id, id\)[\s\S]*on delete set null \(service_id\)/i);
  assert.match(sql, /effective_price_cents is null or effective_price_cents >= 0/i);
  assert.doesNotMatch(sql, /update\s+public\.sessions/i);
  assert.doesNotMatch(sql, /add column service_id uuid\s+not null/i);
  assert.doesNotMatch(sql, /add column service_name_snapshot text\s+not null/i);
  assert.doesNotMatch(sql, /add column effective_price_cents integer\s+not null/i);
});

test("preflight e postflight 019 verificano versione, sicurezza e cataloghi", () => {
  const preflight = readFileSync(new URL("../supabase/checks/019_session_economic_snapshots_preflight.sql", import.meta.url), "utf8");
  const postflight = readFileSync(new URL("../supabase/checks/019_session_economic_snapshots_postflight.sql", import.meta.url), "utf8");
  assert.match(preflight, /server_version_num[\s\S]*>= 150000/i);
  assert.match(preflight, /pg_catalog\.pg_policies/i);
  assert.match(preflight, /role_table_grants/i);
  assert.match(preflight, /appointment_services[\s\S]*array\['user_id', 'id'\]/i);
  assert.match(postflight, /confdelsetcols/i);
  assert.match(postflight, /array\['service_id'\]/i);
  assert.match(postflight, /sessions_user_service_occurred_idx/i);
  assert.match(postflight, /pg_catalog\.pg_policies/i);
  assert.match(postflight, /role_table_grants/i);
});

test("valore erogato e incassato restano metriche distinte", () => {
  const page = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Incassato questo mese/);
  assert.match(page, /Prestazioni del mese/);
  assert.match(page, /Valore erogato/);
});
