import { sessionForAppointment } from "../appointment-actions.ts";
import type { Appointment, Session } from "../types.ts";

export type CalendarV3RealAppointmentActionId =
  | "open_patient"
  | "register_session"
  | "open_session"
  | "cancel_appointment";

export type CalendarV3RealAppointmentAction = {
  id: CalendarV3RealAppointmentActionId;
  label: string;
  available: boolean;
  unavailableReason?: string;
  destructive?: boolean;
};

export type CalendarV3RealAppointmentActions = {
  appointmentId: string;
  patientId: string;
  linkedSession?: Session;
  actions: readonly CalendarV3RealAppointmentAction[];
};

export function getCalendarV3RealAppointmentActions(input: {
  appointment: Appointment;
  sessions: readonly Session[];
  patientExists: boolean;
}): CalendarV3RealAppointmentActions {
  const { appointment, sessions, patientExists } = input;
  const linkedSession = sessionForAppointment(appointment.id, sessions);
  const cancelled = appointment.type === "cancelled";
  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    linkedSession,
    actions: [
      {
        id: "open_patient",
        label: "Apri paziente",
        available: patientExists,
        unavailableReason: patientExists ? undefined : "Il paziente collegato non è più disponibile.",
      },
      {
        id: "register_session",
        label: "Registra seduta",
        available: !cancelled && !linkedSession,
        unavailableReason: cancelled
          ? "Un appuntamento annullato non può essere registrato come seduta."
          : linkedSession
            ? "Per questo appuntamento esiste già una seduta."
            : undefined,
      },
      {
        id: "open_session",
        label: "Apri seduta",
        available: Boolean(linkedSession),
        unavailableReason: linkedSession ? undefined : "Nessuna seduta collegata.",
      },
      {
        id: "cancel_appointment",
        label: appointment.recurrenceSeriesId ? "Annulla questo appuntamento" : "Annulla appuntamento",
        available: !cancelled,
        unavailableReason: cancelled ? "L’appuntamento è già annullato." : undefined,
        destructive: true,
      },
    ],
  };
}

export function availableCalendarV3RealAppointmentActions(
  model: CalendarV3RealAppointmentActions,
): readonly CalendarV3RealAppointmentAction[] {
  return model.actions.filter((action) => action.available);
}

