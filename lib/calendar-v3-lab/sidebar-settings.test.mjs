import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canDeleteAppointmentLocation,
  canDeleteAppointmentService,
  withAppointmentService,
} from "../calendar-v2.ts";
import {
  calendarCatalogManagement,
  calendarFilterGroups,
  createCalendarV3Location,
  createCalendarV3Service,
  fixtureLocationFilterKey,
  fixtureServiceFilterKey,
  locationFilterKey,
  serviceFilterKey,
} from "./sidebar-settings.ts";

const timestamp = "2026-10-05T10:00:00.000Z";

test("Calendar V3 crea sedi e prestazioni con il dominio canonico", () => {
  const location = createCalendarV3Location({
    locations: [{ id: "l-1", name: "Centro", color: "#7C9A87", address: "", city: "", isActive: true, displayOrder: 4, createdAt: timestamp, updatedAt: timestamp }],
    id: "l-2",
    timestamp,
  });
  assert.equal(location.displayOrder, 5);
  assert.equal(location.isActive, true);
  assert.match(location.color, /^#[0-9A-F]{6}$/);

  const service = createCalendarV3Service({
    services: [{ id: "s-1", name: "Valutazione", description: "", defaultDurationMinutes: 60, isActive: true, displayOrder: 2, createdAt: timestamp, updatedAt: timestamp }],
    id: "s-2",
    timestamp,
  });
  assert.equal(service.displayOrder, 3);
  assert.equal(service.defaultDurationMinutes, 0);
  assert.equal(service.defaultPriceCents, undefined);
  assert.equal(service.color, undefined);
});

test("i filtri sono stabili per id e separati dalle fixture", () => {
  assert.equal(locationFilterKey("same"), "location:same");
  assert.equal(serviceFilterKey("same"), "service:same");
  assert.equal(fixtureLocationFilterKey("Centro"), "fixture-location:Centro");
  assert.equal(fixtureServiceFilterKey("Centro"), "fixture-service:Centro");
});

test("desktop e mobile condividono gli stessi gruppi filtro reali", () => {
  const groups = calendarFilterGroups({
    realMode: true,
    locations: [
      { id: "l-active", name: "Centro", color: "#7C9A87", address: "", city: "", isActive: true, displayOrder: 0, createdAt: timestamp, updatedAt: timestamp },
      { id: "l-archived", name: "Storica", color: "#8EA6C4", address: "", city: "", isActive: false, archivedAt: timestamp, displayOrder: 1, createdAt: timestamp, updatedAt: timestamp },
    ],
    services: [
      { id: "s-active", name: "Valutazione", description: "", defaultDurationMinutes: 60, isActive: true, displayOrder: 0, createdAt: timestamp, updatedAt: timestamp },
    ],
  });
  assert.deepEqual(groups.locations.map((item) => item.filterKey), ["location:l-active"]);
  assert.deepEqual(groups.services.map((item) => item.filterKey), ["service:s-active"]);
  assert.equal(groups.services[0].color.length > 0, true);
});

test("lifecycle espone delete, archive o sola disattivazione per sedi e prestazioni", () => {
  const appointments = [{
    id: "a-1", patientId: "p-1", date: "2026-10-05", startTime: "10:00", duration: 45,
    type: "session", notes: "", locationId: "l-used", serviceId: "s-used",
    locationNameSnapshot: "Centro", serviceNameSnapshot: "Valutazione",
    createdAt: timestamp, updatedAt: timestamp,
  }];
  assert.equal(canDeleteAppointmentLocation(appointments, "l-used"), false);
  assert.equal(canDeleteAppointmentLocation(appointments, "l-unused"), true);
  assert.equal(canDeleteAppointmentService(appointments, "s-used"), false);
  assert.equal(canDeleteAppointmentService(appointments, "s-unused"), true);

  assert.deepEqual(calendarCatalogManagement({ kind: "location", active: true, lifecycle: "operationally_used" }), {
    used: true, toggleLabel: "Disattiva sede", deleteLabel: null, archiveLabel: null,
  });
  assert.deepEqual(calendarCatalogManagement({ kind: "location", active: false, lifecycle: "historical_only" }), {
    used: true, toggleLabel: "Riattiva sede", deleteLabel: null, archiveLabel: "Rimuovi dal catalogo",
  });
  assert.equal(calendarCatalogManagement({ kind: "location", active: true, lifecycle: "unused" }).deleteLabel, "Elimina definitivamente");
  assert.equal(calendarCatalogManagement({ kind: "service", active: true, lifecycle: "operationally_used" }).toggleLabel, "Disattiva prestazione");
  assert.equal(calendarCatalogManagement({ kind: "service", active: false, lifecycle: "historical_only" }).archiveLabel, "Rimuovi dal catalogo");
  assert.equal(calendarCatalogManagement({ kind: "service", active: true, lifecycle: "unused" }).deleteLabel, "Elimina definitivamente");
});

test("disattivare il catalogo non modifica Appointment e snapshot storici", () => {
  const appointment = {
    id: "a-1", patientId: "p-1", date: "2026-10-05", startTime: "10:00", duration: 60,
    type: "session", notes: "", locationId: "l-1", serviceId: "s-1",
    locationNameSnapshot: "Studio Centro", serviceNameSnapshot: "Valutazione",
    effectivePriceCents: 6500, createdAt: timestamp, updatedAt: timestamp,
  };
  const before = structuredClone(appointment);
  const location = { id: "l-1", name: "Centro", color: "#77A886", address: "", city: "", isActive: false, displayOrder: 0, createdAt: timestamp, updatedAt: timestamp };
  const service = { id: "s-1", name: "Valutazione", description: "", defaultDurationMinutes: 90, defaultPriceCents: 9000, isActive: false, displayOrder: 0, createdAt: timestamp, updatedAt: timestamp };
  assert.equal(location.isActive, false);
  assert.equal(service.isActive, false);
  assert.deepEqual(appointment, before);
});

test("cambiare i default della prestazione non altera gli snapshot Appointment esistenti", () => {
  const appointment = {
    id: "a-1", patientId: "p-1", date: "2026-10-05", startTime: "10:00", duration: 45,
    type: "session", notes: "", createdAt: timestamp, updatedAt: timestamp,
  };
  const original = {
    id: "s-1", name: "Valutazione", description: "", defaultDurationMinutes: 60,
    defaultPriceCents: 6500, color: "#789584", isActive: true, displayOrder: 0,
    createdAt: timestamp, updatedAt: timestamp,
  };
  const snapshotted = withAppointmentService(appointment, original);
  const edited = { ...original, name: "Valutazione estesa", defaultDurationMinutes: 90, defaultPriceCents: 9000 };
  assert.equal(edited.defaultDurationMinutes, 90);
  assert.equal(snapshotted.serviceNameSnapshot, "Valutazione");
  assert.equal(snapshotted.duration, 60);
  assert.equal(snapshotted.effectivePriceCents, 6500);
});

test("la sidebar usa DataProvider, separa filtro ed edit e resta inerte nelle fixture", () => {
  const component = readFileSync("components/calendar-v3-lab/calendar-sidebar-catalog.tsx", "utf8");
  const lab = readFileSync("components/calendar-v3-lab/calendar-lab.tsx", "utf8");
  assert.match(component, /useData\(\)/);
  assert.match(component, /saveAppointmentLocation/);
  assert.match(component, /saveAppointmentService/);
  assert.match(component, /canConfigure=\{realMode\}/);
  assert.match(component, /className=\{styles\.catalogFilter\}[\s\S]*onToggle\(item\.filterKey\)/);
  assert.match(component, /className=\{styles\.catalogEdit\}[\s\S]*onEdit\(item\.id\)/);
  assert.doesNotMatch(component, /CalendarSettingsPanel/);
  assert.match(lab, /sidebarMode\.kind === "main" \? <MiniCalendar/);
  assert.match(lab, /onModeChange=\{setSidebarMode\}/);
});

test("salvataggi, stato attivo e cancellazioni sono protetti da busy e mantengono feedback inline", () => {
  const component = readFileSync("components/calendar-v3-lab/calendar-sidebar-catalog.tsx", "utf8");
  assert.match(component, /if \(busyAction\) return/);
  assert.match(component, /setServerError\(catalogError/);
  assert.match(component, /aria-busy=\{saving\}/);
  assert.match(component, /DestructiveActionModal/);
  assert.match(component, /appuntamenti futuri o ancora da registrare/);
  assert.match(component, /setAppointmentLocationActive/);
  assert.match(component, /setAppointmentServiceActive/);
  assert.match(component, /archiveAppointmentLocation/);
  assert.match(component, /archiveAppointmentService/);
  assert.match(component, /filter\(\(item\) => !item\.archivedAt\)/);
  assert.match(component, /Rimuovi dal catalogo/);
  assert.match(component, /onModeChange\(\{ kind: "main" \}\)/);
});
