import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildWeeklyAppointmentOccurrences,
  centsToEuroInput,
  euroInputToCents,
  LOCATION_COLOR_PALETTE,
  nextLocationColor,
  removeAppointmentLocation,
  removeAppointmentService,
  upsertAppointmentLocation,
  upsertAppointmentService,
  withAppointmentLocation,
  withAppointmentService,
  selectableAppointmentLocations,
  selectableAppointmentServices,
} from "./calendar-v2.ts";
import { readLocalData } from "./data/local-store.ts";
import {
  appointmentFromRow,
  appointmentLocationFromRow,
  appointmentLocationRow,
  appointmentRow,
  appointmentServiceFromRow,
  appointmentServiceRow,
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
  const mapped = appointmentFromRow({ ...row, created_at: timestamp });
  assert.equal(mapped.effectivePriceCents, 0);
  assert.equal(mapped.locationNameSnapshot, "Studio Centro");

  const emptyRow = appointmentRow(appointment(), "user-1");
  assert.equal(emptyRow.location_id, null);
  assert.equal(emptyRow.service_id, null);
  assert.equal(emptyRow.effective_price_cents, null);
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

test("la palette contiene dodici colori #RRGGBB univoci e desaturati", () => {
  assert.equal(LOCATION_COLOR_PALETTE.length, 12);
  assert.equal(new Set(LOCATION_COLOR_PALETTE.map((color) => color.hex)).size, 12);
  for (const color of LOCATION_COLOR_PALETTE) assert.match(color.hex, /^#[0-9A-F]{6}$/);
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

test("le impostazioni espongono empty state e feedback non tecnici", () => {
  const locationsUi = readFileSync(new URL("../components/settings/locations-settings.tsx", import.meta.url), "utf8");
  const servicesUi = readFileSync(new URL("../components/settings/services-settings.tsx", import.meta.url), "utf8");
  assert.match(locationsUi, /Non hai ancora aggiunto sedi/);
  assert.match(servicesUi, /Non hai ancora aggiunto prestazioni/);
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
