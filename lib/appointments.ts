import type { Appointment } from "./types";

export function mergeAppointments(existing: Appointment[], incoming: Appointment[]) {
  return incoming.reduce(
    (appointments, appointment) =>
      appointments.some((item) => item.id === appointment.id)
        ? appointments.map((item) =>
            item.id === appointment.id ? appointment : item,
          )
        : [appointment, ...appointments],
    existing,
  );
}

export function removeAppointment(
  appointments: Appointment[],
  appointmentId: string,
) {
  return appointments.filter((appointment) => appointment.id !== appointmentId);
}
