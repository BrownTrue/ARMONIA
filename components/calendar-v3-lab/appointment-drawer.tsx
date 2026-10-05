"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CALENDAR_LAB_LOCATIONS,
  CALENDAR_LAB_PATIENTS,
  CALENDAR_LAB_SERVICES,
  CALENDAR_LAB_DURATION_PRESETS,
  calendarLabSessionLabel,
  isCalendarLabDurationPreset,
  maxCalendarLabDuration,
  updateDraftDuration,
  updateDraftService,
  validateAppointmentDraft,
  type CalendarAppointmentDraft,
  type CalendarAppointmentErrors,
} from "@/lib/calendar-v3-lab/appointment-editor";
import type { CalendarLabEvent } from "@/lib/calendar-v3-lab/fixtures";
import styles from "./calendar-v3-lab.module.css";

type AppointmentDrawerProps = {
  initialDraft: CalendarAppointmentDraft;
  event?: CalendarLabEvent;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  onSave: (draft: CalendarAppointmentDraft) => void;
  readOnly?: boolean;
};

export function AppointmentDrawer({ initialDraft, event, returnFocus, onClose, onSave, readOnly = false }: AppointmentDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const patientRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<CalendarAppointmentErrors>({});
  const [customDurationOpen, setCustomDurationOpen] = useState(
    !isCalendarLabDurationPreset(initialDraft.durationMinutes),
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      if (event) panelRef.current?.querySelector<HTMLElement>("h2")?.focus();
      else patientRef.current?.focus();
    });
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.defaultPrevented) return;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        onCloseRef.current();
        return;
      }
      if (keyboardEvent.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ) ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [event, returnFocus]);

  const submit = (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    if (readOnly) return;
    const nextErrors = validateAppointmentDraft(draft);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      panelRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
      return;
    }
    onSave(draft);
  };

  const update = <K extends keyof CalendarAppointmentDraft>(key: K, value: CalendarAppointmentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  return (
    <div className={styles.drawerLayer} role="presentation" onMouseDown={(mouseEvent) => {
      if (mouseEvent.target === mouseEvent.currentTarget) onClose();
    }}>
      <aside ref={panelRef} className={styles.appointmentDrawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.drawerHeader}>
          <div>
            <span>{readOnly ? "DATI REALI · SOLA LETTURA" : event ? "APPUNTAMENTO" : "NUOVO APPUNTAMENTO"}</span>
            <h2 id={titleId} tabIndex={-1}>{event ? event.patientName : "Nuovo appuntamento"}</h2>
            <p>{formatDrawerDate(draft.date)} · {draft.startTime}</p>
          </div>
          <button type="button" aria-label="Chiudi pannello appuntamento" onClick={onClose}>×</button>
        </header>

        {readOnly && event ? <div className={styles.drawerForm}>
          <div className={styles.drawerBody}>
            <p className={`${styles.appointmentState} ${event.status === "cancelled" ? styles.appointmentCancelled : ""}`}>{calendarLabSessionLabel(event)}</p>
            <dl className={styles.readOnlyDetails}>
              <ReadOnlyDetail label="Paziente" value={event.patientName} />
              <ReadOnlyDetail label="Tipo" value={appointmentTypeLabel(event.appointmentType)} />
              <ReadOnlyDetail label="Data e ora" value={`${formatDrawerDate(event.date)} · ${minutesToClock(event.startMinutes)}–${minutesToClock(event.endMinutes)}`} />
              <ReadOnlyDetail label="Durata" value={`${event.endMinutes - event.startMinutes} min`} />
              <ReadOnlyDetail label="Prestazione" value={event.serviceName || "Non specificata"} />
              <ReadOnlyDetail label="Sede" value={event.locationName || "Non specificata"} />
              <ReadOnlyDetail label="Prezzo" value={formatPrice(event.effectivePriceCents)} />
              <ReadOnlyDetail label="Ricorrenza" value={event.isRecurring ? "Serie ricorrente" : "Occorrenza singola"} />
              <ReadOnlyDetail label="Note" value={event.notes || "Nessuna nota"} wide />
            </dl>
          </div>
          <footer className={styles.drawerActions}>
            <button type="button" className={styles.secondaryAction} onClick={onClose}>Chiudi</button>
          </footer>
        </div> : <form className={styles.drawerForm} onSubmit={submit} noValidate>
          <div className={styles.drawerBody}>
            {event ? <p className={`${styles.appointmentState} ${event.status === "cancelled" ? styles.appointmentCancelled : ""}`}>{calendarLabSessionLabel(event)}</p> : null}
            <PatientPicker
              inputRef={patientRef}
              value={draft.patientName}
              error={errors.patientName}
              onChange={(value) => update("patientName", value)}
            />

            <Field label="Prestazione" htmlFor="lab-service">
              <select id="lab-service" value={draft.serviceName} onChange={(changeEvent) => {
                const next = updateDraftService(draft, changeEvent.target.value);
                setDraft(next);
                setCustomDurationOpen(!isCalendarLabDurationPreset(next.durationMinutes));
              }}>
                <option value="">Nessuna prestazione</option>
                {CALENDAR_LAB_SERVICES.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}
              </select>
            </Field>

            <Field label="Sede" htmlFor="lab-location">
              <div className={styles.locationControl}>
                {draft.locationName ? <span style={{ background: CALENDAR_LAB_LOCATIONS.find((location) => location.name === draft.locationName)?.color }} aria-hidden="true" /> : null}
                <select id="lab-location" value={draft.locationName} onChange={(changeEvent) => update("locationName", changeEvent.target.value)}>
                  <option value="">Nessuna sede</option>
                  {CALENDAR_LAB_LOCATIONS.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
                </select>
              </div>
            </Field>

            <div className={styles.compactFields}>
              <Field label="Data *" htmlFor="lab-date" error={errors.date}>
                <input id="lab-date" name="date" type="date" value={draft.date} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "lab-date-error" : undefined} onChange={(changeEvent) => update("date", changeEvent.target.value)} />
              </Field>
              <Field label="Ora *" htmlFor="lab-start-time" error={errors.startTime}>
                <input id="lab-start-time" name="startTime" type="time" step={900} min="07:00" max="20:45" value={draft.startTime} aria-invalid={Boolean(errors.startTime)} aria-describedby={errors.startTime ? "lab-start-time-error" : undefined} onChange={(changeEvent) => update("startTime", changeEvent.target.value)} />
              </Field>
              <Field label="Durata *" htmlFor="lab-duration" error={errors.durationMinutes}>
                <select id="lab-duration" name="durationMinutes" value={customDurationOpen ? "custom" : String(draft.durationMinutes)} aria-invalid={Boolean(errors.durationMinutes)} aria-describedby={errors.durationMinutes ? "lab-duration-error" : undefined} onChange={(changeEvent) => {
                  if (changeEvent.target.value === "custom") {
                    setCustomDurationOpen(true);
                    return;
                  }
                  setCustomDurationOpen(false);
                  setDraft((current) => updateDraftDuration(current, Number(changeEvent.target.value)));
                  setErrors((current) => ({ ...current, durationMinutes: undefined }));
                }}>
                  {CALENDAR_LAB_DURATION_PRESETS.map((duration) => <option key={duration} value={duration}>{duration} min</option>)}
                  <option value="custom">Personalizzata…</option>
                </select>
                {customDurationOpen ? <div className={styles.customDurationControl}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={maxCalendarLabDuration(draft.startTime)}
                    step={15}
                    value={draft.durationMinutes || ""}
                    aria-label="Durata personalizzata in minuti"
                    aria-invalid={Boolean(errors.durationMinutes)}
                    aria-describedby={errors.durationMinutes ? "lab-duration-error" : undefined}
                    onChange={(changeEvent) => {
                      setDraft((current) => updateDraftDuration(current, Number(changeEvent.target.value)));
                      setErrors((current) => ({ ...current, durationMinutes: undefined }));
                    }}
                  />
                  <span>min</span>
                </div> : null}
              </Field>
            </div>
          </div>

          <footer className={styles.drawerActions}>
            <button type="button" className={styles.secondaryAction} onClick={onClose}>{event ? "Chiudi" : "Annulla"}</button>
            <button type="submit" className={styles.primaryAction}>{event ? "Salva modifiche" : "Salva appuntamento"}</button>
          </footer>
        </form>}
      </aside>
    </div>
  );
}

