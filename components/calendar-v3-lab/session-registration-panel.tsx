"use client";

import { useEffect, useId, useRef } from "react";
import { SessionEditor } from "@/components/session-editor";
import type { Appointment, Patient, Session } from "@/lib/types";
import { fullName } from "@/lib/types";
import styles from "./calendar-v3-lab.module.css";

export function SessionRegistrationPanel({ appointment, patient, returnFocus, onCancel, onSaved }: { appointment: Appointment; patient: Patient; returnFocus: HTMLElement | null; onCancel: () => void; onSaved: (session: Session) => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("h2")?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelectorAll("[role='dialog']").length > 1) return;
      if (event.key === "Escape") { event.preventDefault(); cancelRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? [])];
      const first = items[0], last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; returnFocus?.focus(); };
  }, [returnFocus]);
  return <div className={styles.drawerLayer} role="presentation">
    <aside ref={panelRef} className={`${styles.appointmentDrawer} ${styles.sessionDrawer}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.drawerHeader}><div><span>REGISTRA SEDUTA</span><h2 id={titleId} tabIndex={-1}>{fullName(patient)}</h2><p>{formatDate(appointment.date)} · {appointment.time}</p></div><button type="button" aria-label="Torna al dettaglio appuntamento" onClick={onCancel}>×</button></header>
      <div className={styles.sessionDrawerBody}><SessionEditor appointmentId={appointment.id} fallbackPatientId={appointment.patientId} fallbackDate={appointment.date} presentation="panel" onCancel={onCancel} onSaved={onSaved} /></div>
    </aside>
  </div>;
}

function formatDate(date: string) { return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
