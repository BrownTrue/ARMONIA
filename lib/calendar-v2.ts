import type { Appointment, AppointmentLocation, AppointmentService, Session } from "./types";

export const CALENDAR_COLOR_PALETTE = [
  { name: "Salvia", hex: "#77A886" },
  { name: "Lavanda", hex: "#9B8CC4" },
  { name: "Azzurro polvere", hex: "#70A6C2" },
  { name: "Pesca", hex: "#E19A75" },
  { name: "Rosa cipria", hex: "#D58FA0" },
  { name: "Crema", hex: "#D3B267" },
  { name: "Menta", hex: "#65B59B" },
  { name: "Carta da zucchero", hex: "#668FB3" },
  { name: "Terracotta chiara", hex: "#C77F67" },
  { name: "Grigio lilla", hex: "#9C91AC" },
  { name: "Verde eucalipto", hex: "#5F9B88" },
  { name: "Malva", hex: "#B477A0" },
] as const;
export const LOCATION_COLOR_PALETTE = CALENDAR_COLOR_PALETTE;

const MAX_DATABASE_PRICE_CENTS = 2_147_483_647;

export function nextCalendarColor(items: { color?: string | null }[]): string {
  const used = new Set(items.flatMap((item) => item.color ? [item.color.toUpperCase()] : []));
  return CALENDAR_COLOR_PALETTE.find((color) => !used.has(color.hex))?.hex
    ?? CALENDAR_COLOR_PALETTE[items.length % CALENDAR_COLOR_PALETTE.length].hex;
}
export const nextLocationColor = nextCalendarColor;

export function euroInputToCents(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Inserisci un prezzo valido con al massimo due decimali.");
  const [euros, decimals = ""] = normalized.split(".");
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_DATABASE_PRICE_CENTS) throw new Error("Il prezzo inserito è troppo elevato.");
  return cents;
}

