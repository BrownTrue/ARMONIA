import {
  buildWeeklyAppointmentOccurrences,
  centsToEuroInput,
  euroInputToCents,
  withAppointmentLocation,
  withAppointmentService,
} from "../calendar-v2.ts";
import { validateAppointmentForm, type FieldErrors } from "../form-validation.ts";
import { generateWeeklyDates } from "../recurrence.ts";
import type { Appointment, AppointmentLocation, AppointmentService, AppointmentType, Patient } from "../types.ts";
import { fullName } from "../types.ts";
import { isCalendarV3CivilDate, calendarV3MinutesFromCivilTime } from "./real-data-adapter.ts";
import { minutesToTime, type CalendarDate } from "./date-time.ts";
import type { CalendarSelection } from "./selection.ts";
import type { CalendarAppointmentDraft } from "./appointment-editor.ts";

export type CalendarV3RealAppointmentDraft = CalendarAppointmentDraft & {
  appointmentId: string;
  patientId: string;
  appointmentType: AppointmentType;
  locationId: string;
  serviceId: string;
  price: string;
  notes: string;
  repeat: "none" | "weekly";
  recurrenceEndDate: string;
  recurrenceSeriesId?: string;
  createdAt: string;
};

export type CalendarV3AppointmentSavePlan =
  | { kind: "single"; appointment: Appointment }
  | { kind: "recurring"; appointments: Appointment[] };

export function isCalendarV3RealAppointmentDraft(draft: CalendarAppointmentDraft): draft is CalendarV3RealAppointmentDraft {
  return "appointmentId" in draft && "patientId" in draft;
}

export function createCalendarV3RealAppointmentDraft(input: {
  selection: CalendarSelection;
  appointmentId: string;
  createdAt: string;
}): CalendarV3RealAppointmentDraft {
  return {
    appointmentId: input.appointmentId,
    patientId: "",
    patientName: "",
    appointmentType: "regular",
    locationId: "",
    locationName: "",
    serviceId: "",
    serviceName: "",
    date: input.selection.date,
    startTime: minutesToTime(input.selection.startMinutes),
    durationMinutes: input.selection.durationMinutes,
    durationManuallyEdited: false,
    price: "",
    notes: "",
    repeat: "none",
    recurrenceEndDate: "",
    createdAt: input.createdAt,
  };
}

export function calendarV3RealAppointmentDraftFromAppointment(
  appointment: Appointment,
  patients: readonly Patient[],
  locations: readonly AppointmentLocation[],
  services: readonly AppointmentService[],
): CalendarV3RealAppointmentDraft {
  const patient = patients.find((item) => item.id === appointment.patientId);
  const location = locations.find((item) => item.id === appointment.locationId);
  const service = services.find((item) => item.id === appointment.serviceId);
  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: patient ? fullName(patient).trim() : "Paziente non disponibile",
    appointmentType: appointment.type,
    locationId: appointment.locationId ?? "",
    locationName: appointment.locationNameSnapshot ?? location?.name ?? "",
    serviceId: appointment.serviceId ?? "",
    serviceName: appointment.serviceNameSnapshot ?? service?.name ?? "",
    date: appointment.date,
    startTime: appointment.time,
    durationMinutes: appointment.duration,
    durationManuallyEdited: false,
    price: centsToEuroInput(appointment.effectivePriceCents),
    notes: appointment.notes,
    repeat: "none",
    recurrenceEndDate: "",
    recurrenceSeriesId: appointment.recurrenceSeriesId,
    createdAt: appointment.createdAt,
  };
}

export function selectCalendarV3RealLocation(
  draft: CalendarV3RealAppointmentDraft,
  location: AppointmentLocation | null,
): CalendarV3RealAppointmentDraft {
  const appointment = withAppointmentLocation(realDraftBase(draft, false), location);
  return {
    ...draft,
    locationId: appointment.locationId ?? "",
    locationName: appointment.locationNameSnapshot ?? "",
  };
}