function ReadOnlyDetail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? styles.readOnlyDetailWide : undefined}><dt>{label}</dt><dd>{value}</dd></div>;
}

function appointmentTypeLabel(type: CalendarLabEvent["appointmentType"]): string {
  if (type === "assessment") return "Prima valutazione";
  if (type === "checkup") return "Controllo";
  if (type === "cancelled") return "Annullato";
  return "Seduta";
}

function minutesToClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatPrice(cents: number | undefined): string {
  if (cents === undefined) return "Non specificato";
  if (cents === 0) return "Gratuito";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function PatientPicker({ inputRef, value, error, onChange }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("it");
    return CALENDAR_LAB_PATIENTS.filter((patient) => !query || patient.name.toLocaleLowerCase("it").includes(query));
  }, [value]);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return <Field label="Paziente *" htmlFor="lab-patient" error={error}>
    <div className={styles.patientPicker}>
      <input
        ref={inputRef}
        id="lab-patient"
        name="patientName"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${matches[activeIndex].id}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "lab-patient-error" : undefined}
        placeholder="Cerca paziente"
        value={value}
        onClick={() => setOpen(true)}
        onChange={(changeEvent) => { onChange(changeEvent.target.value); setOpen(true); setActiveIndex(0); }}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "ArrowDown") { keyboardEvent.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
          else if (keyboardEvent.key === "ArrowUp") { keyboardEvent.preventDefault(); setOpen(true); setActiveIndex((index) => Math.max(index - 1, 0)); }
          else if (keyboardEvent.key === "Enter" && open && matches[activeIndex]) { keyboardEvent.preventDefault(); choose(matches[activeIndex].name); }
          else if (keyboardEvent.key === "Escape" && open) { keyboardEvent.preventDefault(); keyboardEvent.stopPropagation(); setOpen(false); }
        }}
      />
      {open ? <div id={listId} className={styles.patientOptions} role="listbox" aria-label="Pazienti">
        {matches.length ? matches.map((patient, index) => <button
          key={patient.id}
          id={`${listId}-${patient.id}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
          onClick={() => choose(patient.name)}
        >{patient.name}</button>) : <p>Nessun paziente trovato.</p>}
      </div> : null}
    </div>
  </Field>;
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  const errorId = `${htmlFor}-error`;
  return <div className={styles.drawerField}>
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {error ? <p id={errorId} role="alert">{error}</p> : null}
  </div>;
}

function formatDrawerDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Data da definire";
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}
