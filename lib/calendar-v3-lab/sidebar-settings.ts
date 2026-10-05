import { nextCalendarColor } from "../calendar-v2.ts";
import type { CalendarCatalogLifecycleState } from "../calendar-v2.ts";
import type { AppointmentLocation, AppointmentService } from "../types.ts";
import { FALLBACK_APPOINTMENT_COLOR } from "../calendar-visual.ts";

export type CalendarSidebarMode =
  | { kind: "main" }
  | { kind: "locations" }
  | { kind: "services" }
  | { kind: "google" }
  | { kind: "location-create"; location: AppointmentLocation }
  | { kind: "location-edit"; location: AppointmentLocation }
  | { kind: "service-create"; service: AppointmentService }
  | { kind: "service-edit"; service: AppointmentService };

export const locationFilterKey = (id: string) => `location:${id}`;
export const serviceFilterKey = (id: string) => `service:${id}`;
export const fixtureLocationFilterKey = (name: string) => `fixture-location:${name}`;
export const fixtureServiceFilterKey = (name: string) => `fixture-service:${name}`;

export type CalendarFilterItem = {
  id: string;
  label: string;
  color: string;
  active: boolean;
  filterKey: string;
};

export const CALENDAR_FIXTURE_LOCATIONS = [
  { id: "fixture-location-centro", name: "Studio Centro", color: "#8EA6C4" },
  { id: "fixture-location-nord", name: "Studio Nord", color: "#A88BBC" },
] as const;

export const CALENDAR_FIXTURE_SERVICES = [
  { id: "fixture-service-trattamento", name: "Trattamento", color: "#77A886" },
  { id: "fixture-service-valutazione", name: "Valutazione", color: "#D99B7B" },
  { id: "fixture-service-controllo", name: "Controllo", color: "#D6A84B" },
] as const;

export function calendarFilterGroups(input: {
  realMode: boolean;
  locations: readonly AppointmentLocation[];
  services: readonly AppointmentService[];
}): { locations: CalendarFilterItem[]; services: CalendarFilterItem[] } {
  const locations = input.realMode
    ? input.locations.filter((item) => !item.archivedAt).sort(catalogOrder)
    : [...CALENDAR_FIXTURE_LOCATIONS];
  const services = input.realMode
    ? input.services.filter((item) => !item.archivedAt).sort(catalogOrder)
    : [...CALENDAR_FIXTURE_SERVICES];
  return {
    locations: locations.map((item) => ({
      id: item.id,
      label: item.name,
      color: item.color,
      active: "isActive" in item ? Boolean(item.isActive) : true,
      filterKey: input.realMode ? locationFilterKey(item.id) : fixtureLocationFilterKey(item.name),
    })),
    services: services.map((item) => ({
      id: item.id,
      label: item.name,
      color: item.color || FALLBACK_APPOINTMENT_COLOR,
      active: "isActive" in item ? Boolean(item.isActive) : true,
      filterKey: input.realMode ? serviceFilterKey(item.id) : fixtureServiceFilterKey(item.name),
    })),
  };
}

function catalogOrder<T extends { displayOrder?: number; name: string }>(a: T, b: T) {
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name, "it");
}

export function calendarCatalogManagement(input: {
  kind: "location" | "service";
  active: boolean;
  lifecycle: CalendarCatalogLifecycleState;
}) {
  const noun = input.kind === "location" ? "sede" : "prestazione";
  return {
    used: input.lifecycle !== "unused",
    toggleLabel: `${input.active ? "Disattiva" : "Riattiva"} ${noun}`,
    deleteLabel: input.lifecycle === "unused" ? "Elimina definitivamente" : null,
    archiveLabel: input.lifecycle === "historical_only" ? "Rimuovi dal catalogo" : null,
  } as const;
}

export function createCalendarV3Location(input: {
  locations: readonly AppointmentLocation[];
  id: string;
  timestamp: string;
}): AppointmentLocation {
  return {
    id: input.id,
    name: "",
    address: "",
    city: "",
    color: nextCalendarColor([...input.locations]),
    isActive: true,
    displayOrder: input.locations.reduce((maximum, item) => Math.max(maximum, item.displayOrder), -1) + 1,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  };
}

export function createCalendarV3Service(input: {
  services: readonly AppointmentService[];
  id: string;
  timestamp: string;
}): AppointmentService {
  return {
    id: input.id,
    name: "",
    description: "",
    defaultDurationMinutes: 0,
    defaultPriceCents: undefined,
    color: undefined,
    isActive: true,
    displayOrder: input.services.reduce((maximum, item) => Math.max(maximum, item.displayOrder), -1) + 1,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
  };
}
