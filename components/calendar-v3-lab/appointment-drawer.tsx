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
} from "@/lib/calendar-v3-lab/appointment-editor";
import type { CalendarLabEvent } from "@/lib/calendar-v3-lab/fixtures";
import {
  isCalendarV3RealAppointmentDraft,
  selectCalendarV3RealLocation,
  selectCalendarV3RealService,
  validateCalendarV3RealAppointmentDraft,
  type CalendarV3RealAppointmentDraft,
} from "@/lib/calendar-v3-lab/real-appointment-editor";
import { selectableAppointmentLocations, selectableAppointmentServices } from "@/lib/calendar-v2";
import type { AppointmentLocation, AppointmentService, Patient } from "@/lib/types";
import { fullName } from "@/lib/types";
import type { FieldErrors } from "@/lib/form-validation";
import {
  availableCalendarV3RealAppointmentActions,
  type CalendarV3RealAppointmentActionId,
  type CalendarV3RealAppointmentActions,
} from "@/lib/calendar-v3-lab/real-appointment-actions";
import styles from "./calendar-v3-lab.module.css";

type AppointmentDrawerProps = {
  initialDraft: CalendarAppointmentDraft;
  event?: CalendarLabEvent;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  onSave: (draft: CalendarAppointmentDraft) => Promise<void> | void;
  onDraftChange?: (draft: CalendarAppointmentDraft) => void;
  realMode?: boolean;
  patients?: readonly Patient[];
  locations?: readonly AppointmentLocation[];
  services?: readonly AppointmentService[];
  scopeDialogOpen?: boolean;
  actionDialogOpen?: boolean;
  appointmentActions?: CalendarV3RealAppointmentActions;
  actionBusy?: CalendarV3RealAppointmentActionId | null;
  actionError?: string;
  onAppointmentAction?: (action: CalendarV3RealAppointmentActionId, origin: HTMLButtonElement) => void;
};

