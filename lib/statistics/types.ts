import type { AppData, Appointment, AppointmentService, Patient, Payment, Session } from "../types.ts";

export type StatisticsDataset = {
  sessions: Pick<Session, "id" | "patientId" | "appointmentId" | "serviceId" | "serviceNameSnapshot" | "effectivePriceCents" | "date" | "duration">[];
  appointments: Pick<Appointment, "id" | "date" | "time" | "duration" | "type">[];
  patients: Pick<Patient, "id" | "status" | "createdAt">[];
  payments: Pick<Payment, "id" | "amountCents" | "paidAt" | "status">[];
  services: Pick<AppointmentService, "id" | "name">[];
};

export function statisticsDatasetFromAppData(data: AppData): StatisticsDataset {
  return {
    sessions: data.sessions,
    appointments: data.appointments,
    patients: data.patients,
    payments: data.payments,
    services: data.services,
  };
}
