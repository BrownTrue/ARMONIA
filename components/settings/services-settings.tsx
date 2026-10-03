"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { Field, Textarea } from "@/components/form-controls";
import { CalendarColorPicker } from "@/components/settings/calendar-color-picker";
import { useData } from "@/components/data-provider";
import { centsToEuroInput, euroInputToCents, formatEuroCents } from "@/lib/calendar-v2";
import type { AppointmentService } from "@/lib/types";
import { uid } from "@/lib/types";
import { focusFirstInvalidField, validateServiceForm, type FieldErrors } from "@/lib/form-validation";

const sortServices = (services: AppointmentService[]) => [...services].sort((a, b) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "it"),
);

function humanServiceError(cause: unknown, action: "save" | "delete") {
  const message = cause instanceof Error ? cause.message : "";
  if (/collegata|disattiv/i.test(message) || /23503|foreign key/i.test(message)) {
    return "Questa prestazione è già collegata ad alcuni appuntamenti. Puoi disattivarla invece di eliminarla.";
  }
  return action === "delete"
    ? "Non è stato possibile eliminare la prestazione. Riprova."
    : "Non è stato possibile salvare la prestazione. Controlla i dati e riprova.";
}

export function ServicesSettings() {
  const { data, saveAppointmentService, setAppointmentServiceActive, deleteAppointmentService } = useData();
  const services = useMemo(() => sortServices(data.services), [data.services]);
  const [editing, setEditing] = useState<AppointmentService | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const openNew = () => { const timestamp = new Date().toISOString(); setEditing({ id: uid(), name: "", description: "", defaultDurationMinutes: 0, defaultPriceCents: undefined, isActive: true, displayOrder: data.services.reduce((max, item) => Math.max(max, item.displayOrder), -1) + 1, createdAt: timestamp, updatedAt: timestamp }); };
  const toggleActive = async (service: AppointmentService) => { setBusyId(service.id); setNotice(null); try { await setAppointmentServiceActive(service.id, !service.isActive); setNotice({ kind: "success", text: service.isActive ? "Prestazione disattivata." : "Prestazione riattivata." }); } catch { setNotice({ kind: "error", text: "Non è stato possibile aggiornare lo stato della prestazione. Riprova." }); } finally { setBusyId(null); } };
  const remove = async (service: AppointmentService) => { if (!confirm(`Eliminare la prestazione “${service.name}”? Questa azione è disponibile solo se non è mai stata usata.`)) return; setBusyId(service.id); setNotice(null); try { await deleteAppointmentService(service.id); setNotice({ kind: "success", text: "Prestazione eliminata." }); } catch (cause) { setNotice({ kind: "error", text: humanServiceError(cause, "delete") }); } finally { setBusyId(null); } };

  return <section className="card p-4 sm:p-6" aria-labelledby="services-settings-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 id="services-settings-title" className="text-lg font-bold">Prestazioni</h3><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Crea le prestazioni che utilizzi più spesso per velocizzare la creazione degli appuntamenti.</p></div><button type="button" className="btn btn-primary shrink-0" onClick={openNew}>Aggiungi prestazione</button></div>
    {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${notice.kind === "error" ? "bg-red-50 text-red-700" : "bg-sage-50 text-sage-700"}`}>{notice.text}</p>}
    {!services.length ? <div className="mt-5 rounded-2xl border border-dashed border-sage-200 bg-sage-50/50 p-5 text-center sm:p-7"><p className="font-bold">Non hai ancora aggiunto prestazioni.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Puoi crearle per compilare più velocemente durata e, se vuoi, prezzo degli appuntamenti.</p><button type="button" className="btn btn-primary mt-4" onClick={openNew}>Aggiungi prestazione</button></div> : <ul className="mt-5 space-y-3">{services.map((service) => <li key={service.id} className={`rounded-2xl border p-4 ${service.isActive ? "border-sage-100 bg-white" : "border-slate-200 bg-slate-50"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3">{service.color && <span className="mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-white shadow" style={{backgroundColor:service.color}} aria-label={`Colore ${service.color}`}/>}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-bold">{service.name}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${service.isActive ? "bg-sage-50 text-sage-700" : "bg-slate-200 text-slate-600"}`}>{service.isActive ? "Attiva" : "Non attiva"}</span></div>{service.description && <p className="mt-1 break-words text-sm text-slate-500">{service.description}</p>}</div></div><div className="shrink-0 text-right text-sm"><p className="font-bold text-slate-700">{service.defaultDurationMinutes} min</p>{service.defaultPriceCents !== undefined && <p className="mt-1 text-slate-500">{formatEuroCents(service.defaultPriceCents)}</p>}</div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-sage-50 pt-3"><button type="button" className="btn btn-quiet flex-1 sm:flex-none" onClick={() => setEditing(service)}>Modifica</button><button type="button" disabled={busyId === service.id} className="btn btn-quiet flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none" onClick={() => void toggleActive(service)}>{service.isActive ? "Disattiva" : "Riattiva"}</button><button type="button" disabled={busyId === service.id} className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50" onClick={() => void remove(service)}>Elimina</button></div></li>)}</ul>}
    {editing && (
      <ServiceModal service={editing} usedColors={data.services.filter((item) => item.id !== editing.id)} onClose={() => setEditing(null)} onSave={async (service) => { await saveAppointmentService(service); setEditing(null); setNotice({ kind: "success", text: "Prestazione salvata." }); }}/>
    )}
  </section>;
}

function ServiceModal({ service, usedColors, onClose, onSave }: { service: AppointmentService; usedColors: AppointmentService[]; onClose: () => void; onSave: (service: AppointmentService) => Promise<void> }) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [duration, setDuration] = useState(service.defaultDurationMinutes ? String(service.defaultDurationMinutes) : "");
  const [price, setPrice] = useState(centsToEuroInput(service.defaultPriceCents));
  const [color, setColor] = useState<string | undefined>(service.color);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const clearFieldError = (field: string) => setFieldErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  return <Modal title={service.name ? "Modifica prestazione" : "Nuova prestazione"} onClose={() => !busy && onClose()}><form noValidate onSubmit={async (event) => { event.preventDefault(); const cleanName = name.trim(), durationNumber = Number(duration); const errors=validateServiceForm({name,duration,price}); if(Object.keys(errors).length){setFieldErrors(errors);setServerError(null);focusFirstInvalidField(errors);return;} const cents=euroInputToCents(price); setBusy(true); setFieldErrors({}); setServerError(null); try { await onSave({ ...service, name: cleanName, description: description.trim(), defaultDurationMinutes: durationNumber, defaultPriceCents: cents, color, updatedAt: new Date().toISOString() }); } catch (cause) { setServerError(humanServiceError(cause, "save")); setBusy(false); } }}><div className="space-y-4"><Field id="service-name" data-validation-field="name" label="Nome prestazione *" required maxLength={120} placeholder="Seduta logopedica" value={name} error={fieldErrors.name} onChange={(event) => {setName(event.target.value);clearFieldError("name");}}/><Textarea label="Descrizione (facoltativa)" value={description} onChange={(event) => setDescription(event.target.value)}/><div className="grid gap-4 sm:grid-cols-2"><Field id="service-duration" data-validation-field="duration" label="Durata predefinita (minuti) *" required type="number" min={5} max={1440} step={5} placeholder="Es. 50" value={duration} error={fieldErrors.duration} onChange={(event) => {setDuration(event.target.value);clearFieldError("duration");}}/><Field id="service-price" data-validation-field="price" label="Prezzo predefinito (facoltativo)" inputMode="decimal" placeholder="Nessun prezzo" value={price} error={fieldErrors.price} onChange={(event) => {setPrice(event.target.value);clearFieldError("price");}}/></div><p className="text-xs leading-5 text-slate-500">Il prezzo è scelto da te. Lascia vuoto se non vuoi specificarlo; inserisci 0 per indicare una prestazione gratuita.</p><CalendarColorPicker value={color} onChange={setColor} onClear={() => setColor(undefined)} usedColors={usedColors} description="Se scegli un colore, verrà usato per questa prestazione; altrimenti il calendario userà il colore della sede."/></div>{serverError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{serverError}</p>}<div className="form-actions mt-6"><button type="button" disabled={busy} className="btn btn-quiet" onClick={onClose}>Annulla</button><button type="submit" disabled={busy} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Salvataggio…" : "Salva prestazione"}</button></div></form></Modal>;
}
