import type { Appointment, Session } from "./types.ts";

export class AppointmentPatientIntegrityError extends Error {
  constructor() {
    super("Non puoi cambiare il paziente di un appuntamento con una seduta registrata. Mantieni il paziente originale oppure crea un nuovo appuntamento.");
    this.name = "AppointmentPatientIntegrityError";
  }
}

export function assertAppointmentPatientIntegrity(
  appointments: readonly Pick<Appointment, "id" | "patientId">[],
  sessions: readonly Pick<Session, "appointmentId" | "patientId">[],
) {
  const patientsByAppointment = new Map(appointments.map(item => [item.id, item.patientId]));
  for (const session of sessions) {
    if (session.appointmentId && patientsByAppointment.has(session.appointmentId)
      && patientsByAppointment.get(session.appointmentId) !== session.patientId) {
      throw new AppointmentPatientIntegrityError();
    }
  }
}

// A session may have been registered on another device after the last load.
export function isAppointmentPatientForeignKeyError(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && "code" in cause
    && cause.code === "23503" && "message" in cause
    && String(cause.message).includes("sessions_appointment_owner_patient_fk");
}
