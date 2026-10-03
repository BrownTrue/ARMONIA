import type { Appointment, Session } from "./types.ts";

export function sessionForAppointment(appointmentId: string, sessions: readonly Session[]) {
  return sessions.find((session) => session.appointmentId === appointmentId);
}

export function canRegisterAppointmentSession(appointment: Appointment, sessions: readonly Session[]) {
  return appointment.type !== "cancelled" && !sessionForAppointment(appointment.id, sessions);
}

export function cancelAppointment(appointment: Appointment): Appointment {
  return { ...appointment, type: "cancelled" };
}