export function centsToEuroInput(cents: number | undefined): string {
  if (cents === undefined) return "";
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function upsertAppointmentLocation(locations: AppointmentLocation[], location: AppointmentLocation): AppointmentLocation[] {
  return locations.some((item) => item.id === location.id)
    ? locations.map((item) => item.id === location.id ? location : item)
    : [location, ...locations];
}

export function upsertAppointmentService(services: AppointmentService[], service: AppointmentService): AppointmentService[] {
  return services.some((item) => item.id === service.id)
    ? services.map((item) => item.id === service.id ? service : item)
    : [service, ...services];
}

export function canDeleteAppointmentLocation(appointments: readonly Appointment[], id: string): boolean {
  return !appointments.some((item) => item.locationId === id);
}

export function canDeleteAppointmentService(appointments: readonly Appointment[], id: string): boolean {
  return !appointments.some((item) => item.serviceId === id);
}

export type CalendarCatalogLifecycleState = "unused" | "historical_only" | "operationally_used" | "archived";

export type CalendarCatalogLifecycle = {
  state: CalendarCatalogLifecycleState;
  appointmentCount: number;
  blockingAppointmentCount: number;
};

export function calendarRomeDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function isCalendarCatalogAppointmentBlocking(
  appointment: Appointment,
  sessions: readonly Session[],
  currentRomeDate: string,
): boolean {
  if (appointment.type === "cancelled") return false;
  const hasSession = sessions.some((session) => session.appointmentId === appointment.id);
  return appointment.date >= currentRomeDate || !hasSession;
}

export function getCalendarCatalogLifecycle(input: {
  kind: "location" | "service";
  id: string;
  archivedAt?: string;
  appointments: readonly Appointment[];
  sessions: readonly Session[];
  currentRomeDate?: string;
}): CalendarCatalogLifecycle {
  const references = input.appointments.filter((appointment) =>
    input.kind === "location" ? appointment.locationId === input.id : appointment.serviceId === input.id);
  const blockingAppointmentCount = references.filter((appointment) =>
    isCalendarCatalogAppointmentBlocking(appointment, input.sessions, input.currentRomeDate ?? calendarRomeDate())).length;
  return {
    state: input.archivedAt
      ? "archived"
      : references.length === 0
        ? "unused"
        : blockingAppointmentCount > 0
          ? "operationally_used"
          : "historical_only",
    appointmentCount: references.length,
    blockingAppointmentCount,
  };
}

function archiveCatalogItem<T extends { id: string; archivedAt?: string; isActive: boolean; updatedAt: string }>(
  items: T[],
  item: T,
  lifecycle: CalendarCatalogLifecycle,
  archivedAt: string,
): T[] {
  if (lifecycle.state === "operationally_used") {
    throw new Error(`calendar_catalog_archive_blocked:${lifecycle.blockingAppointmentCount}`);
  }
  if (lifecycle.state !== "historical_only") {
    throw new Error("calendar_catalog_archive_not_historical");
  }
  return items.map((current) => current.id === item.id
    ? { ...current, archivedAt, isActive: false, updatedAt: archivedAt }
    : current);
}

export function archiveAppointmentLocation(
  locations: AppointmentLocation[],
  appointments: readonly Appointment[],
  sessions: readonly Session[],
  id: string,
  archivedAt: string,
  currentRomeDate = calendarRomeDate(),
): AppointmentLocation[] {
  const location = locations.find((item) => item.id === id);
  if (!location) throw new Error("Sede non trovata.");
  return archiveCatalogItem(locations, location, getCalendarCatalogLifecycle({
    kind: "location", id, archivedAt: location.archivedAt, appointments, sessions, currentRomeDate,
  }), archivedAt);
}

export function archiveAppointmentService(
  services: AppointmentService[],
  appointments: readonly Appointment[],
  sessions: readonly Session[],
  id: string,
  archivedAt: string,
  currentRomeDate = calendarRomeDate(),
): AppointmentService[] {
  const service = services.find((item) => item.id === id);
  if (!service) throw new Error("Prestazione non trovata.");
  return archiveCatalogItem(services, service, getCalendarCatalogLifecycle({
    kind: "service", id, archivedAt: service.archivedAt, appointments, sessions, currentRomeDate,
  }), archivedAt);
}

export function removeAppointmentLocation(
  locations: AppointmentLocation[],
  appointments: Appointment[],
  id: string,
): AppointmentLocation[] {
  if (!canDeleteAppointmentLocation(appointments, id)) {
    throw new Error("Questa sede è già collegata ad alcuni appuntamenti. Puoi disattivarla invece di eliminarla.");
  }
  return locations.filter((item) => item.id !== id);
}

export function removeAppointmentService(
  services: AppointmentService[],
  appointments: Appointment[],
  id: string,
): AppointmentService[] {
  if (!canDeleteAppointmentService(appointments, id)) {
    throw new Error("Questa prestazione è già collegata ad alcuni appuntamenti. Puoi disattivarla invece di eliminarla.");
  }
  return services.filter((item) => item.id !== id);
}

export function withAppointmentLocation(appointment: Appointment, location: AppointmentLocation | null): Appointment {
  return {
    ...appointment,
    locationId: location?.id,
    locationNameSnapshot: location?.name,
  };
}

export function withAppointmentService(appointment: Appointment, service: AppointmentService | null): Appointment {
  if (!service) {
    return {
      ...appointment,
      serviceId: undefined,
      serviceNameSnapshot: undefined,
    };
  }
  return {
    ...appointment,
    serviceId: service.id,
    serviceNameSnapshot: service.name,
    duration: service.defaultDurationMinutes,
    effectivePriceCents: service.defaultPriceCents,
  };
}

export function selectableAppointmentLocations(locations: AppointmentLocation[], currentId?: string): AppointmentLocation[] {
  return locations.filter((location) => !location.archivedAt
    ? location.isActive || location.id === currentId
    : location.id === currentId);
}

export function selectableAppointmentServices(services: AppointmentService[], currentId?: string): AppointmentService[] {
  return services.filter((service) => !service.archivedAt
    ? service.isActive || service.id === currentId
    : service.id === currentId);
}

export function buildWeeklyAppointmentOccurrences(
  appointment: Appointment,
  dates: string[],
  createId: () => string,
): Appointment[] {
  return dates.map((date, index) => ({
    ...appointment,
    id: index === 0 ? appointment.id : createId(),
    date,
    recurrencePosition: index,
  }));
}
