"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { Field } from "@/components/form-controls";
import { useData } from "@/components/data-provider";
import { LOCATION_COLOR_PALETTE, nextLocationColor } from "@/lib/calendar-v2";
import type { AppointmentLocation } from "@/lib/types";
import { uid } from "@/lib/types";

const sortLocations = (locations: AppointmentLocation[]) => [...locations].sort((a, b) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "it"),
);

function humanLocationError(cause: unknown, action: "save" | "delete") {
  const message = cause instanceof Error ? cause.message : "";
  if (/collegata|disattiv/i.test(message) || /23503|foreign key/i.test(message)) {
    return "Questa sede è già collegata ad alcuni appuntamenti. Puoi disattivarla invece di eliminarla.";
  }
  return action === "delete"
    ? "Non è stato possibile eliminare la sede. Riprova."
    : "Non è stato possibile salvare la sede. Controlla i dati e riprova.";
}

export function LocationsSettings() {
  const { data, saveAppointmentLocation, setAppointmentLocationActive, deleteAppointmentLocation } = useData();
  const locations = useMemo(() => sortLocations(data.locations), [data.locations]);
  const [editing, setEditing] = useState<AppointmentLocation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const openNew = () => {
    const timestamp = new Date().toISOString();
    setEditing({
      id: uid(), name: "", address: "", city: "",
      color: nextLocationColor(data.locations), isActive: true,
      displayOrder: data.locations.reduce((max, item) => Math.max(max, item.displayOrder), -1) + 1,
      createdAt: timestamp, updatedAt: timestamp,
    });
  };

  const toggleActive = async (location: AppointmentLocation) => {
    setBusyId(location.id); setNotice(null);
    try {
      await setAppointmentLocationActive(location.id, !location.isActive);
      setNotice({ kind: "success", text: location.isActive ? "Sede disattivata." : "Sede riattivata." });
    } catch {
      setNotice({ kind: "error", text: "Non è stato possibile aggiornare lo stato della sede. Riprova." });
    } finally { setBusyId(null); }
  };

  const remove = async (location: AppointmentLocation) => {
    if (!confirm(`Eliminare la sede “${location.name}”? Questa azione è disponibile solo se non è mai stata usata.`)) return;
    setBusyId(location.id); setNotice(null);
    try {
      await deleteAppointmentLocation(location.id);
      setNotice({ kind: "success", text: "Sede eliminata." });
    } catch (cause) {
      setNotice({ kind: "error", text: humanLocationError(cause, "delete") });
    } finally { setBusyId(null); }
  };

  return <section className="card p-4 sm:p-6" aria-labelledby="locations-settings-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h3 id="locations-settings-title" className="text-lg font-bold">Sedi</h3><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Organizza i luoghi in cui lavori e assegna a ciascuno un colore per riconoscerlo rapidamente nel calendario.</p></div>
      <button type="button" className="btn btn-primary shrink-0" onClick={openNew}>Aggiungi sede</button>
    </div>
    {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${notice.kind === "error" ? "bg-red-50 text-red-700" : "bg-sage-50 text-sage-700"}`}>{notice.text}</p>}
    {!locations.length ? <div className="mt-5 rounded-2xl border border-dashed border-sage-200 bg-sage-50/50 p-5 text-center sm:p-7"><p className="font-bold">Non hai ancora aggiunto sedi.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Aggiungine una per distinguere rapidamente dove si svolgono i tuoi appuntamenti.</p><button type="button" className="btn btn-primary mt-4" onClick={openNew}>Aggiungi sede</button></div> : <ul className="mt-5 space-y-3">
      {locations.map((location) => <li key={location.id} className={`rounded-2xl border p-4 ${location.isActive ? "border-sage-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex min-w-0 items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-white shadow" style={{ backgroundColor: location.color }} aria-label={`Colore ${location.color}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-bold">{location.name}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${location.isActive ? "bg-sage-50 text-sage-700" : "bg-slate-200 text-slate-600"}`}>{location.isActive ? "Attiva" : "Non attiva"}</span></div>{(location.address || location.city) && <p className="mt-1 break-words text-sm text-slate-500">{[location.address, location.city].filter(Boolean).join(" · ")}</p>}</div></div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-sage-50 pt-3"><button type="button" className="btn btn-quiet flex-1 sm:flex-none" onClick={() => setEditing(location)}>Modifica</button><button type="button" disabled={busyId === location.id} className="btn btn-quiet flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none" onClick={() => void toggleActive(location)}>{location.isActive ? "Disattiva" : "Riattiva"}</button><button type="button" disabled={busyId === location.id} className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50" onClick={() => void remove(location)}>Elimina</button></div>
      </li>)}
    </ul>}
    {editing && (
      <LocationModal location={editing} usedColors={data.locations} onClose={() => setEditing(null)} onSave={async (location) => { await saveAppointmentLocation(location); setEditing(null); setNotice({ kind: "success", text: "Sede salvata." }); }}/>
    )}
  </section>;
}

function LocationModal({ location, usedColors, onClose, onSave }: { location: AppointmentLocation; usedColors: AppointmentLocation[]; onClose: () => void; onSave: (location: AppointmentLocation) => Promise<void> }) {
  const [value, setValue] = useState(location);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <Modal title={location.name ? "Modifica sede" : "Nuova sede"} onClose={() => !busy && onClose()}><form onSubmit={async (event) => { event.preventDefault(); const name = value.name.trim(); if (!name) { setError("Inserisci il nome della sede."); return; } setBusy(true); setError(null); try { await onSave({ ...value, name, address: value.address.trim(), city: value.city.trim(), updatedAt: new Date().toISOString() }); } catch (cause) { setError(humanLocationError(cause, "save")); setBusy(false); } }}>
    <div className="space-y-4"><Field label="Nome sede *" required maxLength={120} placeholder="Studio privato" value={value.name} onChange={(event) => setValue((old) => ({ ...old, name: event.target.value }))}/><Field label="Indirizzo" placeholder="Via …" value={value.address} onChange={(event) => setValue((old) => ({ ...old, address: event.target.value }))}/><Field label="Città" placeholder="Avezzano" value={value.city} onChange={(event) => setValue((old) => ({ ...old, city: event.target.value }))}/>
      <fieldset><legend className="text-sm font-bold">Colore *</legend><p className="mt-1 text-xs text-slate-500">Il colore verrà utilizzato per riconoscere la sede nel calendario.</p><div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">{LOCATION_COLOR_PALETTE.map((color) => { const selected = value.color.toUpperCase() === color.hex; const alreadyUsed = usedColors.some((item) => item.id !== value.id && item.color.toUpperCase() === color.hex); return <button key={color.hex} type="button" aria-label={`${color.name}${selected ? ", selezionato" : ""}${alreadyUsed ? ", già utilizzato" : ""}`} aria-pressed={selected} title={color.name} onClick={() => setValue((old) => ({ ...old, color: color.hex }))} className={`grid aspect-square min-h-11 place-items-center rounded-xl border-2 outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 ${selected ? "border-slate-700" : "border-white"}`} style={{ backgroundColor: color.hex }}><span aria-hidden="true" className="text-lg font-black text-white drop-shadow">{selected ? "✓" : ""}</span></button>; })}</div></fieldset>
    </div>{error && <p role="alert" className="mt-4 text-sm font-bold text-red-700">{error}</p>}<div className="form-actions mt-6"><button type="button" disabled={busy} className="btn btn-quiet" onClick={onClose}>Annulla</button><button type="submit" disabled={busy} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Salvataggio…" : "Salva sede"}</button></div>
  </form></Modal>;
}
