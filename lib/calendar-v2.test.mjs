import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildWeeklyAppointmentOccurrences,
  archiveAppointmentLocation,
  archiveAppointmentService,
  calendarRomeDate,
  centsToEuroInput,
  euroInputToCents,
  LOCATION_COLOR_PALETTE,
  CALENDAR_COLOR_PALETTE,
  nextCalendarColor,
  nextLocationColor,
  getCalendarCatalogLifecycle,
  isCalendarCatalogAppointmentBlocking,
  removeAppointmentLocation,
  removeAppointmentService,
  upsertAppointmentLocation,
  upsertAppointmentService,
  withAppointmentLocation,
  withAppointmentService,
  selectableAppointmentLocations,
  selectableAppointmentServices,
} from "./calendar-v2.ts";
import { normalizeAppointmentRecurrencePositions, readLocalData, serializeLocalData } from "./data/local-store.ts";
import { getAppointmentDisplayColor } from "./calendar-visual.ts";
import {
  appointmentFromRow,
  appointmentLocationFromRow,
  appointmentLocationRow,
  appointmentRow,
  appointmentServiceFromRow,
  appointmentServiceRow,
  profileRow,
} from "./supabase/repository.ts";

const timestamp = "2026-09-27T08:00:00.000Z";
const appointment = () => ({
  id: "appointment-1",
  patientId: "patient-1",
  date: "2026-10-01",
  time: "16:00",
  duration: 45,
  type: "regular",
  notes: "",
  recurrenceSeriesId: "series-1",
  recurrencePosition: 2,
  createdAt: timestamp,
});
const location = () => ({
  id: "location-1",
  name: "Studio Centro",
  color: "#3A7D68",
  address: "Via Test 1",
  city: "Roma",
  isActive: true,
  displayOrder: 2,
  createdAt: timestamp,
  updatedAt: timestamp,
});
const service = (defaultPriceCents = 6500) => ({
  id: "service-1",
  name: "Valutazione",
  description: "Prestazione sintetica",
  defaultDurationMinutes: 60,
  defaultPriceCents,
  isActive: true,
  displayOrder: 3,
  createdAt: timestamp,
  updatedAt: timestamp,
});

test("mappa una sede tra modello applicativo e riga Supabase", () => {
  const row = appointmentLocationRow(location(), "user-1");
  assert.deepEqual(row, {
    id: "location-1",
    user_id: "user-1",
    name: "Studio Centro",
    color: "#3A7D68",
    address: "Via Test 1",
    city: "Roma",
    is_active: true,
    archived_at: null,
    display_order: 2,
    created_at: timestamp,
    updated_at: timestamp,
  });
  assert.deepEqual(appointmentLocationFromRow(row), location());
});

test("mappa una prestazione e distingue prezzo zero da prezzo non impostato", () => {
  const freeRow = appointmentServiceRow(service(0), "user-1");
  assert.equal(freeRow.default_price_cents, 0);
  assert.equal(appointmentServiceFromRow(freeRow).defaultPriceCents, 0);

  const unset = { ...service(), defaultPriceCents: undefined };
  const unsetRow = appointmentServiceRow(unset, "user-1");
  assert.equal(unsetRow.default_price_cents, null);
  assert.equal(appointmentServiceFromRow(unsetRow).defaultPriceCents, undefined);
});

test("mappa archived_at per sedi e prestazioni senza filtrare lo storico", () => {
  const archivedAt = "2026-10-05T11:00:00.000Z";
  const locationRow = appointmentLocationRow({ ...location(), archivedAt, isActive: false }, "user-1");
  const serviceRow = appointmentServiceRow({ ...service(), archivedAt, isActive: false }, "user-1");
  assert.equal(locationRow.archived_at, archivedAt);
  assert.equal(serviceRow.archived_at, archivedAt);
  assert.equal(appointmentLocationFromRow(locationRow).archivedAt, archivedAt);
  assert.equal(appointmentServiceFromRow(serviceRow).archivedAt, archivedAt);
});

test("mappa il colore prestazione e mantiene valido un record legacy senza colore", () => {
  const colored = { ...service(), color: "#E19A75" };
  const row = appointmentServiceRow(colored, "user-1");
  assert.equal(row.color, "#E19A75");
  assert.equal(appointmentServiceFromRow(row).color, "#E19A75");
  assert.equal(appointmentServiceFromRow({ ...row, color: null }).color, undefined);
});

