import type { PatientTimelineFilter, PatientTimelineItem } from "./clinical/timeline.ts";
import type { Appointment, Session } from "./types.ts";

export type MobilePatientAppointmentState = "pending" | "future" | "cancelled";
export type MobilePatientActivityItem =
  | { id: string; kind: "session"; occurredOn: string; time?: string; item: Extract<PatientTimelineItem, { type: "session" }> }
  | { id: string; kind: "assessment"; occurredOn: string; item: Extract<PatientTimelineItem, { type: "clinical_assessment" }> }
  | { id: string; kind: "appointment"; occurredOn: string; time: string; state: MobilePatientAppointmentState; appointment: Appointment };

const romeCivilNow = (now: Date) => {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
};

export function buildMobilePatientActivity(patientId: string, timeline: PatientTimelineItem[], appointments: Appointment[], sessions: Session[], now = new Date()): MobilePatientActivityItem[] {
  const linkedAppointmentIds = new Set(sessions.flatMap((session) => session.patientId === patientId && session.appointmentId ? [session.appointmentId] : []));
  const civilNow = romeCivilNow(now);
  const timelineItems: MobilePatientActivityItem[] = timeline.map((item) => item.type === "session"
    ? { id: item.id, kind: "session", occurredOn: item.occurredOn, time: item.appointment?.time, item }
    : { id: item.id, kind: "assessment", occurredOn: item.occurredOn, item });
  const appointmentItems: MobilePatientActivityItem[] = appointments
    .filter((appointment) => appointment.patientId === patientId && !linkedAppointmentIds.has(appointment.id))
    .map((appointment) => ({
      id: `appointment:${appointment.id}`,
      kind: "appointment" as const,
      occurredOn: appointment.date,
      time: appointment.time,
      state: appointment.type === "cancelled" ? "cancelled" as const : appointment.date > civilNow.date || (appointment.date === civilNow.date && appointment.time > civilNow.time) ? "future" as const : "pending" as const,
      appointment,
    }));
  return [...timelineItems, ...appointmentItems].sort((left, right) =>
    right.occurredOn.localeCompare(left.occurredOn)
      || (right.kind === "appointment" || right.kind === "session" ? right.time || "" : "").localeCompare(left.kind === "appointment" || left.kind === "session" ? left.time || "" : "")
      || right.id.localeCompare(left.id));
}

export function filterMobilePatientActivity(items: MobilePatientActivityItem[], filter: PatientTimelineFilter, query = "") {
  const byType = filter === "sessions"
    ? items.filter((item) => item.kind === "session" || item.kind === "appointment")
    : filter === "assessments"
      ? items.filter((item) => item.kind === "assessment")
      : items;
  const normalized = query.trim().toLocaleLowerCase("it-IT");
  if (!normalized) return byType;
  return byType.filter((item) => {
    const values = item.kind === "session"
      ? [item.item.title, item.item.session.activities, item.item.session.result, item.item.session.serviceNameSnapshot, item.item.appointment?.locationNameSnapshot]
      : item.kind === "assessment"
        ? [item.item.title, ...item.item.moduleLabels]
        : [item.appointment.serviceNameSnapshot, item.appointment.locationNameSnapshot, item.state === "pending" ? "Seduta da registrare" : item.state === "future" ? "Appuntamento futuro" : "Appuntamento annullato"];
    return values.some((value) => value?.toLocaleLowerCase("it-IT").includes(normalized));
  });
}

export function groupMobilePatientActivity(items: MobilePatientActivityItem[], now = new Date()) {
  const today = romeCivilNow(now).date;
  const yesterdayDate = new Date(`${today}T12:00:00Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  const groups = new Map<string, MobilePatientActivityItem[]>();
  for (const item of items) {
    const group = groups.get(item.occurredOn);
    if (group) group.push(item); else groups.set(item.occurredOn, [item]);
  }
  return [...groups].map(([date, groupItems]) => ({
    date,
    label: date === today ? "Oggi" : date === yesterday ? "Ieri" : new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" }),
    items: groupItems,
  }));
}
