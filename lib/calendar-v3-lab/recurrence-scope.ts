import type { Appointment, Session } from "../types.ts";
import { AppointmentPatientIntegrityError } from "../appointment-patient-integrity.ts";
import { addCalendarDays } from "./date-time.ts";
import type { CalendarV3RealGesture } from "./real-appointment-gesture.ts";

export type CalendarV3RecurrenceScope = "single" | "following" | "entire";
export type CalendarV3RecurringMutation = CalendarV3RealGesture | "drawer";

export type CalendarV3RecurrencePlan = {
  appointments: Appointment[];
  seriesCount: number;
  excludedRegisteredCount: number;
  excludedCancelledCount: number;
  consistencyError?: string;
};

const EDITABLE_APPOINTMENT_KEYS = [
  "patientId",
  "date",
  "time",
  "duration",
  "type",
  "notes",
  "locationId",
  "locationNameSnapshot",
  "serviceId",
  "serviceNameSnapshot",
  "effectivePriceCents",
] as const satisfies readonly (keyof Appointment)[];

const RECURRENCE_POSITION_ERROR = "Non è possibile modificare più appuntamenti: la posizione nella serie non è disponibile. Ricarica la pagina e riprova.";

function validRecurrencePosition(appointment: Appointment): appointment is Appointment & { recurrencePosition: number } {
  return Number.isInteger(appointment.recurrencePosition) && Number(appointment.recurrencePosition) >= 0;
}

export function calendarV3RecurrenceConsistencyError(
  appointments: readonly Appointment[],
  selected: Appointment,
): string | undefined {
  if (!selected.recurrenceSeriesId) return undefined;
  const series = appointments.filter((appointment) => appointment.recurrenceSeriesId === selected.recurrenceSeriesId);
  const positions = new Set<number>();
  for (const appointment of series) {
    if (!validRecurrencePosition(appointment) || positions.has(appointment.recurrencePosition)) {
      return RECURRENCE_POSITION_ERROR;
    }
    positions.add(appointment.recurrencePosition);
  }
  return validRecurrencePosition(selected) ? undefined : RECURRENCE_POSITION_ERROR;
}

export function calendarV3SeriesAppointments(
  appointments: readonly Appointment[],
  selected: Appointment,
): Appointment[] {
  if (!selected.recurrenceSeriesId) return [selected];
  const consistencyError = calendarV3RecurrenceConsistencyError(appointments, selected);
  if (consistencyError) throw new Error("calendar_recurrence_position_invalid");
  return appointments
    .filter((appointment) => appointment.recurrenceSeriesId === selected.recurrenceSeriesId)
    .sort((left, right) => left.recurrencePosition! - right.recurrencePosition!);
}

export function hasCalendarV3AppointmentChanges(before: Appointment, after: Appointment): boolean {
  return EDITABLE_APPOINTMENT_KEYS.some((key) => before[key] !== after[key]);
}

function appointmentForMutation(input: {
  occurrence: Appointment;
  selectedBefore: Appointment;
  selectedAfter: Appointment;
  mutation: CalendarV3RecurringMutation;
  scope: CalendarV3RecurrenceScope;
}): Appointment {
  const { occurrence, selectedBefore, selectedAfter, mutation, scope } = input;
  const recurrenceSeriesId = occurrence.recurrenceSeriesId;
  const recurrencePosition = occurrence.recurrencePosition;

  if (scope === "single") {
    if (mutation === "resize") return { ...occurrence, duration: selectedAfter.duration, recurrenceSeriesId, recurrencePosition };
    if (mutation === "month_move") return { ...occurrence, date: selectedAfter.date, recurrenceSeriesId, recurrencePosition };
    if (mutation === "move") return { ...occurrence, date: selectedAfter.date, time: selectedAfter.time, recurrenceSeriesId, recurrencePosition };
    return {
      ...occurrence,
      ...selectedAfter,
      id: occurrence.id,
      createdAt: occurrence.createdAt,
      recurrenceSeriesId,
      recurrencePosition,
    };
  }

  if (!validRecurrencePosition(occurrence) || !validRecurrencePosition(selectedBefore)) {
    throw new Error("calendar_recurrence_position_invalid");
  }
  const anchoredDate = addCalendarDays(
    selectedAfter.date as `${number}-${number}-${number}`,
    (occurrence.recurrencePosition - selectedBefore.recurrencePosition) * 7,
  );

  if (mutation === "resize") {
    return { ...occurrence, duration: selectedAfter.duration, recurrenceSeriesId, recurrencePosition };
  }
  if (mutation === "month_move") {
    return { ...occurrence, date: anchoredDate, recurrenceSeriesId, recurrencePosition };
  }
  if (mutation === "move") {
    return { ...occurrence, date: anchoredDate, time: selectedAfter.time, recurrenceSeriesId, recurrencePosition };
  }

  const next = { ...occurrence };
  for (const key of EDITABLE_APPOINTMENT_KEYS) {
    if (key === "date" || key === "time") continue;
    if (selectedBefore[key] !== selectedAfter[key]) Object.assign(next, { [key]: selectedAfter[key] });
  }
  if (selectedBefore.date !== selectedAfter.date || selectedBefore.time !== selectedAfter.time) {
    next.date = anchoredDate;
    next.time = selectedAfter.time;
  }
  return { ...next, id: occurrence.id, createdAt: occurrence.createdAt, recurrenceSeriesId, recurrencePosition };
}

