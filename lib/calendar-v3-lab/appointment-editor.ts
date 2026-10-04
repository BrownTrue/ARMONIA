import {
  CALENDAR_LAB_CONFIG,
  minutesToTime,
  timeToMinutes,
  yToSnappedMinute,
  type CalendarDate,
} from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";
import { normalizeCalendarSelection, type CalendarSelection } from "./selection.ts";

export const CALENDAR_LAB_PATIENTS = Object.freeze([
  { id: "patient-mario", name: "Mario Rossi" },
  { id: "patient-giulia", name: "Giulia Bianchi" },
  { id: "patient-luca", name: "Luca Verdi" },
  { id: "patient-anna", name: "Anna Conti" },
]);

export const CALENDAR_LAB_SERVICES = Object.freeze([
  { id: "service-treatment", name: "Trattamento", defaultDuration: 45, color: "#77A886" },
  { id: "service-assessment", name: "Valutazione", defaultDuration: 60, color: "#D99B7B" },
  { id: "service-check", name: "Controllo", defaultDuration: 30, color: "#D6A84B" },
]);

export const CALENDAR_LAB_LOCATIONS = Object.freeze([
  { id: "location-center", name: "Studio Centro", color: "#8EA6C4" },
  { id: "location-north", name: "Studio Nord", color: "#A88BBC" },
]);

export type CalendarAppointmentDraft = {
  patientName: string;
  serviceName: string;
  locationName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  durationManuallyEdited: boolean;
};

export type CalendarAppointmentErrors = Partial<Record<
  "patientName" | "date" | "startTime" | "durationMinutes",
  string
>>;

export function selectionFromGridClick(
  date: CalendarDate,
  offsetY: number,
  pixelsPerMinute: number,
  durationMinutes = 45,
): CalendarSelection {
  const startMinutes = yToSnappedMinute(offsetY, pixelsPerMinute);
  return normalizeCalendarSelection(date, startMinutes, startMinutes + durationMinutes);
}

export function createAppointmentDraft(selection: CalendarSelection): CalendarAppointmentDraft {
  return {
    patientName: "",
    serviceName: "",
    locationName: "",
    date: selection.date,
    startTime: minutesToTime(selection.startMinutes),
    durationMinutes: selection.durationMinutes,
    durationManuallyEdited: false,
  };
}

export function appointmentDraftFromEvent(event: CalendarLabEvent): CalendarAppointmentDraft {
  return {
    patientName: event.patientName,
    serviceName: event.serviceName ?? "",
    locationName: event.locationName ?? "",
    date: event.date,
    startTime: minutesToTime(event.startMinutes),
    durationMinutes: event.endMinutes - event.startMinutes,
    durationManuallyEdited: false,
  };
}

export function updateDraftService(
  draft: CalendarAppointmentDraft,
  serviceName: string,
): CalendarAppointmentDraft {
  const service = CALENDAR_LAB_SERVICES.find((item) => item.name === serviceName);
  return {
    ...draft,
    serviceName,
    durationMinutes: service && !draft.durationManuallyEdited
      ? service.defaultDuration
      : draft.durationMinutes,
  };
}

export function updateDraftDuration(
  draft: CalendarAppointmentDraft,
  durationMinutes: number,
): CalendarAppointmentDraft {
  return { ...draft, durationMinutes, durationManuallyEdited: true };
}

export function validateAppointmentDraft(draft: CalendarAppointmentDraft): CalendarAppointmentErrors {
  const errors: CalendarAppointmentErrors = {};
  if (!CALENDAR_LAB_PATIENTS.some((patient) => patient.name === draft.patientName.trim())) {
    errors.patientName = "Seleziona un paziente dall’elenco.";
  }
  if (!isCalendarDate(draft.date)) errors.date = "Inserisci una data valida.";

  let startMinutes: number | undefined;
  try {
    startMinutes = timeToMinutes(draft.startTime);
    if (
      startMinutes < CALENDAR_LAB_CONFIG.startHour * 60 ||
      startMinutes >= CALENDAR_LAB_CONFIG.endHour * 60 ||
      startMinutes % CALENDAR_LAB_CONFIG.slotMinutes !== 0
    ) errors.startTime = "Scegli un orario ogni 15 minuti tra le 07:00 e le 20:45.";
  } catch {
    errors.startTime = "Inserisci un orario valido.";
  }

  if (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes < 15 || draft.durationMinutes % 15 !== 0) {
    errors.durationMinutes = "La durata deve essere di almeno 15 minuti, a intervalli di 15.";
  } else if (startMinutes !== undefined && startMinutes + draft.durationMinutes > CALENDAR_LAB_CONFIG.endHour * 60) {
    errors.durationMinutes = "L’appuntamento deve terminare entro le 21:00.";
  }
  return errors;
}

export function eventFromAppointmentDraft(
  draft: CalendarAppointmentDraft,
  id: string,
  existing?: CalendarLabEvent,
): CalendarLabEvent {
  const service = CALENDAR_LAB_SERVICES.find((item) => item.name === draft.serviceName);
  const location = CALENDAR_LAB_LOCATIONS.find((item) => item.name === draft.locationName);
  const startMinutes = timeToMinutes(draft.startTime);
  return {
    id,
    patientName: draft.patientName.trim(),
    date: draft.date as CalendarDate,
    startMinutes,
    endMinutes: startMinutes + draft.durationMinutes,
    status: existing?.status ?? "scheduled",
    sessionState: existing?.sessionState ?? "to_register",
    serviceName: service?.name,
    serviceColor: service?.color,
    locationName: location?.name,
    locationColor: location?.color,
  };
}

export function nextCalendarLabEventId(events: readonly CalendarLabEvent[]): string {
  const used = new Set(events.map((event) => event.id));
  let index = 1;
  while (used.has(`lab-local-${index}`)) index += 1;
  return `lab-local-${index}`;
}

export function calendarLabSessionLabel(event: CalendarLabEvent): string {
  if (event.status === "cancelled") return "Annullato";
  return event.sessionState === "registered" ? "✓ Seduta registrata" : "• Da registrare";
}

export type CalendarLabEventContentDensity = "name" | "time" | "service" | "details";

export function calendarLabEventContentDensity(
  durationMinutes: number,
  narrowCluster = false,
): CalendarLabEventContentDensity {
  if (narrowCluster || durationMinutes <= 30) return "name";
  if (durationMinutes <= 60) return "time";
  if (durationMinutes <= 90) return "service";
  return "details";
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3]);
}
