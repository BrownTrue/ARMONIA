"use client";

import { useEffect, useId, useState } from "react";
import type { CalendarFeedTitleFormat } from "@/lib/calendar-feed/ics";

type FeedStatus = {
  active: boolean;
  titleFormat?: CalendarFeedTitleFormat;
  feedUrl?: string;
};

const titleOptions: Array<{ value: CalendarFeedTitleFormat; label: string; preview: string }> = [
  { value: "abbreviated", label: "Predefinito", preview: "Appuntamento · Mario R." },
  { value: "full", label: "Nome completo", preview: "Appuntamento · Mario Rossi" },
  { value: "private", label: "Massima privacy", preview: "Appuntamento ARMONIA" },
];

const friendlyError = (status?: number) => status && status >= 500
  ? "Calendario ARMONIA temporaneamente non disponibile."
  : "Non è stato possibile aggiornare il Calendario ARMONIA. Riprova.";

export function CalendarFeedSettings({ cloudAvailable, googleConnected }: { cloudAvailable: boolean; googleConnected: boolean }) {
  const contentId = useId();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"loading" | "inactive" | "active" | "error" | "local">(cloudAvailable ? "loading" : "local");
  const [titleFormat, setTitleFormat] = useState<CalendarFeedTitleFormat>("abbreviated");
  const [feedUrl, setFeedUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  useEffect(() => {
    if (!cloudAvailable) return;
    let current = true;
    fetch("/api/calendar-feed", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<FeedStatus>;
      })
      .then(value => {
        if (!current) return;
        setStatus(value.active ? "active" : "inactive");
        setTitleFormat(value.titleFormat || "abbreviated");
        setFeedUrl(value.feedUrl);
      })
      .catch(cause => {
        if (!current) return;
        setStatus("error");
        setExpanded(true);
        const code = cause instanceof Error ? Number(cause.message) : undefined;
        setMessage({ kind: "error", text: friendlyError(code) });
      });
    return () => { current = false; };
  }, [cloudAvailable]);

  const request = async (method: "POST" | "PATCH" | "DELETE", body?: object) => {
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch("/api/calendar-feed", {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error(String(response.status));
      if (method === "DELETE") {
        setStatus("inactive");
        setFeedUrl(undefined);
        setMessage({ kind: "success", text: "Calendario ARMONIA disattivato." });
        return;
      }
      const value = await response.json() as FeedStatus;
      setStatus(value.active ? "active" : "inactive");
      setTitleFormat(value.titleFormat || titleFormat);
      setFeedUrl(value.feedUrl);
      return value;
    } catch (cause) {
      const code = cause instanceof Error ? Number(cause.message) : undefined;
      setStatus("error");
      setMessage({ kind: "error", text: friendlyError(code) });
    } finally {
      setBusy(false);
    }
  };

  const active = status === "active";
  const selected = titleOptions.find(option => option.value === titleFormat) || titleOptions[0];
  const badge = status === "active"
    ? { text: "Calendario attivo", className: "bg-sage-50 text-sage-700" }
    : status === "error"
      ? { text: "Calendario non disponibile", className: "bg-red-50 text-red-700" }
      : status === "local"
        ? { text: "Solo cloud", className: "bg-slate-100 text-slate-500" }
        : { text: status === "loading" ? "Verifica in corso" : "Non configurato", className: "bg-slate-100 text-slate-600" };

  return <div className="card p-4 sm:p-6">
    <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(open => !open)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-4">
      <span className="min-w-0"><span className="block font-bold">Calendario ARMONIA</span><span className="mt-1 block text-sm leading-5 text-slate-500">Visualizza gli appuntamenti di ARMONIA in Apple Calendar, Outlook e altri calendari compatibili.</span></span>
      <span className="flex min-w-0 items-center justify-end gap-2"><span className={`max-w-[12rem] rounded-full px-3 py-1 text-right text-xs font-bold leading-snug sm:text-sm ${badge.className}`}>{badge.text}</span><span aria-hidden="true" className="shrink-0 text-xl leading-none text-sage-700">{expanded ? "⌃" : "⌄"}</span></span>
    </button>
    {expanded && <div id={contentId} className="mt-5 border-t border-sage-100 pt-5">
      {status === "local" ? <div className="rounded-xl bg-sage-50 p-4 text-sm text-slate-600"><p className="font-bold text-slate-800">Disponibile nella versione cloud di ARMONIA</p><p className="mt-1">Il calendario sottoscrivibile non è disponibile durante lo sviluppo locale.</p></div> : <>
        {!active && <div>
          <h3 className="font-bold">Calendario ARMONIA</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Crea un calendario privato in sola lettura che puoi aggiungere ad Apple Calendar, Outlook e altri client compatibili.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600"><li>Gli appuntamenti si modificano sempre in ARMONIA.</li><li>Il calendario esterno li visualizza soltanto.</li><li>Gli aggiornamenti dipendono dalla frequenza di refresh dell’app calendario.</li></ul>
        </div>}
        <fieldset className="mt-5" disabled={busy || status === "loading" || status === "error"}>
          <legend className="text-sm font-bold">Titolo degli appuntamenti</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">{titleOptions.map(option => <label key={option.value} className={`cursor-pointer rounded-xl border p-3 text-sm ${titleFormat === option.value ? "border-sage-500 bg-sage-50" : "border-sage-100 bg-white"}`}><span className="flex items-start gap-2"><input type="radio" name="calendar-feed-title" value={option.value} checked={titleFormat === option.value} onChange={() => { setTitleFormat(option.value); if (active) void request("PATCH", { titleFormat: option.value }); }} className="mt-0.5"/><span><span className="block text-xs font-bold uppercase tracking-wide text-sage-700">{option.label}</span><span className="mt-1 block text-slate-600">{option.preview}</span></span></span></label>)}</div>
        </fieldset>
        <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm"><p><b>Anteprima:</b> {selected.preview}</p><p className="mt-1 text-slate-500">Il titolo sarà visibile nei dispositivi e nelle app calendario in cui aggiungi questo calendario.</p></div>
        {googleConnected && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Se il calendario Google di ARMONIA è già visibile nella stessa app, potresti vedere gli appuntamenti duplicati.</p>}

        {!active && status !== "loading" && <button type="button" disabled={busy || status === "error"} onClick={() => void request("POST", { titleFormat })} className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{busy ? "Attivazione…" : "Attiva calendario ARMONIA"}</button>}

        {active && <>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" disabled={busy || !feedUrl} onClick={async () => { if (!feedUrl) return; try { await navigator.clipboard.writeText(feedUrl); setMessage({ kind: "success", text: "Link copiato" }); } catch { setMessage({ kind: "error", text: "Non è stato possibile copiare il link. Riprova." }); } }} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Copia link calendario</button>
            <button type="button" disabled={busy || !feedUrl} onClick={() => { if (feedUrl) window.location.href = feedUrl.replace(/^https?:\/\//, "webcal://"); }} className="btn btn-quiet w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Apri in Apple Calendar</button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">Aggiornamenti: l&apos;app calendario decide ogni quanto controllare ARMONIA. Su Apple Calendar per Mac, ad esempio, puoi impostare l&apos;aggiornamento ogni 5 minuti.</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">Se non si apre automaticamente, copia il link e aggiungi una nuova sottoscrizione calendario dalle impostazioni di Apple Calendar.</p>
          <div className="mt-5 rounded-xl border border-sage-100 p-4 text-sm leading-6"><p className="font-bold">Outlook e altri client</p><p className="mt-1"><b>Outlook:</b> Aggiungi calendario → Sottoscrivi dal Web → incolla il link.</p><p className="mt-1"><b>Altri client:</b> cerca l’opzione per aggiungere un calendario tramite URL, iCalendar o WebCal.</p></div>
          <div className="mt-5 border-t border-sage-100 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button type="button" disabled={busy} onClick={() => { if (confirm("Il link attuale smetterà di funzionare. Dovrai aggiornare il calendario sui dispositivi dove lo hai già aggiunto.")) void request("PATCH", { action: "rotate" }).then(value => { if (value) setMessage({ kind: "success", text: "Nuovo link generato. Aggiorna la sottoscrizione sui tuoi dispositivi." }); }); }} className="btn btn-quiet w-full disabled:opacity-50 sm:w-auto">Rigenera link</button><button type="button" disabled={busy} onClick={() => { if (confirm("Il calendario non sarà più aggiornabile dai dispositivi che usano questo link. Gli appuntamenti in ARMONIA non verranno modificati.")) void request("DELETE"); }} className="btn btn-quiet w-full text-red-700 disabled:opacity-50 sm:w-auto">Disattiva calendario</button></div>
          </div>
        </>}
        {message && <p role={message.kind === "error" ? "alert" : "status"} className={`mt-4 text-sm font-bold ${message.kind === "error" ? "text-red-600" : "text-sage-700"}`}>{message.text}</p>}
      </>}
    </div>}
  </div>;
}
