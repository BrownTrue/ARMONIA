"use client";

import { useMemo, useRef, useState } from "react";
import { useData } from "@/components/data-provider";
import { DestructiveActionModal } from "@/components/destructive-action-modal";
import {
  CALENDAR_COLOR_PALETTE,
  centsToEuroInput,
  euroInputToCents,
  getCalendarCatalogLifecycle,
  type CalendarCatalogLifecycle,
} from "@/lib/calendar-v2";
import {
  createCalendarV3Location,
  createCalendarV3Service,
  calendarCatalogManagement,
  fixtureLocationFilterKey,
  fixtureServiceFilterKey,
  locationFilterKey,
  serviceFilterKey,
  type CalendarSidebarMode,
} from "@/lib/calendar-v3-lab/sidebar-settings";
import { validateLocationForm, validateServiceForm, type FieldErrors } from "@/lib/form-validation";
import type { AppointmentLocation, AppointmentService } from "@/lib/types";
import { uid } from "@/lib/types";
import { FALLBACK_APPOINTMENT_COLOR } from "@/lib/calendar-visual";
import styles from "./calendar-v3-lab.module.css";

type DeleteTarget =
  | { action: "delete" | "archive"; kind: "location"; item: AppointmentLocation }
  | { action: "delete" | "archive"; kind: "service"; item: AppointmentService };

const fixtureLocations = [
  { id: "fixture-location-centro", name: "Studio Centro", color: "#8EA6C4" },
  { id: "fixture-location-nord", name: "Studio Nord", color: "#A88BBC" },
];
const fixtureServices = [
  { id: "fixture-service-trattamento", name: "Trattamento", color: "#77A886" },
  { id: "fixture-service-valutazione", name: "Valutazione", color: "#D99B7B" },
  { id: "fixture-service-controllo", name: "Controllo", color: "#D6A84B" },
];

