"use client";
import type { CSSProperties, MouseEvent } from "react";
import type { Appointment, AppointmentLocation } from "@/lib/types";
import { appointmentLocationColor, calendarEventColors, compactPatientName } from "@/lib/calendar-visual";

export function CalendarEventCard({ appointment, patientName, locations, density, className = "", style, onClick }: {
  appointment: Appointment;
  patientName: string;
  locations: AppointmentLocation[];
  density: "very-compact" | "compact" | "timed" | "agenda";
  className?: string;
  style?: CSSProperties;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const location = locations.find((item) => item.id === appointment.locationId);
  const colors = calendarEventColors(appointmentLocationColor(appointment, locations));
  const cancelled = appointment.type === "cancelled";
  const label = `${patientName}, ${appointment.time}, ${appointment.duration} minuti${appointment.serviceNameSnapshot ? `, ${appointment.serviceNameSnapshot}` : ""}${location ? `, sede ${location.name}` : ""}${cancelled ? ", annullato" : ""}`;
  return <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`group overflow-hidden rounded-lg border-l-[3px] text-left text-slate-800 outline-none transition hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-1 ${cancelled ? "border-slate-400 bg-slate-100/90 opacity-70" : ""} ${className}`}
    style={cancelled ? style : { ...style, borderLeftColor: colors.accent, backgroundColor: colors.background }}
  >
    <span className={`block truncate font-bold ${cancelled ? "line-through" : ""}`}>{compactPatientName(patientName,density==="very-compact")}</span>
    {density !== "compact" && density !== "very-compact" && appointment.serviceNameSnapshot && <span className="block truncate text-[11px] text-slate-600">{appointment.serviceNameSnapshot}</span>}
    <span className="block truncate text-[11px] text-slate-600">{appointment.time}{density !== "compact" && density !== "very-compact" ? ` · ${appointment.duration} min` : ""}</span>
    {density === "agenda" && location && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{location.name}</span>}
    {cancelled && density !== "compact" && <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Annullato</span>}
  </button>;
}