test("il mapper Profile persiste calendarColorMode senza perdere gli altri campi", () => {
  const row = profileRow({ firstName:"Ada", lastName:"Rossi", profession:"Logopedista", email:"ada@example.test", studio:"Studio", calendarColorMode:"service" }, "user-1");
  assert.equal(row.calendar_color_mode, "service");
  assert.equal(row.first_name, "Ada");
});

test("mappa appuntamenti legacy senza richiedere i nuovi campi", () => {
  const mapped = appointmentFromRow({
    id: "appointment-legacy",
    patient_id: "patient-1",
    starts_at: "2026-10-01T16:00:00",
    duration_minutes: 45,
    type: "regular",
    notes: null,
    recurrence_series_id: null,
    created_at: timestamp,
  });
  assert.equal(mapped.locationId, undefined);
  assert.equal(mapped.serviceId, undefined);
  assert.equal(mapped.locationNameSnapshot, undefined);
  assert.equal(mapped.serviceNameSnapshot, undefined);
  assert.equal(mapped.effectivePriceCents, undefined);
  assert.equal(mapped.recurrencePosition, undefined);
});

test("mappa i nuovi campi appointment nullable senza conversioni monetarie", () => {
  const source = {
    ...appointment(),
    locationId: "location-1",
    serviceId: "service-1",
    locationNameSnapshot: "Studio Centro",
    serviceNameSnapshot: "Valutazione",
    effectivePriceCents: 0,
  };
  const row = appointmentRow(source, "user-1");
  assert.equal(row.effective_price_cents, 0);
  assert.equal(row.location_id, "location-1");
  assert.equal(row.recurrence_position, 2);
  const mapped = appointmentFromRow({ ...row, created_at: timestamp });
  assert.equal(mapped.effectivePriceCents, 0);
  assert.equal(mapped.locationNameSnapshot, "Studio Centro");
  assert.equal(mapped.recurrencePosition, 2);

  const emptyRow = appointmentRow(appointment(), "user-1");
  assert.equal(emptyRow.location_id, null);
  assert.equal(emptyRow.service_id, null);
  assert.equal(emptyRow.effective_price_cents, null);
});

test("normalizza una serie locale legacy una volta e preserva posizioni già stabili", () => {
  const legacy = [
    { ...appointment(), id: "later", date: "2026-10-15", recurrencePosition: undefined },
    { ...appointment(), id: "first", date: "2026-10-01", recurrencePosition: undefined },
    { ...appointment(), id: "middle", date: "2026-10-08", recurrencePosition: undefined },
    { ...appointment(), id: "single", recurrenceSeriesId: undefined, recurrencePosition: 7 },
  ];
  const normalized = normalizeAppointmentRecurrencePositions(legacy);
  assert.deepEqual(
    normalized.filter((item) => item.recurrenceSeriesId).map((item) => [item.id, item.recurrencePosition]),
    [["later", 2], ["first", 0], ["middle", 1]],
  );
  assert.equal(normalized.find((item) => item.id === "single").recurrencePosition, undefined);

  const moved = normalized.map((item) => item.id === "first" ? { ...item, date: "2026-11-01", time: "18:00" } : item);
  assert.deepEqual(
    normalizeAppointmentRecurrencePositions(moved).map((item) => [item.id, item.recurrencePosition]),
    moved.map((item) => [item.id, item.recurrencePosition]),
  );

  const localRead = readLocalData(JSON.stringify({
    schemaVersion: 1,
    savedAt: timestamp,
    data: { appointments: legacy, profile: {} },
  }), () => ({ appointments: [] }));
  assert.equal(localRead.migrated, true);
  assert.deepEqual(
    localRead.data.appointments.filter((item) => item.recurrenceSeriesId).map((item) => item.recurrencePosition),
    [2, 0, 1],
  );
});