export function AppointmentDrawer({ initialDraft, event, returnFocus, onClose, onSave, onDraftChange, realMode = false, patients = [], locations = [], services = [], scopeDialogOpen = false, actionDialogOpen = false, appointmentActions, actionBusy = null, actionError = "", onAppointmentAction }: AppointmentDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const patientRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const nestedDialogOpenRef = useRef(scopeDialogOpen || actionDialogOpen);
  nestedDialogOpenRef.current = scopeDialogOpen || actionDialogOpen;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customDurationOpen, setCustomDurationOpen] = useState(
    !isCalendarLabDurationPreset(initialDraft.durationMinutes),
  );

  useEffect(() => {
    if (!event) onDraftChange?.(draft);
  }, [draft, event, onDraftChange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      if (event) panelRef.current?.querySelector<HTMLElement>("h2")?.focus();
      else patientRef.current?.focus();
    });
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.defaultPrevented) return;
      if (nestedDialogOpenRef.current) return;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        if (savingRef.current) return;
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

  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    if (savingRef.current) return;
    const nextErrors = realMode && isCalendarV3RealAppointmentDraft(draft)
      ? validateCalendarV3RealAppointmentDraft(draft)
      : validateAppointmentDraft(draft);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      panelRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
    } catch {
      setSaveError("Non è stato possibile salvare l’appuntamento. Controlla la connessione e riprova.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const update = <K extends keyof CalendarAppointmentDraft>(key: K, value: CalendarAppointmentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => withoutError(current, String(key)));
  };

  return (
    <div className={styles.drawerLayer} role="presentation" onMouseDown={(mouseEvent) => {
      if (!savingRef.current && mouseEvent.target === mouseEvent.currentTarget) onClose();
    }}>
      <aside ref={panelRef} className={styles.appointmentDrawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.drawerHeader}>
          <div>
            <span>{event ? "APPUNTAMENTO" : "NUOVO APPUNTAMENTO"}</span>
            <h2 id={titleId} tabIndex={-1}>{event ? event.patientName : "Nuovo appuntamento"}</h2>
            <p>{formatDrawerDate(draft.date)} · {draft.startTime}</p>
          </div>
          <button type="button" aria-label="Chiudi pannello appuntamento" disabled={saving} onClick={onClose}>×</button>
        </header>

        <form className={styles.drawerForm} onSubmit={submit} noValidate>
          <div className={styles.drawerBody}>
            {event ? <p className={`${styles.appointmentState} ${event.status === "cancelled" ? styles.appointmentCancelled : ""}`}>{calendarLabSessionLabel(event)}</p> : null}
            {realMode && isCalendarV3RealAppointmentDraft(draft) ? <RealAppointmentFields
              draft={draft}
              errors={errors}
              patientRef={patientRef}
              patients={patients}
              locations={locations}
              services={services}
              existing={Boolean(event)}
              customDurationOpen={customDurationOpen}
              setCustomDurationOpen={setCustomDurationOpen}
              setDraft={setDraft}
              setErrors={setErrors}
            /> : <><PatientPicker
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
                  setErrors((current) => withoutError(current, "durationMinutes"));
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
                      setErrors((current) => withoutError(current, "durationMinutes"));
                    }}
                  />
                  <span>min</span>
                </div> : null}
              </Field>
            </div></>}
            {realMode && event && appointmentActions && onAppointmentAction ? <div className={styles.clinicalActions} aria-label="Azioni appuntamento">
              <h3>Azioni</h3>
              <div>
                {availableCalendarV3RealAppointmentActions(appointmentActions).map((action) => <button
                  key={action.id}
                  type="button"
                  className={`${action.id === "register_session" ? styles.clinicalActionPrimary : styles.clinicalActionSecondary} ${action.destructive ? styles.clinicalActionDestructive : ""}`}
                  disabled={saving || Boolean(actionBusy)}
                  onClick={(clickEvent) => onAppointmentAction(action.id, clickEvent.currentTarget)}
                >{actionBusy === action.id ? "Operazione in corso…" : action.label}</button>)}
              </div>
              {actionError ? <p className={styles.drawerSaveError} role="alert">{actionError}</p> : null}
            </div> : null}
            {saveError ? <p className={styles.drawerSaveError} role="alert">{saveError}</p> : null}
          </div>

          <footer className={styles.drawerActions}>
            <button type="button" className={styles.secondaryAction} disabled={saving} onClick={onClose}>{event ? "Chiudi" : "Annulla"}</button>
            <button type="submit" className={styles.primaryAction} disabled={saving}>{saving ? "Salvataggio…" : event ? "Salva modifiche" : "Salva appuntamento"}</button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function RealAppointmentFields({ draft, errors, patientRef, patients, locations, services, existing, customDurationOpen, setCustomDurationOpen, setDraft, setErrors }: {
  draft: CalendarV3RealAppointmentDraft;
  errors: FieldErrors;
  patientRef: React.RefObject<HTMLInputElement | null>;
  patients: readonly Patient[];
  locations: readonly AppointmentLocation[];
  services: readonly AppointmentService[];
  existing: boolean;
  customDurationOpen: boolean;
  setCustomDurationOpen: (open: boolean) => void;
  setDraft: React.Dispatch<React.SetStateAction<CalendarAppointmentDraft>>;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
}) {
  const update = <K extends keyof CalendarV3RealAppointmentDraft>(key: K, value: CalendarV3RealAppointmentDraft[K]) => {
    setDraft((current) => isCalendarV3RealAppointmentDraft(current) ? { ...current, [key]: value } : current);
    setErrors((current) => withoutError(current, String(key)));
  };
  const availableLocations = selectableAppointmentLocations([...locations], draft.locationId);
  const availableServices = selectableAppointmentServices([...services], draft.serviceId);

  return <>
    <RealPatientPicker
      inputRef={patientRef}
      patients={patients}
      patientId={draft.patientId}
      value={draft.patientName}
      error={errors.patientId}
      onChange={(value) => { update("patientName", value); update("patientId", ""); }}
      onChoose={(patient) => {
        setDraft((current) => isCalendarV3RealAppointmentDraft(current)
          ? { ...current, patientId: patient.id, patientName: fullName(patient).trim() }
          : current);
        setErrors((current) => withoutError(current, "patientId"));
      }}
    />

    <Field label="Tipo" htmlFor="lab-appointment-type">
      <select id="lab-appointment-type" value={draft.appointmentType} onChange={(event) => update("appointmentType", event.target.value as CalendarV3RealAppointmentDraft["appointmentType"])}>
        <option value="regular">Seduta</option>
        <option value="assessment">Prima valutazione</option>
        <option value="checkup">Controllo</option>
        <option value="cancelled">Annullato</option>
      </select>
    </Field>

    <Field label="Prestazione (facoltativa)" htmlFor="lab-service">
      <select id="lab-service" value={draft.serviceId} onChange={(event) => {
        const service = services.find((item) => item.id === event.target.value) ?? null;
        const next = selectCalendarV3RealService(draft, service);
        setDraft(next);
        setCustomDurationOpen(!isCalendarLabDurationPreset(next.durationMinutes));
      }}>
        <option value="">Nessuna prestazione</option>
        {availableServices.map((service) => <option key={service.id} value={service.id}>{service.name}{!service.isActive ? " — Non attiva" : ""}</option>)}
      </select>
    </Field>

    <Field label="Sede (facoltativa)" htmlFor="lab-location">
      <div className={styles.locationControl}>
        {draft.locationId ? <span style={{ background: locations.find((item) => item.id === draft.locationId)?.color }} aria-hidden="true" /> : null}
        <select id="lab-location" value={draft.locationId} onChange={(event) => {
          const location = locations.find((item) => item.id === event.target.value) ?? null;
          setDraft(selectCalendarV3RealLocation(draft, location));
        }}>
          <option value="">Nessuna sede</option>
          {availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}{!location.isActive ? " — Non attiva" : ""}</option>)}
        </select>
      </div>
    </Field>

    <div className={styles.compactFields}>
      <Field label="Data *" htmlFor="lab-date" error={errors.date}>
        <input id="lab-date" name="date" type="date" value={draft.date} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "lab-date-error" : undefined} onChange={(event) => update("date", event.target.value)} />
      </Field>
      <Field label="Ora *" htmlFor="lab-start-time" error={errors.startTime}>
        <input id="lab-start-time" name="startTime" type="time" step={300} value={draft.startTime} aria-invalid={Boolean(errors.startTime)} aria-describedby={errors.startTime ? "lab-start-time-error" : undefined} onChange={(event) => update("startTime", event.target.value)} />
      </Field>
      <Field label="Durata *" htmlFor="lab-duration" error={errors.durationMinutes}>
        <select id="lab-duration" name="durationMinutes" value={customDurationOpen ? "custom" : String(draft.durationMinutes)} aria-invalid={Boolean(errors.durationMinutes)} onChange={(event) => {
          if (event.target.value === "custom") return setCustomDurationOpen(true);
          setCustomDurationOpen(false);
          update("durationMinutes", Number(event.target.value));
          update("durationManuallyEdited", true);
        }}>
          {CALENDAR_LAB_DURATION_PRESETS.map((duration) => <option key={duration} value={duration}>{duration} min</option>)}
          <option value="custom">Personalizzata…</option>
        </select>
        {customDurationOpen ? <div className={styles.customDurationControl}>
          <input type="number" name="durationMinutes" inputMode="numeric" min={15} step={5} value={draft.durationMinutes || ""} aria-label="Durata personalizzata in minuti" aria-invalid={Boolean(errors.durationMinutes)} onChange={(event) => {
            update("durationMinutes", Number(event.target.value));
            update("durationManuallyEdited", true);
          }} />
          <span>min</span>
        </div> : null}
      </Field>
    </div>

    <Field label="Prezzo (€)" htmlFor="lab-price" error={errors.price}>
      <input id="lab-price" name="price" type="text" inputMode="decimal" placeholder="Non specificato" value={draft.price} aria-invalid={Boolean(errors.price)} onChange={(event) => update("price", event.target.value)} />
    </Field>

    <Field label="Note" htmlFor="lab-notes">
      <textarea id="lab-notes" name="notes" rows={4} value={draft.notes} onChange={(event) => update("notes", event.target.value)} />
    </Field>

    {!existing ? <>
      <Field label="Ripetizione" htmlFor="lab-repeat">
        <select id="lab-repeat" name="repeat" value={draft.repeat} onChange={(event) => update("repeat", event.target.value as "none" | "weekly")}>
          <option value="none">Non ripetere</option>
          <option value="weekly">Ogni settimana</option>
        </select>
      </Field>
      {draft.repeat === "weekly" ? <Field label="Ripeti fino al *" htmlFor="lab-recurrence-end" error={errors.recurrenceEndDate}>
        <input id="lab-recurrence-end" name="recurrenceEndDate" type="date" min={draft.date} value={draft.recurrenceEndDate} aria-invalid={Boolean(errors.recurrenceEndDate)} onChange={(event) => update("recurrenceEndDate", event.target.value)} />
      </Field> : null}
    </> : draft.recurrenceSeriesId ? <p className={styles.recurrenceNote}>Al salvataggio potrai scegliere a quali appuntamenti della serie applicare la modifica.</p> : null}
  </>;
}

