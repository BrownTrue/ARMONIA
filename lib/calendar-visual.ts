import type { Appointment, AppointmentLocation } from "./types";

export const FALLBACK_APPOINTMENT_COLOR = "#77A886";

const validHex = (value?: string) => value && /^#[0-9A-F]{6}$/i.test(value) ? value.toUpperCase() : FALLBACK_APPOINTMENT_COLOR;

export function appointmentLocationColor(appointment: Appointment, locations: Pick<AppointmentLocation, "id" | "color">[]) {
  return validHex(locations.find((location) => location.id === appointment.locationId)?.color);
}

export function calendarEventColors(color?: string) {
  const accent = validHex(color);
  return { accent, background: `${accent}18`, hover: `${accent}2A`, text: "#24322B" };
}

const minutes = (time: string) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

export type PositionedAppointment = { appointment: Appointment; column: number; columnCount: number };

export function compactPatientName(name: string, veryCompact = false) {
  const parts = name.trim().split(/\s+/);
  if (!veryCompact || parts.length < 2) return name;
  return `${parts[0]} ${parts.at(-1)?.[0] || ""}.`;
}

export function monthDayAppointments(appointments: Appointment[], date: string, visible = 3) {
  const sorted = appointments.filter((item) => item.date === date).slice().sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id));
  return { visible: sorted.slice(0, visible), hiddenCount: Math.max(0, sorted.length-visible), all: sorted };
}

export function layoutOverlappingAppointments(appointments: Appointment[]): PositionedAppointment[] {
  const sorted = appointments.map((appointment, index) => ({ appointment, index, start: minutes(appointment.time), end: minutes(appointment.time) + appointment.duration }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);
  const result: PositionedAppointment[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const columnEnds: number[] = [];
    const placed = cluster.map((item) => {
      let column = columnEnds.findIndex((end) => end <= item.start);
      if (column < 0) column = columnEnds.length;
      columnEnds[column] = item.end;
      return { appointment: item.appointment, column, columnCount: 0 };
    });
    const columnCount = columnEnds.length;
    for (const item of placed) result.push({ ...item, columnCount });
    cluster = [];
  };
  for (const item of sorted) {
    if (cluster.length && item.start >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
    if (cluster.length === 1) clusterEnd = item.end;
  }
  flush();
  return result;
}
