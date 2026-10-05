import { getAppointmentDisplayColor } from "../calendar-visual.ts";
import type {
  Appointment,
  AppointmentLocation,
  AppointmentService,
  Patient,
  Session,
} from "../types.ts";
import { fullName } from "../types.ts";
import type { CalendarDate } from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export type CalendarV3RealIndexes = {
  patientById: Map<string, Patient>;
  locationById: Map<string, AppointmentLocation>;
  serviceById: Map<string, AppointmentService>;
  sessionByAppointmentId: Map<string, Session>;
  eventsByDate: Map<CalendarDate, CalendarLabEvent[]>;
};

export type CalendarV3RealData = {
  events: CalendarLabEvent[];
  locations: AppointmentLocation[];
  services: AppointmentService[];
  indexes: CalendarV3RealIndexes;
  skippedAppointmentIds: string[];
};

export function calendarV3MinutesFromCivilTime(time: string): number | null {
  const match = TIME_PATTERN.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isCalendarV3CivilDate(date: string): date is CalendarDate {
  const match = DATE_PATTERN.exec(date);
  if (!match) return false;
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return parsed.getUTCFullYear() === Number(match[1]) &&
    parsed.getUTCMonth() + 1 === Number(match[2]) &&
    parsed.getUTCDate() === Number(match[3]);
}

export function createCalendarV3RealIndexes(input: {
  patients: readonly Patient[];
  locations: readonly AppointmentLocation[];
  services: readonly AppointmentService[];
  sessions: readonly Session[];
}): Omit<CalendarV3RealIndexes, "eventsByDate"> {
  return {
    patientById: new Map(input.patients.map((patient) => [patient.id, patient])),
    locationById: new Map(input.locations.map((location) => [location.id, location])),
    serviceById: new Map(input.services.map((service) => [service.id, service])),
    sessionByAppointmentId: new Map(
      input.sessions.flatMap((session) => session.appointmentId ? [[session.appointmentId, session] as const] : []),
    ),
  };
}

export function calendarV3EventFromAppointment(
  appointment: Appointment,
  context: {
    patientById: ReadonlyMap<string, Patient>;
    locationById: ReadonlyMap<string, AppointmentLocation>;
    serviceById: ReadonlyMap<string, AppointmentService>;
    sessionByAppointmentId: ReadonlyMap<string, Session>;
    locations: readonly AppointmentLocation[];
    services: readonly AppointmentService[];
  },
): CalendarLabEvent | null {
  const startMinutes = calendarV3MinutesFromCivilTime(appointment.time);
  if (!isCalendarV3CivilDate(appointment.date) || startMinutes === null || !Number.isFinite(appointment.duration) || appointment.duration <= 0) {
    return null;
  }
  const patient = context.patientById.get(appointment.patientId);
  const location = appointment.locationId ? context.locationById.get(appointment.locationId) : undefined;
  const service = appointment.serviceId ? context.serviceById.get(appointment.serviceId) : undefined;
  const duration = Math.max(1, Math.round(appointment.duration));
  const patientName = patient ? fullName(patient).trim() : "";
  return {
    id: appointment.id,
    source: "real",
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: patientName || (patient ? "Paziente senza nome" : "Paziente non disponibile"),
    date: appointment.date,
    startMinutes,
    endMinutes: startMinutes + duration,
    status: appointment.type === "cancelled" ? "cancelled" : "scheduled",
    sessionState: context.sessionByAppointmentId.has(appointment.id) ? "registered" : "to_register",
    serviceName: appointment.serviceNameSnapshot?.trim() || service?.name || undefined,
    serviceColor: service?.color,
    locationName: appointment.locationNameSnapshot?.trim() || location?.name || undefined,
    locationColor: location?.color,
    appointmentType: appointment.type,
    notes: appointment.notes?.trim() || undefined,
    locationId: appointment.locationId,
    serviceId: appointment.serviceId,
    effectivePriceCents: appointment.effectivePriceCents,
    recurrenceSeriesId: appointment.recurrenceSeriesId,
    isRecurring: Boolean(appointment.recurrenceSeriesId),
    createdAt: appointment.createdAt,
    displayColor: getAppointmentDisplayColor(appointment, [...context.locations], [...context.services]),
  };
}

export function adaptCalendarV3RealData(input: {
  appointments: readonly Appointment[];
  patients: readonly Patient[];
  locations: readonly AppointmentLocation[];
  services: readonly AppointmentService[];
  sessions: readonly Session[];
}): CalendarV3RealData {
  const baseIndexes = createCalendarV3RealIndexes(input);
  const skippedAppointmentIds: string[] = [];
  const events = input.appointments.flatMap((appointment) => {
    const event = calendarV3EventFromAppointment(appointment, {
      ...baseIndexes,
      locations: input.locations,
      services: input.services,
    });
    if (!event) skippedAppointmentIds.push(appointment.id);
    return event ? [event] : [];
  });
  const eventsByDate = new Map<CalendarDate, CalendarLabEvent[]>();
  for (const event of events) {
    const day = eventsByDate.get(event.date) ?? [];
    day.push(event);
    eventsByDate.set(event.date, day);
  }
  for (const day of eventsByDate.values()) {
    day.sort((left, right) => left.startMinutes - right.startMinutes || left.id.localeCompare(right.id));
  }
  return {
    events,
    locations: [...input.locations].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "it")),
    services: [...input.services].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "it")),
    indexes: { ...baseIndexes, eventsByDate },
    skippedAppointmentIds,
  };
}
