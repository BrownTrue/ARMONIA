import type { Appointment, AppointmentService, Patient, Session } from "./types.ts";

export type EconomyPeriod = { from?: string; to?: string };
export type EconomyFilters = EconomyPeriod & { patientId?: string; serviceKey?: string };
export type DeliveredServiceRow = {
  session: Session;
  patientName: string;
  serviceName?: string;
  effectivePriceCents?: number;
};

export type NewSessionDraftResolution = {
  session: Session | null;
  appointmentMissing: boolean;
};

export function resolveNewSessionDraft(
  current: Session | null,
  options: {
    dataReady: boolean;
    appointmentId?: string;
    appointments: Appointment[];
    fallbackPatientId: string;
    fallbackDate: string;
    createId: () => string;
    createdAt: () => string;
  },
): NewSessionDraftResolution {
  if (current) return { session: current, appointmentMissing: false };
  if (!options.dataReady) return { session: null, appointmentMissing: false };
  const appointment = options.appointmentId
    ? options.appointments.find((item) => item.id === options.appointmentId)
    : undefined;
  const base: Session = {
    id: options.createId(),
    patientId: appointment?.patientId || options.fallbackPatientId,
    date: appointment?.date || options.fallbackDate,
    duration: appointment?.duration || 45,
    goalIds: [],
    activities: "",
    response: "Buona",
    helpLevel: "Minimo",
    result: "",
    nextPlan: "",
    homework: "",
    notes: "",
    materialIds: [],
    createdAt: options.createdAt(),
  };
  return {
    session: sessionWithAppointmentSnapshot(base, appointment),
    appointmentMissing: Boolean(options.appointmentId && !appointment),
  };
}

export function sessionWithAppointmentSnapshot(session: Session, appointment?: Appointment): Session {
  if (!appointment) return { ...session };
  return {
    ...session,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    date: appointment.date,
    duration: appointment.duration,
    serviceId: appointment.serviceId,
    serviceNameSnapshot: appointment.serviceNameSnapshot,
    effectivePriceCents: appointment.effectivePriceCents,
  };
}

export function sessionWithService(session: Session, service: AppointmentService | null): Session {
  if (!service) return { ...session, serviceId: undefined, serviceNameSnapshot: undefined };
  return {
    ...session,
    serviceId: service.id,
    serviceNameSnapshot: service.name,
    effectivePriceCents: service.defaultPriceCents,
  };
}

export function detachServiceFromSessions(sessions: Session[], serviceId: string): Session[] {
  return sessions.map((session) => session.serviceId === serviceId
    ? { ...session, serviceId: undefined }
    : session);
}

export function sessionsInPeriod(sessions: Session[], period: EconomyPeriod): Session[] {
  return sessions.filter((session) => (!period.from || session.date >= period.from) && (!period.to || session.date <= period.to));
}

export function economyServiceKey(session: Session): string {
  return session.serviceId ? `id:${session.serviceId}` : `snapshot:${session.serviceNameSnapshot || ""}`;
}

export function filterEconomySessions(sessions: Session[], filters: EconomyFilters): Session[] {
  return sessionsInPeriod(sessions, filters).filter((session) =>
    (!filters.patientId || session.patientId === filters.patientId)
    && (!filters.serviceKey || economyServiceKey(session) === filters.serviceKey));
}

export function deliveredValueCents(sessions: Pick<Session, "effectivePriceCents">[]): number {
  return sessions.reduce((total, session) => total + (session.effectivePriceCents ?? 0), 0);
}

export function missingPriceCount(sessions: Session[]): number {
  return sessions.filter((session) => session.effectivePriceCents === undefined).length;
}

export function groupSessionsByService(sessions: Session[]) {
  const groups = new Map<string, { serviceId?: string; serviceName?: string; count: number; valueCents: number; missingPriceCount: number }>();
  for (const session of sessions) {
    const key = economyServiceKey(session);
    const current = groups.get(key) || { serviceId: session.serviceId, serviceName: session.serviceNameSnapshot, count: 0, valueCents: 0, missingPriceCount: 0 };
    current.count += 1;
    if (session.effectivePriceCents === undefined) current.missingPriceCount += 1;
    else current.valueCents += session.effectivePriceCents;
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || (a.serviceName || "").localeCompare(b.serviceName || "", "it"));
}

export function buildDeliveredServiceRows(sessions: Session[], patients: Patient[]): DeliveredServiceRow[] {
  const patientNames = new Map(patients.map((patient) => [patient.id, `${patient.firstName} ${patient.lastName}`.trim()]));
  return sessions.map((session) => ({
    session,
    patientName: patientNames.get(session.patientId) || "Paziente non disponibile",
    serviceName: session.serviceNameSnapshot,
    effectivePriceCents: session.effectivePriceCents,
  })).sort((a, b) => b.session.date.localeCompare(a.session.date) || b.session.createdAt.localeCompare(a.session.createdAt));
}
