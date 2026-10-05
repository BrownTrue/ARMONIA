"use client";

import { useEffect, useId, useRef } from "react";
import { centsToEuroInput } from "@/lib/calendar-v2";
import type { Appointment, AppointmentLocation, AppointmentService, Patient } from "@/lib/types";
import { fullName } from "@/lib/types";
import { availableCalendarV3RealAppointmentActions, type CalendarV3RealAppointmentActionId, type CalendarV3RealAppointmentActions } from "@/lib/calendar-v3-lab/real-appointment-actions";
import styles from "./calendar-v3-lab.module.css";

export function AppointmentDetailPanel({ appointment, patient, location, service, actions, busyAction, error, returnFocus, onClose, onEdit, onAction }: {
  appointment: Appointment;
  patient?: Patient;
  location?: AppointmentLocation;
  service?: AppointmentService;
  actions: CalendarV3RealAppointmentActions;
  busyAction: CalendarV3RealAppointmentActionId | null;
  error: string;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  onEdit: () => void;
  onAction: (action: CalendarV3RealAppointmentActionId, origin: HTMLButtonElement) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busyAction);
  closeRef.current = onClose;
  busyRef.current = busyAction;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("h2")?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || busyRef.current || document.querySelectorAll("[role='dialog']").length > 1) return;
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      trapPanelFocus(event, panelRef.current);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; returnFocus?.focus(); };
  }, [returnFocus]);

  const patientName = patient ? fullName(patient) : "Paziente non disponibile";
  const linkedSession = actions.linkedSession;
  const statusActions = availableCalendarV3RealAppointmentActions(actions);
  const mainAction = statusActions.find((item) => item.id === "register_session" || item.id === "open_session");
  const patientAction = statusActions.find((item) => item.id === "open_patient");
  const cancelAction = statusActions.find((item) => item.id === "cancel_appointment");
  const serviceName = appointment.serviceNameSnapshot?.trim() || service?.name;
  const locationName = appointment.locationNameSnapshot?.trim() || location?.name;

  return <div className={styles.drawerLayer} role="presentation" onMouseDown={(event) => { if (!busyAction && event.target === event.currentTarget) onClose(); }}>
    <aside ref={panelRef} className={styles.appointmentDrawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.drawerHeader}><div><span>APPUNTAMENTO</span><h2 id={titleId} tabIndex={-1}>{patientName}</h2><p>{formatDate(appointment.date)} · {appointment.time}–{endTime(appointment.time, appointment.duration)}</p></div><button type="button" aria-label="Chiudi dettaglio appuntamento" disabled={Boolean(busyAction)} onClick={onClose}>×</button></header>
      <div className={styles.drawerBody}>
        <div className={styles.detailBadges} aria-label="Stato appuntamento">
          {appointment.recurrenceSeriesId ? <span>Ricorrente</span> : null}
          <span className={appointment.type === "cancelled" ? styles.detailBadgeMuted : undefined}>{appointment.type === "cancelled" ? "Annullato" : linkedSession ? "✓ Seduta registrata" : "Seduta da registrare"}</span>
        </div>
        <dl className={styles.readOnlyDetails}>
          <Detail label="Paziente" value={patientName} wide />
          <Detail label="Data" value={formatDate(appointment.date)} />
          <Detail label="Ora" value={`${appointment.time}–${endTime(appointment.time, appointment.duration)}`} />
          <Detail label="Durata" value={`${appointment.duration} minuti`} />
          <Detail label="Stato" value={appointmentTypeLabel(appointment.type)} />
          {serviceName ? <Detail label="Prestazione" value={serviceName} wide /> : null}
          {locationName ? <Detail label="Sede" value={locationName} wide /> : null}
          {appointment.effectivePriceCents !== undefined ? <Detail label="Prezzo" value={`${centsToEuroInput(appointment.effectivePriceCents)} €`} /> : null}
          {appointment.recurrenceSeriesId ? <Detail label="Ricorrenza" value="Occorrenza di una serie" /> : null}
          {appointment.notes.trim() ? <Detail label="Note" value={appointment.notes.trim()} wide /> : null}
        </dl>
        {error ? <p className={styles.drawerSaveError} role="alert">{error}</p> : null}
      </div>
      <footer className={`${styles.drawerActions} ${styles.detailActions}`}>
        <div>
          {mainAction ? <button type="button" className={styles.primaryAction} disabled={Boolean(busyAction)} onClick={(event) => onAction(mainAction.id, event.currentTarget)}>{busyAction === mainAction.id ? "Operazione in corso…" : mainAction.label}</button> : null}
          <button type="button" className={styles.secondaryAction} disabled={Boolean(busyAction)} onClick={onEdit}>Modifica</button>
          {patientAction ? <button type="button" className={styles.secondaryAction} disabled={Boolean(busyAction)} onClick={(event) => onAction(patientAction.id, event.currentTarget)}>{patientAction.label}</button> : null}
        </div>
        {cancelAction ? <button type="button" className={styles.detailDestructiveAction} disabled={Boolean(busyAction)} onClick={(event) => onAction(cancelAction.id, event.currentTarget)}>{busyAction === cancelAction.id ? "Operazione in corso…" : cancelAction.label}</button> : null}
      </footer>
    </aside>
  </div>;
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={wide ? styles.readOnlyDetailWide : undefined}><dt>{label}</dt><dd>{value}</dd></div>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
function endTime(time: string, duration: number) { const [hours, minutes] = time.split(":").map(Number); const total = hours * 60 + minutes + duration; return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
function appointmentTypeLabel(type: Appointment["type"]) { return type === "assessment" ? "Prima valutazione" : type === "checkup" ? "Controllo" : type === "cancelled" ? "Annullato" : "Appuntamento attivo"; }
function trapPanelFocus(event: KeyboardEvent, panel: HTMLElement | null) { const items = [...(panel?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? [])]; const first = items[0], last = items.at(-1); if (!first || !last) return; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
