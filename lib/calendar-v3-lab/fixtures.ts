import type { CalendarDate } from "./date-time.ts";

export type CalendarLabEventStatus = "scheduled" | "cancelled";
export type CalendarLabSessionState = "registered" | "to_register";

export type CalendarLabEvent = {
  id: string;
  source?: "fixture" | "real";
  appointmentId?: string;
  patientId?: string;
  patientName: string;
  date: CalendarDate;
  startMinutes: number;
  endMinutes: number;
  status: CalendarLabEventStatus;
  sessionState: CalendarLabSessionState;
  serviceName?: string;
  serviceColor?: string;
  locationName?: string;
  locationColor?: string;
  appointmentType?: "regular" | "assessment" | "checkup" | "cancelled";
  notes?: string;
  locationId?: string;
  serviceId?: string;
  effectivePriceCents?: number;
  recurrenceSeriesId?: string;
  recurrencePosition?: number;
  isRecurring?: boolean;
  createdAt?: string;
  displayColor?: string;
};

export const CALENDAR_LAB_WEEK: CalendarDate = "2026-10-05";

export const CALENDAR_LAB_EVENTS: readonly CalendarLabEvent[] = Object.freeze([
  { id: "lab-overlap-a", patientName: "Mario Rossi", date: "2026-10-05", startMinutes: 540, endMinutes: 600, status: "scheduled", sessionState: "to_register", serviceName: "Trattamento", serviceColor: "#77A886", locationName: "Studio Centro", locationColor: "#8EA6C4" },
  { id: "lab-overlap-b", patientName: "Giulia Bianchi", date: "2026-10-05", startMinutes: 570, endMinutes: 630, status: "scheduled", sessionState: "registered", serviceName: "Valutazione", serviceColor: "#D99B7B", locationName: "Studio Centro", locationColor: "#8EA6C4" },
  { id: "lab-overlap-c", patientName: "Luca Verdi", date: "2026-10-05", startMinutes: 585, endMinutes: 615, status: "scheduled", sessionState: "to_register", locationName: "Studio Nord", locationColor: "#A88BBC" },
  { id: "lab-short", patientName: "Anna Conti", date: "2026-10-06", startMinutes: 480, endMinutes: 495, status: "scheduled", sessionState: "registered", serviceName: "Controllo", serviceColor: "#D6A84B" },
  { id: "lab-forty-five", patientName: "Mario Rossi", date: "2026-10-07", startMinutes: 660, endMinutes: 705, status: "scheduled", sessionState: "to_register", locationName: "Studio Centro", locationColor: "#8EA6C4" },
  { id: "lab-ninety", patientName: "Giulia Bianchi", date: "2026-10-08", startMinutes: 840, endMinutes: 930, status: "scheduled", sessionState: "registered" },
  { id: "lab-cancelled", patientName: "Luca Verdi", date: "2026-10-09", startMinutes: 1020, endMinutes: 1050, status: "cancelled", sessionState: "to_register", serviceName: "Trattamento", serviceColor: "#77A886" },
]);

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

export function calendarLabEventColor(event: CalendarLabEvent): string {
  if (event.displayColor && HEX_COLOR.test(event.displayColor)) return event.displayColor;
  if (event.status === "cancelled") return "#9CA3AF";
  if (event.serviceColor && HEX_COLOR.test(event.serviceColor)) return event.serviceColor;
  if (event.locationColor && HEX_COLOR.test(event.locationColor)) return event.locationColor;
  return "#77A886";
}