test("apre un envelope locale precedente senza locations e services", () => {
  const legacyData = {
    patients: [], appointments: [], sessions: [], goals: [], materials: [],
    clinicalPathways: [], clinicalAssessments: [],
    profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" },
  };
  const fallback = () => ({ ...legacyData, locations: [], services: [] });
  const raw = JSON.stringify({ schemaVersion: 1, savedAt: timestamp, data: legacyData });
  const result = readLocalData(raw, fallback);
  assert.equal(result.writable, true);
  assert.equal(result.migrated, true);
  assert.deepEqual(result.data.locations, []);
  assert.deepEqual(result.data.services, []);
  assert.equal(result.data.profile.calendarColorMode, "location");
  assert.deepEqual(legacyData.appointments, []);
});

test("cattura snapshot senza mutare appuntamento o cataloghi", () => {
  const base = appointment();
  const originalLocation = location();
  const originalService = service(6500);
  const withLocation = withAppointmentLocation(base, originalLocation);
  const result = withAppointmentService(withLocation, originalService);

  const renamedLocation = { ...originalLocation, name: "Studio Nord" };
  const renamedService = { ...originalService, name: "Trattamento", defaultPriceCents: 7000 };
  assert.equal(result.locationNameSnapshot, "Studio Centro");
  assert.equal(result.serviceNameSnapshot, "Valutazione");
  assert.equal(result.duration, 60);
  assert.equal(result.effectivePriceCents, 6500);
  assert.equal(renamedLocation.name, "Studio Nord");
  assert.equal(renamedService.name, "Trattamento");
  assert.deepEqual(base, appointment());
});

test("propaga snapshot e valori effettivi a ogni occorrenza senza mutare l'originale", () => {
  const source = withAppointmentService(
    withAppointmentLocation(appointment(), location()),
    service(0),
  );
  const before = structuredClone(source);
  let sequence = 1;
  const occurrences = buildWeeklyAppointmentOccurrences(
    source,
    ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"],
    () => `appointment-${++sequence}`,
  );

  assert.equal(occurrences.length, 4);
  assert.deepEqual(occurrences.map((item) => item.id), [
    "appointment-1", "appointment-2", "appointment-3", "appointment-4",
  ]);
  assert.deepEqual(occurrences.map((item) => item.recurrencePosition), [0, 1, 2, 3]);
  for (const occurrence of occurrences) {
    assert.equal(occurrence.locationId, "location-1");
    assert.equal(occurrence.locationNameSnapshot, "Studio Centro");
    assert.equal(occurrence.serviceId, "service-1");
    assert.equal(occurrence.serviceNameSnapshot, "Valutazione");
    assert.equal(occurrence.effectivePriceCents, 0);
    assert.equal(occurrence.duration, 60);
  }
  assert.deepEqual(source, before);
});

test("rimuovere la prestazione conserva durata e prezzo effettivi", () => {
  const selected = withAppointmentService(appointment(), service(6500));
  const customized = { ...selected, duration: 75, effectivePriceCents: 7000 };
  const removed = withAppointmentService(customized, null);
  assert.equal(removed.serviceId, undefined);
  assert.equal(removed.serviceNameSnapshot, undefined);
  assert.equal(removed.duration, 75);
  assert.equal(removed.effectivePriceCents, 7000);
});

test("cambiare prestazione applica i nuovi default senza mutare il catalogo", () => {
  const first = withAppointmentService(appointment(), service(6500));
  const secondService = { ...service(0), id: "service-2", name: "Controllo", defaultDurationMinutes: 30 };
  const second = withAppointmentService({ ...first, duration: 90, effectivePriceCents: 9000 }, secondService);
  assert.equal(second.serviceId, "service-2");
  assert.equal(second.serviceNameSnapshot, "Controllo");
  assert.equal(second.duration, 30);
  assert.equal(second.effectivePriceCents, 0);
});

test("i selettori includono solo attivi e selezione corrente inattiva", () => {
  const inactiveLocation = { ...location(), id: "location-old", isActive: false };
  const inactiveService = { ...service(), id: "service-old", isActive: false };
  assert.deepEqual(selectableAppointmentLocations([location(), inactiveLocation], "location-old").map(item=>item.id), ["location-1", "location-old"]);
  assert.deepEqual(selectableAppointmentLocations([location(), inactiveLocation]).map(item=>item.id), ["location-1"]);
  assert.deepEqual(selectableAppointmentServices([service(), inactiveService], "service-old").map(item=>item.id), ["service-1", "service-old"]);
  assert.deepEqual(selectableAppointmentServices([service(), inactiveService]).map(item=>item.id), ["service-1"]);
});

