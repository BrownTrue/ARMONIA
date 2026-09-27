import type { Appointment, AppointmentLocation, AppointmentService } from "./types";

export const LOCATION_COLOR_PALETTE = [
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

const MAX_DATABASE_PRICE_CENTS = 2_147_483_647;

export function nextLocationColor(locations: Pick<AppointmentLocation, "color">[]): string {
  const used = new Set(locations.map((location) => location.color.toUpperCase()));
  return LOCATION_COLOR_PALETTE.find((color) => !used.has(color.hex))?.hex
    ?? LOCATION_COLOR_PALETTE[locations.length % LOCATION_COLOR_PALETTE.length].hex;
}

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

export function removeAppointmentLocation(
  locations: AppointmentLocation[],
  appointments: Appointment[],
  id: string,
): AppointmentLocation[] {
  if (appointments.some((item) => item.locationId === id)) {
    throw new Error("Questa sede è già collegata ad alcuni appuntamenti. Puoi disattivarla invece di eliminarla.");
  }
  return locations.filter((item) => item.id !== id);
}

export function removeAppointmentService(
  services: AppointmentService[],
  appointments: Appointment[],
  id: string,
): AppointmentService[] {
  if (appointments.some((item) => item.serviceId === id)) {
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
  return locations.filter((location) => location.isActive || location.id === currentId);
}

export function selectableAppointmentServices(services: AppointmentService[], currentId?: string): AppointmentService[] {
  return services.filter((service) => service.isActive || service.id === currentId);
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
  }));
}