function RealPatientPicker({ inputRef, patients, patientId, value, error, onChange, onChoose }: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  patients: readonly Patient[];
  patientId: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onChoose: (patient: Patient) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("it");
    return patients.filter((patient) => fullName(patient).toLocaleLowerCase("it").includes(query));
  }, [patients, value]);
  const choose = (patient: Patient) => { onChoose(patient); setOpen(false); };
  return <Field label="Paziente *" htmlFor="lab-patient" error={error}>
    <div className={styles.patientPicker}>
      <input ref={inputRef} id="lab-patient" name="patientId" type="text" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && matches[activeIndex] ? `${listId}-${matches[activeIndex].id}` : undefined} aria-invalid={Boolean(error)} placeholder="Cerca paziente" value={value} onClick={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.max(index - 1, 0)); }
        else if (event.key === "Enter" && open && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]); }
        else if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      }} />
      {open ? <div id={listId} className={styles.patientOptions} role="listbox" aria-label="Pazienti">
        {matches.length ? matches.map((patient, index) => <button key={patient.id} id={`${listId}-${patient.id}`} type="button" role="option" aria-selected={patient.id === patientId || index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(patient)}>{fullName(patient)}</button>) : <p>Nessun paziente trovato.</p>}
      </div> : null}
    </div>
  </Field>;
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

function withoutError(errors: FieldErrors, key: string): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

function formatDrawerDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Data da definire";
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}