test("form e dettaglio integrano i campi senza estendere Google o feed ICS", () => {
  const form = readFileSync(new URL("../components/appointment-form.tsx", import.meta.url), "utf8");
  const detail = readFileSync(new URL("../app/calendario/page.tsx", import.meta.url), "utf8");
  const google = readFileSync(new URL("../lib/google-calendar/event-details.ts", import.meta.url), "utf8");
  const ics = readFileSync(new URL("../lib/calendar-feed/ics.ts", import.meta.url), "utf8");
  assert.match(form, /buildWeeklyAppointmentOccurrences/);
  assert.match(form, /Sede \(facoltativa\)/);
  assert.match(form, /Prezzo \(facoltativo\)/);
  assert.match(detail, /Gratuito/);
  for (const source of [google, ics]) assert.doesNotMatch(source, /locationNameSnapshot|serviceNameSnapshot|effectivePriceCents/);
});

test("la migration impone ownership composita, RLS e resta additiva", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/018_calendar_locations_services_foundation.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /foreign key \(user_id, location_id\)[\s\S]*appointment_locations \(user_id, id\)[\s\S]*on delete restrict/i);
  assert.match(sql, /foreign key \(user_id, service_id\)[\s\S]*appointment_services \(user_id, id\)[\s\S]*on delete restrict/i);
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /using \(user_id = auth\.uid\(\)\)/g);
  assert.match(sql, /with check \(user_id = auth\.uid\(\)\)/g);
  assert.match(sql, /revoke all[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /\b(update|delete|truncate)\s+public\.appointments\b/i);
});

test("la migration 032 aggiunge e backfilla posizioni ricorrenza stabili senza cancellazioni", () => {
  const sql = readFileSync(new URL("../supabase/migrations/032_appointment_recurrence_position.sql", import.meta.url), "utf8");
  assert.match(sql, /^begin;/i);
  assert.match(sql, /add column recurrence_position integer null/i);
  assert.match(sql, /row_number\(\) over \([\s\S]*partition by recurrence_series_id[\s\S]*order by starts_at, id[\s\S]*\) - 1/i);
  assert.match(sql, /recurrence_position_rank::integer/i);
  assert.match(sql, /recurrence_position >= 0/i);
  assert.match(sql, /create unique index appointments_recurrence_series_position_unique[\s\S]*\(recurrence_series_id, recurrence_position\)[\s\S]*where recurrence_series_id is not null[\s\S]*recurrence_position is not null/i);
  assert.match(sql, /original occurrence order was never stored|originale/i);
  assert.match(sql, /commit;\s*$/i);
  assert.doesNotMatch(sql, /\b(delete|drop|truncate)\b/i);
});

