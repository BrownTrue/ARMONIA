import type { Appointment } from "../types.ts";
import { minutesToTime } from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

export type CalendarV3RealGesture = "move" | "resize" | "month_move";
export type CalendarV3GestureBlockReason = "cancelled" | "registered" | "recurring";

export type CalendarV3GestureBlock = {
  reason: CalendarV3GestureBlockReason;
  message: string;
};

export function getCalendarV3GestureBlockReason(event: CalendarLabEvent): CalendarV3GestureBlock | null {
  if (event.status === "cancelled") {
    return {
      reason: "cancelled",
      message: "Appuntamento annullato. Gli appuntamenti annullati non possono essere spostati.",
    };
  }
  if (event.sessionState === "registered") {
    return {
      reason: "registered",
      message: "Seduta già registrata. Questo appuntamento non può essere spostato rapidamente.",
    };
  }
  if (event.recurrenceSeriesId) {
    return {
      reason: "recurring",
      message: "Appuntamento ricorrente. La modifica della serie sarà disponibile nella gestione delle ricorrenze.",
    };
  }
  return null;
}

export function isCalendarV3RealGestureEligible(event: CalendarLabEvent): boolean {
  return event.source === "real" &&
    event.status === "scheduled" &&
    event.sessionState === "to_register" &&
    !event.recurrenceSeriesId;
}

export function appointmentAfterCalendarV3RealGesture(
  before: Appointment,
  intent: CalendarLabEvent,
  gesture: CalendarV3RealGesture,
): Appointment {
  if (gesture === "move") {
    return {
      ...before,
      date: intent.date,
      time: minutesToTime(intent.startMinutes),
    };
  }
  if (gesture === "resize") {
    return {
      ...before,
      duration: intent.endMinutes - intent.startMinutes,
    };
  }
  return {
    ...before,
    date: intent.date,
  };
}

export function calendarV3RealGestureFailureMessage(gesture: CalendarV3RealGesture): string {
  if (gesture === "resize") return "Impossibile modificare la durata. Nessuna modifica salvata.";
  return "Impossibile spostare l'appuntamento. Nessuna modifica salvata.";
}

export async function executeCalendarV3RealGesture(input: {
  before: Appointment;
  intent: CalendarLabEvent;
  gesture: CalendarV3RealGesture;
  save: (appointment: Appointment) => Promise<void>;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const appointment = appointmentAfterCalendarV3RealGesture(input.before, input.intent, input.gesture);
  try {
    await input.save(appointment);
    return { ok: true };
  } catch {
    return { ok: false, message: calendarV3RealGestureFailureMessage(input.gesture) };
  }
}