export function CalendarSidebarCatalog({ realMode, mode, hidden, onModeChange, onToggle }: {
  realMode: boolean;
  mode: CalendarSidebarMode;
  hidden: readonly string[];
  onModeChange: (mode: CalendarSidebarMode) => void;
  onToggle: (key: string) => void;
}) {
  const {
    data,
    saveAppointmentLocation,
    setAppointmentLocationActive,
    archiveAppointmentLocation,
    deleteAppointmentLocation,
    saveAppointmentService,
    setAppointmentServiceActive,
    archiveAppointmentService,
    deleteAppointmentService,
  } = useData();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const locations = useMemo(
    () => data.locations.filter((item) => !item.archivedAt).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "it")),
    [data.locations],
  );
  const services = useMemo(
    () => data.services.filter((item) => !item.archivedAt).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "it")),
    [data.services],
  );

  const openLocationCreate = () => {
    const timestamp = new Date().toISOString();
    setNotice(null);
    onModeChange({ kind: "location-create", location: createCalendarV3Location({ locations, id: uid(), timestamp }) });
  };
  const openServiceCreate = () => {
    const timestamp = new Date().toISOString();
    setNotice(null);
    onModeChange({ kind: "service-create", service: createCalendarV3Service({ services, id: uid(), timestamp }) });
  };
  const back = () => onModeChange({ kind: "main" });
  const locationLifecycle = mode.kind === "location-edit" ? getCalendarCatalogLifecycle({
    kind: "location", id: mode.location.id, archivedAt: mode.location.archivedAt,
    appointments: data.appointments, sessions: data.sessions,
  }) : null;
  const serviceLifecycle = mode.kind === "service-edit" ? getCalendarCatalogLifecycle({
    kind: "service", id: mode.service.id, archivedAt: mode.service.archivedAt,
    appointments: data.appointments, sessions: data.sessions,
  }) : null;

  const confirmDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      if (deleteTarget.kind === "location") {
        if (deleteTarget.action === "archive") await archiveAppointmentLocation(deleteTarget.item.id);
        else await deleteAppointmentLocation(deleteTarget.item.id);
      } else if (deleteTarget.action === "archive") await archiveAppointmentService(deleteTarget.item.id);
      else await deleteAppointmentService(deleteTarget.item.id);
      const label = deleteTarget.action === "archive"
        ? `${deleteTarget.kind === "location" ? "Sede rimossa" : "Prestazione rimossa"} dal catalogo.`
        : deleteTarget.kind === "location" ? "Sede eliminata." : "Prestazione eliminata.";
      setDeleteTarget(null);
      onModeChange({ kind: "main" });
      setNotice({ tone: "success", message: label });
    } catch (cause) {
      setDeleteError(catalogError(cause, deleteTarget.kind, deleteTarget.action));
    } finally {
      setDeleteBusy(false);
    }
  };

  return <>
    {mode.kind === "main" ? <div className={styles.sidebarCatalogMain}>
      {notice ? <p className={`${styles.sidebarNotice} ${notice.tone === "error" ? styles.sidebarNoticeError : ""}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.message}</p> : null}
      <CatalogSection
        title="Sedi"
        canConfigure={realMode}
        items={(realMode ? locations : fixtureLocations).map((item) => ({
          id: item.id,
          label: item.name,
          color: item.color,
          active: "isActive" in item ? Boolean(item.isActive) : true,
          filterKey: realMode ? locationFilterKey(item.id) : fixtureLocationFilterKey(item.name),
        }))}
        hidden={hidden}
        onToggle={onToggle}
        onCreate={openLocationCreate}
        onEdit={(id) => {
          const location = locations.find((item) => item.id === id);
          if (location) { setNotice(null); onModeChange({ kind: "location-edit", location }); }
        }}
      />
      <CatalogSection
        title="Prestazioni"
        canConfigure={realMode}
        items={(realMode ? services : fixtureServices).map((item) => ({
          id: item.id,
          label: item.name,
          color: item.color || FALLBACK_APPOINTMENT_COLOR,
          active: "isActive" in item ? Boolean(item.isActive) : true,
          filterKey: realMode ? serviceFilterKey(item.id) : fixtureServiceFilterKey(item.name),
        }))}
        hidden={hidden}
        onToggle={onToggle}
        onCreate={openServiceCreate}
        onEdit={(id) => {
          const service = services.find((item) => item.id === id);
          if (service) { setNotice(null); onModeChange({ kind: "service-edit", service }); }
        }}
      />
    </div> : mode.kind === "location-create" || mode.kind === "location-edit" ? <LocationInspector
      key={`${mode.kind}-${mode.location.id}`}
      location={mode.location}
      isNew={mode.kind === "location-create"}
      lifecycle={locationLifecycle}
      onBack={back}
      onDelete={locationLifecycle?.state === "unused" ? (location) => { setDeleteError(""); setDeleteTarget({ action: "delete", kind: "location", item: location }); } : undefined}
      onArchive={locationLifecycle?.state === "historical_only" ? (location) => { setDeleteError(""); setDeleteTarget({ action: "archive", kind: "location", item: location }); } : undefined}
      onToggleActive={mode.kind === "location-edit" ? async (location, isActive) => setAppointmentLocationActive(location.id, isActive) : undefined}
      onSave={async (location) => {
        await saveAppointmentLocation(location);
        onModeChange({ kind: "main" });
        setNotice({ tone: "success", message: mode.kind === "location-create" ? "Sede creata." : "Sede aggiornata." });
      }}
    /> : <ServiceInspector
      key={`${mode.kind}-${mode.service.id}`}
      service={mode.service}
      isNew={mode.kind === "service-create"}
      lifecycle={serviceLifecycle}
      onBack={back}
      onDelete={serviceLifecycle?.state === "unused" ? (service) => { setDeleteError(""); setDeleteTarget({ action: "delete", kind: "service", item: service }); } : undefined}
      onArchive={serviceLifecycle?.state === "historical_only" ? (service) => { setDeleteError(""); setDeleteTarget({ action: "archive", kind: "service", item: service }); } : undefined}
      onToggleActive={mode.kind === "service-edit" ? async (service, isActive) => setAppointmentServiceActive(service.id, isActive) : undefined}
      onSave={async (service) => {
        await saveAppointmentService(service);
        onModeChange({ kind: "main" });
        setNotice({ tone: "success", message: mode.kind === "service-create" ? "Prestazione creata." : "Prestazione aggiornata." });
      }}
    />}
    {deleteTarget ? <DestructiveActionModal
      title={deleteTarget.action === "archive"
        ? `Rimuovere ${deleteTarget.kind === "location" ? "la sede" : "la prestazione"} dal catalogo?`
        : deleteTarget.kind === "location" ? "Eliminare questa sede?" : "Eliminare questa prestazione?"}
      description={deleteTarget.action === "archive"
        ? `“${deleteTarget.item.name}” non sarà più disponibile nel catalogo operativo. Gli appuntamenti storici manterranno nome e colore.`
        : `La rimozione di ${deleteTarget.kind === "location" ? "questa sede" : "questa prestazione"} è definitiva. Nessun appuntamento risulta collegato a “${deleteTarget.item.name}”.`}
      confirmLabel={deleteTarget.action === "archive" ? "Rimuovi dal catalogo" : "Elimina definitivamente"}
      busy={deleteBusy}
      error={deleteError || undefined}
      onClose={() => { if (!deleteBusy) { setDeleteTarget(null); setDeleteError(""); } }}
      onConfirm={confirmDelete}
    /> : null}
  </>;
}

function CatalogSection({ title, items, canConfigure, hidden, onToggle, onCreate, onEdit }: {
  title: string;
  items: Array<{ id: string; label: string; color: string; active: boolean; filterKey: string }>;
  canConfigure: boolean;
  hidden: readonly string[];
  onToggle: (key: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  return <section className={styles.filterSection}>
    <header className={styles.filterSectionHeader}>
      <h2>{title}</h2>
      {canConfigure ? <button type="button" className={styles.catalogAdd} aria-label={`Aggiungi ${title.toLocaleLowerCase("it")}`} onClick={onCreate}>+</button> : null}
    </header>
    <div>{items.map((item) => {
      const active = !hidden.includes(item.filterKey);
      return <div key={item.id} className={`${styles.catalogRow} ${!item.active ? styles.catalogRowInactive : ""}`}>
        <button type="button" className={styles.catalogFilter} aria-pressed={active} onClick={() => onToggle(item.filterKey)}>
          <span style={{ background: active ? item.color : "transparent", borderColor: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
        </button>
        {canConfigure ? <button type="button" className={styles.catalogEdit} aria-label={`Modifica ${item.label}`} onClick={() => onEdit(item.id)}>•••</button> : null}
      </div>;
    })}</div>
    {!items.length ? <p className={styles.catalogEmpty}>Nessun elemento configurato.</p> : null}
  </section>;
}

function LocationInspector({ location, isNew, lifecycle, onBack, onSave, onDelete, onArchive, onToggleActive }: {
  location: AppointmentLocation;
  isNew: boolean;
  lifecycle: CalendarCatalogLifecycle | null;
  onBack: () => void;
  onSave: (location: AppointmentLocation) => Promise<void>;
  onDelete?: (location: AppointmentLocation) => void;
  onArchive?: (location: AppointmentLocation) => void;
  onToggleActive?: (location: AppointmentLocation, isActive: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState(location);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [busyAction, setBusyAction] = useState<"save" | "toggle" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyAction) return;
    const nextErrors = validateLocationForm({ name: draft.name });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return focusSidebarError(formRef.current, nextErrors);
    setBusyAction("save"); setServerError("");
    try {
      await onSave({ ...draft, name: draft.name.trim(), address: draft.address.trim(), city: draft.city.trim(), updatedAt: new Date().toISOString() });
    } catch (cause) {
      setServerError(catalogError(cause, "location", "save"));
      setBusyAction(null);
    }
  };
  const toggleActive = async () => {
    if (!onToggleActive || busyAction) return;
    const nextActive = !draft.isActive;
    setBusyAction("toggle"); setServerError("");
    try {
      await onToggleActive(draft, nextActive);
      setDraft((current) => ({ ...current, isActive: nextActive }));
    } catch (cause) {
      setServerError(catalogError(cause, "location", "toggle"));
    } finally {
      setBusyAction(null);
    }
  };
  return <SidebarInspector title={isNew ? "Nuova sede" : "Modifica sede"} onBack={onBack} busy={Boolean(busyAction)}>
    <form ref={formRef} className={styles.catalogForm} noValidate onSubmit={submit}>
      <SidebarField label="Nome" error={errors.name}><input autoFocus name="name" maxLength={120} value={draft.name} aria-invalid={Boolean(errors.name)} onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setErrors(withoutField(errors, "name")); }} /></SidebarField>
      <SidebarField label="Indirizzo"><input maxLength={160} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></SidebarField>
      <SidebarField label="Città"><input maxLength={120} value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></SidebarField>
      <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color: color ?? draft.color })} />
      {isNew ? <ActiveControl active={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} noun="sede" /> : lifecycle ? <CatalogLifecycleActions kind="location" active={draft.isActive} lifecycle={lifecycle} busy={Boolean(busyAction)} toggling={busyAction === "toggle"} onToggle={() => void toggleActive()} onDelete={onDelete ? () => onDelete(draft) : undefined} onArchive={onArchive ? () => onArchive(draft) : undefined} /> : null}
      {serverError ? <p className={styles.catalogFormError} role="alert">{serverError}</p> : null}
      <InspectorActions busy={Boolean(busyAction)} saving={busyAction === "save"} saveLabel={isNew ? "Crea sede" : "Salva modifiche"} />
    </form>
  </SidebarInspector>;
}

function ServiceInspector({ service, isNew, lifecycle, onBack, onSave, onDelete, onArchive, onToggleActive }: {
  service: AppointmentService;
  isNew: boolean;
  lifecycle: CalendarCatalogLifecycle | null;
  onBack: () => void;
  onSave: (service: AppointmentService) => Promise<void>;
  onDelete?: (service: AppointmentService) => void;
  onArchive?: (service: AppointmentService) => void;
  onToggleActive?: (service: AppointmentService, isActive: boolean) => Promise<void>;
}) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [duration, setDuration] = useState(service.defaultDurationMinutes ? String(service.defaultDurationMinutes) : "");
  const [price, setPrice] = useState(centsToEuroInput(service.defaultPriceCents));
  const [color, setColor] = useState(service.color);
  const [isActive, setIsActive] = useState(service.isActive);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [busyAction, setBusyAction] = useState<"save" | "toggle" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyAction) return;
    const nextErrors = validateServiceForm({ name, duration, price });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return focusSidebarError(formRef.current, nextErrors);
    setBusyAction("save"); setServerError("");
    try {
      await onSave({ ...service, name: name.trim(), description: description.trim(), defaultDurationMinutes: Number(duration), defaultPriceCents: euroInputToCents(price), color, isActive, updatedAt: new Date().toISOString() });
    } catch (cause) {
      setServerError(catalogError(cause, "service", "save"));
      setBusyAction(null);
    }
  };
  const toggleActive = async () => {
    if (!onToggleActive || busyAction) return;
    const nextActive = !isActive;
    setBusyAction("toggle"); setServerError("");
    try {
      await onToggleActive(service, nextActive);
      setIsActive(nextActive);
    } catch (cause) {
      setServerError(catalogError(cause, "service", "toggle"));
    } finally {
      setBusyAction(null);
    }
  };
  return <SidebarInspector title={isNew ? "Nuova prestazione" : "Modifica prestazione"} onBack={onBack} busy={Boolean(busyAction)}>
    <form ref={formRef} className={styles.catalogForm} noValidate onSubmit={submit}>
      <SidebarField label="Nome" error={errors.name}><input autoFocus name="name" maxLength={120} value={name} aria-invalid={Boolean(errors.name)} onChange={(event) => { setName(event.target.value); setErrors(withoutField(errors, "name")); }} /></SidebarField>
      <SidebarField label="Descrizione"><textarea rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></SidebarField>
      <SidebarField label="Durata predefinita" error={errors.duration}><div className={styles.catalogInputSuffix}><input name="duration" type="number" min={5} max={1440} step={5} value={duration} aria-invalid={Boolean(errors.duration)} onChange={(event) => { setDuration(event.target.value); setErrors(withoutField(errors, "duration")); }} /><span>min</span></div></SidebarField>
      <SidebarField label="Prezzo predefinito" error={errors.price}><div className={styles.catalogInputSuffix}><input name="price" inputMode="decimal" placeholder="Non specificato" value={price} aria-invalid={Boolean(errors.price)} onChange={(event) => { setPrice(event.target.value); setErrors(withoutField(errors, "price")); }} /><span>€</span></div></SidebarField>
      <p className={styles.catalogHint}>Vuoto = non specificato · 0 = gratuito</p>
      <ColorPicker value={color} optional onChange={setColor} />
      {isNew ? <ActiveControl active={isActive} onChange={setIsActive} noun="prestazione" /> : lifecycle ? <CatalogLifecycleActions kind="service" active={isActive} lifecycle={lifecycle} busy={Boolean(busyAction)} toggling={busyAction === "toggle"} onToggle={() => void toggleActive()} onDelete={onDelete ? () => onDelete({ ...service, name, description, defaultDurationMinutes: Number(duration) || service.defaultDurationMinutes, defaultPriceCents: service.defaultPriceCents, color, isActive }) : undefined} onArchive={onArchive ? () => onArchive(service) : undefined} /> : null}
      {serverError ? <p className={styles.catalogFormError} role="alert">{serverError}</p> : null}
      <InspectorActions busy={Boolean(busyAction)} saving={busyAction === "save"} saveLabel={isNew ? "Crea prestazione" : "Salva modifiche"} />
    </form>
  </SidebarInspector>;
}

function SidebarInspector({ title, onBack, busy, children }: { title: string; onBack: () => void; busy: boolean; children: React.ReactNode }) {
  return <section className={styles.sidebarInspector} aria-labelledby="calendar-sidebar-inspector-title">
    <header><button type="button" disabled={busy} onClick={onBack} aria-label="Torna ai filtri">←</button><div><span>CALENDARIO</span><h2 id="calendar-sidebar-inspector-title">{title}</h2></div></header>
    {children}
  </section>;
}

function SidebarField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className={styles.catalogField}><span>{label}</span>{children}{error ? <small role="alert">{error}</small> : null}</label>;
}

function ColorPicker({ value, optional = false, onChange }: { value?: string; optional?: boolean; onChange: (color: string | undefined) => void }) {
  return <fieldset className={styles.catalogColors}><legend>Colore</legend><div>
    {optional ? <button type="button" className={styles.catalogAutomaticColor} aria-pressed={!value} onClick={() => onChange(undefined)} title="Automatico dalla sede"><span>Auto</span></button> : null}
    {CALENDAR_COLOR_PALETTE.map((color) => <button key={color.hex} type="button" aria-label={color.name} aria-pressed={value?.toUpperCase() === color.hex} title={color.name} style={{ "--catalog-color": color.hex } as React.CSSProperties} onClick={() => onChange(color.hex)}><span /></button>)}
  </div></fieldset>;
}

function ActiveControl({ active, noun, onChange }: { active: boolean; noun: string; onChange: (active: boolean) => void }) {
  return <label className={styles.catalogActive}><input type="checkbox" checked={active} onChange={(event) => onChange(event.target.checked)} /><span>{noun === "sede" ? "Sede attiva" : "Prestazione attiva"}</span></label>;
}

function CatalogLifecycleActions({ kind, active, lifecycle, busy, toggling, onToggle, onDelete, onArchive }: {
  kind: "location" | "service";
  active: boolean;
  lifecycle: CalendarCatalogLifecycle;
  busy: boolean;
  toggling: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}) {
  const noun = kind === "location" ? "sede" : "prestazione";
  const management = calendarCatalogManagement({ kind, active, lifecycle: lifecycle.state });
  return <section className={styles.catalogLifecycle} aria-label={`Gestione ${noun}`}>
    {lifecycle.state === "historical_only" ? <p>Questa {noun} è usata soltanto nello storico. Puoi rimuoverla dal catalogo senza alterare gli appuntamenti esistenti.</p> : null}
    {lifecycle.state === "operationally_used" ? <p>Questa {noun} è utilizzata da {lifecycle.blockingAppointmentCount} {lifecycle.blockingAppointmentCount === 1 ? "appuntamento futuro o ancora da registrare" : "appuntamenti futuri o ancora da registrare"}. Modifica prima gli appuntamenti oppure disattiva la {noun}.</p> : null}
    <div>
      <button type="button" disabled={busy} aria-busy={toggling} onClick={onToggle}>{toggling ? "Aggiornamento…" : management.toggleLabel}</button>
      {management.deleteLabel && onDelete ? <button type="button" className={styles.catalogDelete} disabled={busy} onClick={onDelete}>{management.deleteLabel}</button> : null}
      {management.archiveLabel && onArchive ? <button type="button" className={styles.catalogDelete} disabled={busy} onClick={onArchive}>{management.archiveLabel}</button> : null}
    </div>
  </section>;
}

function InspectorActions({ busy, saving, saveLabel }: { busy: boolean; saving: boolean; saveLabel: string }) {
  return <div className={styles.catalogActions}><span /><button type="submit" disabled={busy} aria-busy={saving}>{saving ? "Salvataggio…" : saveLabel}</button></div>;
}

function focusSidebarError(form: HTMLFormElement | null, errors: FieldErrors) {
  const first = Object.keys(errors)[0];
  window.requestAnimationFrame(() => form?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
}

function withoutField(errors: FieldErrors, field: string): FieldErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

function catalogError(cause: unknown, kind: "location" | "service", action: "save" | "delete" | "archive" | "toggle") {
  const message = cause instanceof Error
    ? cause.message
    : cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string"
      ? cause.message
      : "";
  if (action === "delete" && (/collegat|disattiv/i.test(message) || /23503|foreign key/i.test(message))) {
    return kind === "location"
      ? "Questa sede è collegata ad appuntamenti. Disattivala per conservarne lo storico."
      : "Questa prestazione è collegata ad appuntamenti. Disattivala per conservarne lo storico.";
  }
  if (action === "delete") return `Non è stato possibile eliminare ${kind === "location" ? "la sede" : "la prestazione"}. Riprova.`;
  if (action === "archive") {
    if (/calendar_catalog_archive_blocked/.test(message)) return `Questa ${kind === "location" ? "sede" : "prestazione"} è ora usata da appuntamenti futuri o ancora da registrare. Modifica prima quegli appuntamenti oppure disattivala.`;
    return `Non è stato possibile rimuovere ${kind === "location" ? "la sede" : "la prestazione"} dal catalogo. Riprova.`;
  }
  if (action === "toggle") return `Non è stato possibile aggiornare lo stato ${kind === "location" ? "della sede" : "della prestazione"}. Riprova.`;
  return `Non è stato possibile salvare ${kind === "location" ? "la sede" : "la prestazione"}. Controlla i dati e riprova.`;
}
