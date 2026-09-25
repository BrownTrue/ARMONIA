import type { CalendarFeedAppointment } from "./ics";

type PatientRow = { first_name: string; last_name: string; user_id: string };

type AppointmentRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  type: string;
  updated_at: string | null;
  patients: PatientRow | PatientRow[];
};

export function calendarFeedAppointmentsFromRows(rows: AppointmentRow[], userId: string): CalendarFeedAppointment[] {
  return rows.flatMap(row => {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    if (!patient || patient.user_id !== userId) return [];
    return [{
      id: row.id,
      startsAt: row.starts_at,
      durationMinutes: row.duration_minutes,
      type: row.type,
      updatedAt: row.updated_at || row.starts_at,
      patientFirstName: patient.first_name || "",
      patientLastName: patient.last_name || "",
    }];
  });
}