test("la palette contiene dodici colori #RRGGBB univoci e desaturati", () => {
  assert.equal(CALENDAR_COLOR_PALETTE, LOCATION_COLOR_PALETTE);
  assert.equal(LOCATION_COLOR_PALETTE.length, 12);
  assert.equal(new Set(LOCATION_COLOR_PALETTE.map((color) => color.hex)).size, 12);
  for (const color of LOCATION_COLOR_PALETTE) assert.match(color.hex, /^#[0-9A-F]{6}$/);
});

test("le nuove prestazioni non ricevono colore automatico e possono tornare al colore sede", () => {
  assert.equal(nextCalendarColor([]), CALENDAR_COLOR_PALETTE[0].hex);
  assert.equal(nextCalendarColor([{ color: CALENDAR_COLOR_PALETTE[0].hex }]), CALENDAR_COLOR_PALETTE[1].hex);
  const source = readFileSync(new URL("../components/settings/services-settings.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /color: nextCalendarColor\(data\.services\)/);
  assert.match(source, /onClear=\{\(\) => setColor\(undefined\)\}/);
  assert.match(source, /Usa colore della sede|CalendarColorPicker/);
  assert.match(source, /CalendarColorPicker/);
});

test("la migration 030 è additiva e conserva i default legacy", () => {
  const sql = readFileSync(new URL("../supabase/migrations/030_calendar_service_colors.sql", import.meta.url), "utf8");
  assert.match(sql, /appointment_services[\s\S]*add column color text null/i);
  assert.match(sql, /color is null or color ~ '\^#\[0-9A-Fa-f\]\{6\}\$'/i);
  assert.match(sql, /calendar_color_mode text not null default 'location'/i);
  assert.match(sql, /calendar_color_mode in \('location', 'service'\)/i);
  assert.doesNotMatch(sql, /\b(update|delete|truncate)\b/i);
  assert.doesNotMatch(sql, /alter table public\.appointments/i);
});

test("le impostazioni non espongono più una modalità colore globale", () => {
  const panel = readFileSync(new URL("../components/calendar-settings-panel.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(panel, /Colora gli appuntamenti per|calendarColorMode|saveProfile/);
  assert.match(panel, /Sedi/);
  assert.match(panel, /Prestazioni/);
});

test("sceglie il primo colore libero e riutilizza deterministicamente la palette", () => {
  assert.equal(nextLocationColor([]), LOCATION_COLOR_PALETTE[0].hex);
  assert.equal(nextLocationColor([{ color: LOCATION_COLOR_PALETTE[0].hex }]), LOCATION_COLOR_PALETTE[1].hex);
  assert.equal(nextLocationColor(LOCATION_COLOR_PALETTE.map((color) => ({ color: color.hex }))), LOCATION_COLOR_PALETTE[0].hex);
});

test("converte euro e centesimi senza perdere zero o usare arrotondamenti", () => {
  assert.equal(euroInputToCents(""), undefined);
  assert.equal(euroInputToCents("0"), 0);
  assert.equal(euroInputToCents("45,70"), 4570);
  assert.equal(euroInputToCents("45.7"), 4570);
  assert.equal(centsToEuroInput(undefined), "");
  assert.equal(centsToEuroInput(0), "0,00");
  assert.equal(centsToEuroInput(4570), "45,70");
  assert.throws(() => euroInputToCents("12,345"), /prezzo valido/);
  assert.throws(() => euroInputToCents("21474836,48"), /troppo elevato/);
});

test("crea aggiorna disattiva e riattiva una sede senza mutare le liste precedenti", () => {
  const original = [];
  const created = upsertAppointmentLocation(original, location());
  const updated = upsertAppointmentLocation(created, { ...location(), name: "Studio Nord" });
  const inactive = upsertAppointmentLocation(updated, { ...updated[0], isActive: false });
  const active = upsertAppointmentLocation(inactive, { ...inactive[0], isActive: true });
  assert.equal(original.length, 0);
  assert.equal(created[0].name, "Studio Centro");
  assert.equal(updated[0].name, "Studio Nord");
  assert.equal(inactive[0].isActive, false);
  assert.equal(active[0].isActive, true);
});

test("crea aggiorna disattiva e riattiva una prestazione conservando NULL e zero", () => {
  const noPrice = { ...service(), defaultPriceCents: undefined };
  const created = upsertAppointmentService([], noPrice);
  const updated = upsertAppointmentService(created, { ...noPrice, name: "Controllo", defaultPriceCents: 0 });
  const inactive = upsertAppointmentService(updated, { ...updated[0], isActive: false });
  const active = upsertAppointmentService(inactive, { ...inactive[0], isActive: true });
  assert.equal(created[0].defaultPriceCents, undefined);
  assert.equal(updated[0].defaultPriceCents, 0);
  assert.equal(inactive[0].isActive, false);
  assert.equal(active[0].isActive, true);
});

test("impedisce di eliminare cataloghi referenziati senza alterare lo storico", () => {
  const historical = { ...appointment(), locationId: "location-1", serviceId: "service-1" };
  const locations = [location()];
  const services = [service()];
  assert.throws(() => removeAppointmentLocation(locations, [historical], "location-1"), /disattivarla/);
  assert.throws(() => removeAppointmentService(services, [historical], "service-1"), /disattivarla/);
  assert.deepEqual(locations, [location()]);
  assert.deepEqual(services, [service()]);
});

test("classifica il lifecycle catalogo con semantica clinica e data civile di Roma", () => {
  const appointments = [
    { ...appointment(), id: "past-done", date: "2026-10-01", locationId: "historical", serviceId: "historical" },
    { ...appointment(), id: "past-open", date: "2026-10-01", locationId: "open", serviceId: "open" },
    { ...appointment(), id: "future", date: "2026-10-06", locationId: "future", serviceId: "future" },
    { ...appointment(), id: "cancelled", date: "2026-10-06", type: "cancelled", locationId: "cancelled", serviceId: "cancelled" },
  ];
  const sessions = [{ id: "session-1", patientId: "patient-1", appointmentId: "past-done" }];
  const lifecycle = (id, archivedAt) => getCalendarCatalogLifecycle({
    kind: "location", id, archivedAt, appointments, sessions, currentRomeDate: "2026-10-05",
  });
  assert.deepEqual(lifecycle("unused"), { state: "unused", appointmentCount: 0, blockingAppointmentCount: 0 });
  assert.deepEqual(lifecycle("historical"), { state: "historical_only", appointmentCount: 1, blockingAppointmentCount: 0 });
  assert.equal(lifecycle("open").state, "operationally_used");
  assert.equal(lifecycle("future").state, "operationally_used");
  assert.equal(lifecycle("cancelled").state, "historical_only");
  assert.equal(lifecycle("historical", timestamp).state, "archived");
  assert.equal(calendarRomeDate(new Date("2026-10-04T22:30:00.000Z")), "2026-10-05");
});

test("archivia soltanto cataloghi historical_only e conserva record, colore e riferimenti", () => {
  const historical = { ...appointment(), id: "past-done", date: "2026-10-01", locationId: "location-1", serviceId: "service-1" };
  const sessions = [{ id: "session-1", patientId: "patient-1", appointmentId: "past-done" }];
  const archivedAt = "2026-10-05T12:00:00.000Z";
  const archivedLocations = archiveAppointmentLocation([location()], [historical], sessions, "location-1", archivedAt, "2026-10-05");
  const archivedServices = archiveAppointmentService([service()], [historical], sessions, "service-1", archivedAt, "2026-10-05");
  assert.equal(archivedLocations[0].archivedAt, archivedAt);
  assert.equal(archivedLocations[0].isActive, false);
  assert.equal(archivedLocations[0].color, "#3A7D68");
  assert.equal(archivedServices[0].archivedAt, archivedAt);
  assert.equal(getAppointmentDisplayColor(historical, archivedLocations, archivedServices), "#3A7D68");
  assert.equal(historical.locationId, "location-1");
  assert.equal(historical.serviceId, "service-1");
  assert.throws(() => archiveAppointmentLocation([location()], [{ ...historical, date: "2026-10-05" }], [], "location-1", archivedAt, "2026-10-05"), /archive_blocked/);
});

test("gli archived spariscono dalle nuove selezioni ma restano visibili sull'Appointment corrente", () => {
  const archivedLocation = { ...location(), id: "location-old", archivedAt: timestamp, isActive: false };
  const archivedService = { ...service(), id: "service-old", archivedAt: timestamp, isActive: false };
  assert.deepEqual(selectableAppointmentLocations([location(), archivedLocation]).map((item) => item.id), ["location-1"]);
  assert.deepEqual(selectableAppointmentServices([service(), archivedService]).map((item) => item.id), ["service-1"]);
  assert.deepEqual(selectableAppointmentLocations([location(), archivedLocation], "location-old").map((item) => item.id), ["location-1", "location-old"]);
  assert.deepEqual(selectableAppointmentServices([service(), archivedService], "service-old").map((item) => item.id), ["service-1", "service-old"]);
});

test("local mode conserva archivedAt senza rimuovere i cataloghi dallo storico", () => {
  const archivedAt = "2026-10-05T12:00:00.000Z";
  const base = readLocalData(null, () => ({
    patients: [], patientAdministrativeDetails: [], economicDocuments: [], economicDocumentLines: [], exerciseRecipes: [], worksheetTemplates: [], patientWorksheets: [], appointments: [],
    locations: [{ ...location(), archivedAt, isActive: false }], services: [{ ...service(), archivedAt, isActive: false }], sessions: [], payments: [], paymentAllocations: [], goals: [], materials: [], clinicalPathways: [], clinicalAssessments: [],
    profile: { firstName: "", lastName: "", profession: "", email: "", studio: "", calendarColorMode: "location" },
  })).data;
  const restored = readLocalData(serializeLocalData(base), () => { throw new Error("unexpected seed"); }).data;
  assert.equal(restored.locations[0].archivedAt, archivedAt);
  assert.equal(restored.services[0].archivedAt, archivedAt);
});

test("migration 033 è additiva, preserva FK e protegge archive e nuove referenze", () => {
  const sql = readFileSync(new URL("../supabase/migrations/033_calendar_catalog_archiving.sql", import.meta.url), "utf8");
  assert.match(sql, /begin;[\s\S]*commit;/i);
  assert.match(sql, /appointment_locations[\s\S]*add column archived_at timestamptz null/i);
  assert.match(sql, /appointment_services[\s\S]*add column archived_at timestamptz null/i);
  assert.match(sql, /create index sessions_user_appointment_idx\s+on public\.sessions \(user_id, appointment_id\)\s+where appointment_id is not null;/i);
  assert.match(sql, /security invoker/gi);
  assert.match(sql, /Europe\/Rome/g);
  assert.match(sql, /pg_advisory_xact_lock/g);
  assert.match(sql, /calendar_catalog_archive_blocked/);
  assert.match(sql, /before insert on public\.appointments/);
  assert.match(sql, /before update of location_id, service_id, starts_at, type on public\.appointments/);
  assert.doesNotMatch(sql, /alter table public\.appointments[\s\S]*foreign key/i);
  assert.doesNotMatch(sql, /delete from|update public\.appointments|set location_id\s*=|set service_id\s*=/i);
  assert.doesNotMatch(sql, /security definer/i);
});

test("migration 033 usa una sola semantica operativa e protegge Session delete e unlink", () => {
  const sql = readFileSync(new URL("../supabase/migrations/033_calendar_catalog_archiving.sql", import.meta.url), "utf8");
  const appointmentGuard = sql.slice(
    sql.indexOf("create function public.enforce_appointment_catalog_reference_guard"),
    sql.indexOf("create function public.enforce_session_catalog_reference_guard"),
  );
  const sessionGuard = sql.slice(
    sql.indexOf("create function public.enforce_session_catalog_reference_guard"),
    sql.indexOf("create trigger appointment_locations_archive_guard"),
  );

  assert.equal((sql.match(/p_type <> 'cancelled'/g) || []).length, 1);
  assert.match(sql, /create function public\.calendar_appointment_is_operational[\s\S]*Europe\/Rome[\s\S]*not exists[\s\S]*from public\.sessions/i);
  assert.match(appointmentGuard, /calendar_appointment_is_operational/);
  assert.match(appointmentGuard, /new\.location_id is distinct from old\.location_id/);
  assert.match(appointmentGuard, /new\.service_id is distinct from old\.service_id/);
  assert.ok(appointmentGuard.indexOf("calendar_catalog:location:") < appointmentGuard.indexOf("calendar_catalog:service:"));
  assert.match(sql, /create constraint trigger sessions_catalog_reference_delete_guard\s+after delete or update of appointment_id on public\.sessions\s+deferrable initially deferred/i);
  assert.match(sessionGuard, /old\.appointment_id is null/);
  assert.match(sessionGuard, /if not found then/);
  assert.match(sessionGuard, /calendar_appointment_is_operational/);
  assert.ok(sessionGuard.indexOf("calendar_catalog:location:") < sessionGuard.indexOf("calendar_catalog:service:"));
  assert.match(sessionGuard, /calendar_catalog_session_delete_blocked/);
  assert.match(sessionGuard, /calendar_catalog_session_unlink_blocked/);
});

test("migration 033 rende archived incompatibile con active e conserva restore inattivo", () => {
  const sql = readFileSync(new URL("../supabase/migrations/033_calendar_catalog_archiving.sql", import.meta.url), "utf8");
  assert.match(sql, /constraint appointment_locations_archived_inactive_check\s+check \(archived_at is null or is_active = false\)/i);
  assert.match(sql, /constraint appointment_services_archived_inactive_check\s+check \(archived_at is null or is_active = false\)/i);
  assert.match(sql, /if old\.archived_at is not null then\s+-- Restore[\s\S]*new\.is_active := false;/i);
});

test("migration 033 espone solo la helper operativa al ruolo applicativo authenticated", () => {
  const sql = readFileSync(new URL("../supabase/migrations/033_calendar_catalog_archiving.sql", import.meta.url), "utf8");
  const helper = sql.slice(
    sql.indexOf("create function public.calendar_appointment_is_operational"),
    sql.indexOf("create function public.enforce_calendar_catalog_archive_guard"),
  );
  assert.match(helper, /security invoker/i);
  assert.doesNotMatch(helper, /security definer/i);
  assert.match(sql, /revoke all on function public\.calendar_appointment_is_operational\(uuid, uuid, public\.appointment_type, timestamptz\) from public, anon, authenticated;/i);
  assert.match(sql, /grant execute on function public\.calendar_appointment_is_operational\(uuid, uuid, public\.appointment_type, timestamptz\) to authenticated;/i);
  assert.doesNotMatch(sql, /grant execute on function public\.calendar_appointment_is_operational\([^;]+\) to (?:public|anon|service_role)/i);
  for (const triggerFunction of [
    "enforce_calendar_catalog_archive_guard",
    "enforce_appointment_catalog_reference_guard",
    "enforce_session_catalog_reference_guard",
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${triggerFunction}\\(\\) from public, anon, authenticated;`, "i"));
    assert.doesNotMatch(sql, new RegExp(`grant execute on function public\\.${triggerFunction}\\(`, "i"));
  }
});

test("la semantica Session delete considera lo stato finale dell'Appointment", () => {
  const historical = { ...appointment(), id: "past", date: "2026-10-01", type: "regular" };
  const first = { id: "session-1", appointmentId: historical.id };
  const second = { id: "session-2", appointmentId: historical.id };
  assert.equal(isCalendarCatalogAppointmentBlocking(historical, [first], "2026-10-05"), false);
  assert.equal(isCalendarCatalogAppointmentBlocking(historical, [], "2026-10-05"), true);
  assert.equal(isCalendarCatalogAppointmentBlocking(historical, [second], "2026-10-05"), false);
  assert.equal(isCalendarCatalogAppointmentBlocking({ ...historical, type: "cancelled" }, [], "2026-10-05"), false);
});

test("le impostazioni espongono empty state e feedback non tecnici", () => {
  const locationsUi = readFileSync(new URL("../components/settings/locations-settings.tsx", import.meta.url), "utf8");
  const servicesUi = readFileSync(new URL("../components/settings/services-settings.tsx", import.meta.url), "utf8");
  assert.match(locationsUi, /Non hai ancora aggiunto sedi/);
  assert.match(servicesUi, /Non hai ancora aggiunto prestazioni/);
  assert.match(locationsUi, /filter\(\(item\) => !item\.archivedAt\)/);
  assert.match(servicesUi, /filter\(\(item\) => !item\.archivedAt\)/);
  assert.doesNotMatch(`${locationsUi}\n${servicesUi}`, /permission denied|violates foreign key|Supabase/);
});

test("il modal conserva il focus quando la callback onClose cambia identità", () => {
  const modal = readFileSync(new URL("../components/modal.tsx", import.meta.url), "utf8");
  assert.match(modal, /const onCloseRef = useRef\(onClose\)/);
  assert.match(modal, /onCloseRef\.current = onClose/);
  assert.doesNotMatch(modal, /\}, \[onClose\]\)/);
});

test("sedi e prestazioni vivono nel pannello Calendario senza duplicazione nelle Impostazioni", () => {
  const calendar = readFileSync(new URL("../app/calendario/page.tsx", import.meta.url), "utf8");
  const settings = readFileSync(new URL("../app/impostazioni/page.tsx", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../components/calendar-settings-panel.tsx", import.meta.url), "utf8");
  assert.match(calendar, /Impostazioni calendario/);
  assert.match(panel, /<LocationsSettings\/>/);
  assert.match(panel, /<ServicesSettings\/>/);
  assert.doesNotMatch(settings, /LocationsSettings|ServicesSettings/);
  assert.match(settings, /Google Calendar/);
  assert.match(settings, /CalendarFeedSettings/);
});