export function buildCalendarV3RecurrencePlan(input: {
  appointments: readonly Appointment[];
  sessions: readonly Session[];
  selectedBefore: Appointment;
  selectedAfter: Appointment;
  mutation: CalendarV3RecurringMutation;
  scope: CalendarV3RecurrenceScope;
}): CalendarV3RecurrencePlan {
  if (!input.selectedBefore.recurrenceSeriesId || input.scope === "single") {
    return {
      appointments: [appointmentForMutation({
        occurrence: input.selectedBefore,
        selectedBefore: input.selectedBefore,
        selectedAfter: input.selectedAfter,
        mutation: input.mutation,
        scope: "single",
      })],
      seriesCount: input.selectedBefore.recurrenceSeriesId
        ? input.appointments.filter((appointment) => appointment.recurrenceSeriesId === input.selectedBefore.recurrenceSeriesId).length
        : 1,
      excludedRegisteredCount: 0,
      excludedCancelledCount: 0,
    };
  }

  const consistencyError = calendarV3RecurrenceConsistencyError(input.appointments, input.selectedBefore);
  if (consistencyError) {
    return {
      appointments: [],
      seriesCount: input.appointments.filter((appointment) => appointment.recurrenceSeriesId === input.selectedBefore.recurrenceSeriesId).length,
      excludedRegisteredCount: 0,
      excludedCancelledCount: 0,
      consistencyError,
    };
  }
  const series = calendarV3SeriesAppointments(input.appointments, input.selectedBefore);

  const registeredIds = new Set(input.sessions.flatMap((session) => session.appointmentId ? [session.appointmentId] : []));
  const candidates = input.scope === "following"
    ? series.filter((appointment) => appointment.recurrencePosition! >= input.selectedBefore.recurrencePosition!)
    : series;
  const excludedRegisteredCount = candidates.filter((appointment) => registeredIds.has(appointment.id)).length;
  const excludedCancelledCount = candidates.filter((appointment) => appointment.type === "cancelled").length;
  const eligible = candidates.filter((appointment) =>
    !registeredIds.has(appointment.id) && appointment.type !== "cancelled",
  );

  return {
    appointments: eligible.map((occurrence) => appointmentForMutation({
      occurrence,
      selectedBefore: input.selectedBefore,
      selectedAfter: input.selectedAfter,
      mutation: input.mutation,
      scope: input.scope,
    })),
    seriesCount: series.length,
    excludedRegisteredCount,
    excludedCancelledCount,
  };
}

export function calendarV3RecurrencePlanSummary(plan: CalendarV3RecurrencePlan): string {
  if (plan.consistencyError) return plan.consistencyError;
  const changed = plan.appointments.length === 1
    ? "Verrà modificato 1 appuntamento."
    : `Verranno modificati ${plan.appointments.length} appuntamenti.`;
  const exclusions = [
    plan.excludedRegisteredCount
      ? `${plan.excludedRegisteredCount} ${plan.excludedRegisteredCount === 1 ? "seduta registrata" : "sedute registrate"}`
      : "",
    plan.excludedCancelledCount
      ? `${plan.excludedCancelledCount} ${plan.excludedCancelledCount === 1 ? "appuntamento annullato" : "appuntamenti annullati"}`
      : "",
  ].filter(Boolean);
  const singularExclusion = exclusions.length === 1 &&
    (plan.excludedRegisteredCount === 1 || plan.excludedCancelledCount === 1);
  return exclusions.length
    ? `${changed} ${exclusions.join(" e ")} non ${singularExclusion ? "verrà modificato" : "verranno modificati"}.`
    : changed;
}

export async function executeCalendarV3RecurrencePlan(
  plan: CalendarV3RecurrencePlan,
  save: (appointments: Appointment[]) => Promise<void>,
): Promise<{ ok: true; count: number } | { ok: false; patientError?: string }> {
  if (!plan.appointments.length) return { ok: false };
  try {
    await save(plan.appointments);
    return { ok: true, count: plan.appointments.length };
  } catch (cause) {
    return cause instanceof AppointmentPatientIntegrityError
      ? { ok: false, patientError: cause.message }
      : { ok: false };
  }
}
