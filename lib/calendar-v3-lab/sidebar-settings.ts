import { nextCalendarColor } from "../calendar-v2.ts";
import type { CalendarCatalogLifecycleState } from "../calendar-v2.ts";
import type { AppointmentLocation, AppointmentService } from "../types.ts";

export type CalendarSidebarMode =
  | { kind: "main" }
  | { kind: "location-create"; location: AppointmentLocation }
  | { kind: "location-edit"; location: AppointmentLocation }
  | { kind: "service-create"; service: AppointmentService }
  | { kind: "service-edit"; service: AppointmentService };

export const locationFilterKey = (id: string) => `location:${id}`;
export const serviceFilterKey = (id: string) => `service:${id}`;
export const fixtureLocationFilterKey = (name: string) => `fixture-location:${name}`;
export const fixtureServiceFilterKey = (name: string) => `fixture-service:${name}`;

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
