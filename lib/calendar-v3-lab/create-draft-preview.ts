import { getAppointmentDisplayColor } from "../calendar-visual.ts";
import type { AppointmentLocation, AppointmentService } from "../types.ts";
import { eventFromAppointmentDraft, type CalendarAppointmentDraft } from "./appointment-editor.ts";
import type { CalendarLabEvent } from "./fixtures.ts";
import { calendarV3MinutesFromCivilTime, isCalendarV3CivilDate } from "./real-data-adapter.ts";
import { isCalendarV3RealAppointmentDraft } from "./real-appointment-editor.ts";

export const CALENDAR_CREATE_DRAFT_PREVIEW_ID = "calendar-create-draft-preview";

export function calendarCreateDraftPreview(input: {
  draft: CalendarAppointmentDraft;
  realMode: boolean;
  locations: readonly AppointmentLocation[];
  services: readonly AppointmentService[];
}): CalendarLabEvent | null {
  const { draft } = input;
  const startMinutes = calendarV3MinutesFromCivilTime(draft.startTime);
  if (!isCalendarV3CivilDate(draft.date) || startMinutes === null || !Number.isFinite(draft.durationMinutes) || draft.durationMinutes <= 0) {
    return null;
  }

  if (!input.realMode || !isCalendarV3RealAppointmentDraft(draft)) {
    return {
      ...eventFromAppointmentDraft(draft, CALENDAR_CREATE_DRAFT_PREVIEW_ID),
      patientName: draft.patientName.trim() || "Nuovo appuntamento",
    };
  }

  const service = input.services.find((item) => item.id === draft.serviceId);
  const location = input.locations.find((item) => item.id === draft.locationId);
  const appointment = {
    id: draft.appointmentId,
    patientId: draft.patientId,
    date: draft.date,
    time: draft.startTime,
    duration: draft.durationMinutes,
    type: draft.appointmentType,
    notes: draft.notes,
    locationId: draft.locationId || undefined,
    locationNameSnapshot: draft.locationName || undefined,
    serviceId: draft.serviceId || undefined,
    serviceNameSnapshot: draft.serviceName || undefined,
    createdAt: draft.createdAt,
  } as const;

  return {
    id: CALENDAR_CREATE_DRAFT_PREVIEW_ID,
    source: "real",
    patientId: draft.patientId || undefined,
    patientName: draft.patientName.trim() || "Nuovo appuntamento",
    date: draft.date,
    startMinutes,
    endMinutes: startMinutes + draft.durationMinutes,
    status: "scheduled",
    sessionState: "to_register",
    serviceId: draft.serviceId || undefined,
    serviceName: draft.serviceName.trim() || undefined,
    serviceColor: service?.color,
    locationId: draft.locationId || undefined,
    locationName: draft.locationName.trim() || undefined,
    locationColor: location?.color,
    appointmentType: draft.appointmentType,
    displayColor: getAppointmentDisplayColor(appointment, [...input.locations], [...input.services]),
  };
}
