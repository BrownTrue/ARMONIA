import { deliveredValueCents } from "../economy.ts";
import { receivedCentsInPeriod } from "../payments.ts";
import { dateInPeriod, romeClock, romeToday, type StatisticsGranularity, type StatisticsPeriod } from "./periods.ts";
import type { StatisticsDataset } from "./types.ts";

export type ActivityPoint = { key: string; label: string; sessions: number; minutes: number };

const parseDate = (value: string) => new Date(`${value}T12:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
const formatShort = (value: string) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(parseDate(value));
const addDays = (value: string, days: number) => { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + days); return iso(date); };

export function completedSessions(data: StatisticsDataset, period: StatisticsPeriod, today: string) {
  return data.sessions.filter((session) => session.date <= today && dateInPeriod(session.date, period));
}

export function coreStatistics(data: StatisticsDataset, period: StatisticsPeriod, today: string) {
  const sessions = completedSessions(data, period, today);
  const patientIds = new Set(sessions.map((session) => session.patientId));
  const days = new Set(sessions.map((session) => session.date));
  const minutes = sessions.reduce((sum, session) => sum + session.duration, 0);
  return { sessions, sessionCount: sessions.length, minutes, patientCount: patientIds.size, workDays: days.size, averageFrequency: patientIds.size ? sessions.length / patientIds.size : undefined };
}

export function patientStatistics(data: StatisticsDataset, period: StatisticsPeriod, today: string) {
  const core = coreStatistics(data, period, today);
  return {
    activeCurrent: data.patients.filter((patient) => patient.status === "active").length,
    newInPeriod: data.patients.filter((patient) => dateInPeriod(/^\d{4}-\d{2}-\d{2}$/.test(patient.createdAt) ? patient.createdAt : romeToday(new Date(patient.createdAt)), period)).length,
    followed: core.patientCount,
    averageFrequency: core.averageFrequency,
  };
}

export function appointmentStatistics(data: StatisticsDataset, period: StatisticsPeriod, now = new Date()) {
  const clock = romeClock(now);
  const linked = new Set(data.sessions.map((session) => session.appointmentId).filter(Boolean));
  const appointments = data.appointments.filter((appointment) => dateInPeriod(appointment.date, period));
  const ended = (appointment: StatisticsDataset["appointments"][number]) => appointment.date < clock.date || (appointment.date === clock.date && Number(appointment.time.slice(0, 2)) * 60 + Number(appointment.time.slice(3, 5)) + appointment.duration <= clock.minutes);
  return {
    registered: appointments.filter((appointment) => appointment.type !== "cancelled" && linked.has(appointment.id)).length,
    cancelled: appointments.filter((appointment) => appointment.type === "cancelled").length,
    toRegister: appointments.filter((appointment) => appointment.type !== "cancelled" && !linked.has(appointment.id) && ended(appointment)).length,
    manualSessions: completedSessions(data, period, clock.date).filter((session) => !session.appointmentId).length,
  };
}

export function serviceStatistics(data: StatisticsDataset, period: StatisticsPeriod, today: string) {
  const sessions = completedSessions(data, period, today);
  const serviceNames = new Map(data.services.map((service) => [service.id, service.name]));
  const groups = new Map<string, { key: string; name: string; sessions: number; minutes: number }>();
  for (const session of sessions) {
    const name = session.serviceNameSnapshot?.trim() || (session.serviceId ? serviceNames.get(session.serviceId) : undefined) || "Prestazione non specificata";
    const key = session.serviceId ? `id:${session.serviceId}:${name}` : `name:${name}`;
    const group = groups.get(key) || { key, name, sessions: 0, minutes: 0 };
    group.sessions += 1;
    group.minutes += session.duration;
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({ ...group, percentage: sessions.length ? group.sessions / sessions.length * 100 : 0 })).sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, "it"));
}

export function economyStatistics(data: StatisticsDataset, period: StatisticsPeriod, today: string) {
  const sessions = completedSessions(data, period, today);
  return { deliveredCents: deliveredValueCents(sessions), receivedCents: receivedCentsInPeriod(data.payments, { from: period.from, to: period.to }) };
}

export function activitySeries(data: StatisticsDataset, period: StatisticsPeriod, today: string, granularity: StatisticsGranularity = period.granularity): ActivityPoint[] {
  const sessions = completedSessions(data, period, today);
  const points: ActivityPoint[] = [];
  if (granularity === "day") {
    for (let date = period.from; date <= period.to; date = addDays(date, 1)) points.push({ key: date, label: formatShort(date), sessions: 0, minutes: 0 });
    const map = new Map(points.map((point) => [point.key, point]));
    for (const session of sessions) { const point = map.get(session.date); if (point) { point.sessions += 1; point.minutes += session.duration; } }
    return points;
  }
  if (granularity === "month") {
    const cursor = parseDate(`${period.from.slice(0, 7)}-01`);
    while (iso(cursor) <= period.to) { const key = iso(cursor).slice(0, 7); points.push({ key, label: new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit", timeZone: "UTC" }).format(cursor), sessions: 0, minutes: 0 }); cursor.setUTCMonth(cursor.getUTCMonth() + 1); }
    const map = new Map(points.map((point) => [point.key, point]));
    for (const session of sessions) { const point = map.get(session.date.slice(0, 7)); if (point) { point.sessions += 1; point.minutes += session.duration; } }
    return points;
  }
  for (let start = period.from; start <= period.to; start = addDays(start, 7)) points.push({ key: start, label: formatShort(start), sessions: 0, minutes: 0 });
  for (const session of sessions) {
    const index = Math.floor((parseDate(session.date).getTime() - parseDate(period.from).getTime()) / (7 * 86_400_000));
    if (points[index]) { points[index].sessions += 1; points[index].minutes += session.duration; }
  }
  return points;
}