export function selectCalendarV3RealService(
  draft: CalendarV3RealAppointmentDraft,
  service: AppointmentService | null,
): CalendarV3RealAppointmentDraft {
  if (!service) return { ...draft, serviceId: "", serviceName: "" };
  const appointment = withAppointmentService(realDraftBase(draft, false), service);
  return {
    ...draft,
    serviceId: appointment.serviceId ?? "",
    serviceName: appointment.serviceNameSnapshot ?? "",
    durationMinutes: appointment.duration,
    durationManuallyEdited: false,
    price: centsToEuroInput(appointment.effectivePriceCents),
  };
}

export function validateCalendarV3RealAppointmentDraft(draft: CalendarV3RealAppointmentDraft): FieldErrors {
  const errors = validateAppointmentForm({
    patientId: draft.patientId,
    date: draft.date,
    time: draft.startTime,
    duration: draft.durationMinutes,
    price: draft.price,
    repeat: draft.repeat,
    recurrenceEndDate: draft.recurrenceEndDate,
  });
  if (draft.date && !isCalendarV3CivilDate(draft.date)) errors.date = "Inserisci una data valida.";
  if (draft.startTime && calendarV3MinutesFromCivilTime(draft.startTime) === null) errors.startTime = "Inserisci un orario valido.";
  if (errors.time) {
    errors.startTime = errors.time;
    delete errors.time;
  }
  if (errors.duration) {
    errors.durationMinutes = errors.duration;
    delete errors.duration;
  }
  return errors;
}

export function buildCalendarV3AppointmentSavePlan(input: {
  draft: CalendarV3RealAppointmentDraft;
  existing?: Appointment;
  createId: () => string;
  createdAt: () => string;
}): CalendarV3AppointmentSavePlan {
  const base: Appointment = {
    ...(input.existing ?? realDraftBase(input.draft)),
    id: input.draft.appointmentId,
    patientId: input.draft.patientId,
    date: input.draft.date,
    time: input.draft.startTime,
    duration: input.draft.durationMinutes,
    type: input.draft.appointmentType,
    notes: input.draft.notes,
    locationId: input.draft.locationId || undefined,
    locationNameSnapshot: input.draft.locationId ? input.draft.locationName || undefined : undefined,
    serviceId: input.draft.serviceId || undefined,
    serviceNameSnapshot: input.draft.serviceId ? input.draft.serviceName || undefined : undefined,
    effectivePriceCents: euroInputToCents(input.draft.price),
    recurrenceSeriesId: input.existing?.recurrenceSeriesId,
    createdAt: input.existing?.createdAt ?? input.draft.createdAt,
  };
  if (input.existing || input.draft.repeat !== "weekly") return { kind: "single", appointment: base };

  const recurrenceSeriesId = input.createId();
  const createdAt = input.createdAt();
  const dates = generateWeeklyDates(base.date, input.draft.recurrenceEndDate);
  return {
    kind: "recurring",
    appointments: buildWeeklyAppointmentOccurrences(
      { ...base, recurrenceSeriesId, createdAt },
      dates,
      input.createId,
    ),
  };
}

function realDraftBase(draft: CalendarV3RealAppointmentDraft, parsePrice = true): Appointment {
  return {
    id: draft.appointmentId,
    patientId: draft.patientId,
    date: draft.date as CalendarDate,
    time: draft.startTime,
    duration: draft.durationMinutes,
    type: draft.appointmentType,
    notes: draft.notes,
    locationId: draft.locationId || undefined,
    locationNameSnapshot: draft.locationName || undefined,
    serviceId: draft.serviceId || undefined,
    serviceNameSnapshot: draft.serviceName || undefined,
    effectivePriceCents: parsePrice ? euroInputToCents(draft.price) : undefined,
    recurrenceSeriesId: draft.recurrenceSeriesId,
    createdAt: draft.createdAt,
  };
}
