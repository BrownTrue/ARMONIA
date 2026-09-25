"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";
import type { Profile } from "@/lib/types";
import { useBranding } from "@/components/branding-provider";
import {clearGoogleCalendarLocalState,clearGoogleSyncError,flushGoogleCalendarQueue,getGoogleCalendarPreferences,getGoogleSyncState,persistGoogleCalendarPreferences,queueAllGoogleAppointments,saveGoogleCalendarPreferences,subscribeGoogleSync,type GoogleCalendarPreferences,type GoogleSyncState} from "@/lib/google-calendar/client-sync";
import {createGoogleOAuthResultConsumer} from "@/lib/google-calendar/oauth-result";
import {resyncAllGoogleAppointments,syncPendingGoogleOperations} from "@/lib/google-calendar/settings-actions";
import {googleSyncErrorPresentation,googleSyncStatusPresentation} from "@/lib/google-calendar/user-facing-status";
import { CalendarFeedSettings } from "@/components/calendar-feed-settings";
import { Modal } from "@/components/modal";
type GoogleStatus={configured:boolean;connected:boolean;calendarName?:string;error?:string;nameFormat?:GoogleCalendarPreferences["nameFormat"];reminderMinutes?:number;syncEnabled?:boolean};
const cloudDataMode=process.env.NEXT_PUBLIC_DATA_MODE!=="local";
export default function Settings() {
  const router = useRouter();
  const { data, ready, connection, saveProfile, signOut } = useData();
  const { logoSrc, hasCustomLogo, ready: brandingReady, saveLogo, removeLogo } = useBranding();
  const logoInput = useRef<HTMLInputElement>(null);
  const consumeGoogleOAuthResult=useRef(createGoogleOAuthResultConsumer()).current;
  const googleAutoOpened=useRef(false);
  const [v, setV] = useState<Profile>(data.profile),
    [saved, setSaved] = useState(false),
    [google,setGoogle]=useState<GoogleStatus|null>(null),
    [googlePrefs,setGooglePrefs]=useState<GoogleCalendarPreferences>({enabled:false,nameFormat:"first_initial",reminderMinutes:30}),
    [syncState,setSyncState]=useState<GoogleSyncState>({pending:0,syncing:false}),
    [brandingBusy,setBrandingBusy]=useState(false),
    [brandingMessage,setBrandingMessage]=useState<{kind:"success"|"error";text:string}|null>(null),
    [googleNotice,setGoogleNotice]=useState<{kind:"success"|"error";text:string}|null>(null),
    [googleExpanded,setGoogleExpanded]=useState(false),
    [calendarsHelpOpen,setCalendarsHelpOpen]=useState(false);
  useEffect(() => { if (ready) setV(data.profile); }, [ready, data.profile]);
  useEffect(()=>{setGooglePrefs(getGoogleCalendarPreferences());setSyncState(getGoogleSyncState());return subscribeGoogleSync(()=>setSyncState(getGoogleSyncState()))},[]);
  useEffect(()=>{fetch("/api/google-calendar/status",{cache:"no-store"}).then(r=>r.json()).then((status:GoogleStatus)=>{setGoogle(status);const result=new URLSearchParams(window.location.search).get("google"),oauthResult=consumeGoogleOAuthResult(result);if(oauthResult==="reconnected"){clearGoogleSyncError();setGoogleNotice({kind:"success",text:"Google Calendar è stato ricollegato. Le operazioni rimaste in attesa possono ora essere ritentate."})}else if(result?.startsWith("reconnect-")){const text=result==="reconnect-calendar-unavailable"?"Il calendario Armonia esistente non è accessibile con l’account autorizzato. La connessione precedente non è stata modificata.":result==="reconnect-missing-refresh-token"?"Google non ha fornito una nuova autorizzazione persistente. La connessione precedente non è stata modificata.":"Riconnessione Google non riuscita. La connessione precedente non è stata modificata.";setGoogleNotice({kind:"error",text})}if(status.connected){const current=getGoogleCalendarPreferences(),preferences={...current,enabled:status.syncEnabled??true,nameFormat:cloudDataMode&&status.nameFormat?status.nameFormat:current.nameFormat,reminderMinutes:cloudDataMode&&status.reminderMinutes!==undefined?status.reminderMinutes:current.reminderMinutes};saveGoogleCalendarPreferences(preferences);setGooglePrefs(preferences);if(oauthResult==="connected")void queueAllGoogleAppointments(data.appointments,data.patients)}if(oauthResult)router.replace("/impostazioni",{scroll:false})}).catch(()=>setGoogle({configured:true,connected:false,error:"Non è stato possibile verificare il collegamento a Google Calendar."}))},[ready,consumeGoogleOAuthResult,router]);
  const updateGooglePreferences=(patch:Partial<GoogleCalendarPreferences>)=>{const next={...googlePrefs,...patch};setGooglePrefs(next);void persistGoogleCalendarPreferences(next).then(()=>{if(google?.connected)queueAllGoogleAppointments(data.appointments,data.patients)}).catch(error=>setGoogle(old=>({...old!,error:error instanceof Error?error.message:"Salvataggio non riuscito"})))};
  const set =
    (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSaved(false);
      setV((old) => ({ ...old, [k]: value }));
    };
  const syncPresentation=googleSyncStatusPresentation(syncState.error,syncState.pending);
  const connectionError=googleSyncErrorPresentation(google?.error);
  useEffect(()=>{if(!google||googleAutoOpened.current)return;if(!google.connected||syncPresentation.kind!=="active"||googleNotice?.kind==="error"){googleAutoOpened.current=true;setGoogleExpanded(true)}},[google,syncPresentation.kind,googleNotice]);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Impostazioni</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${connection.kind === "local" ? "bg-sage-100 text-sage-700" : connection.kind === "cloud" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
          <span className={`h-2 w-2 rounded-full ${connection.kind === "local" ? "bg-sage-500" : connection.kind === "cloud" ? "bg-blue-500" : "bg-red-500"}`}/>{connection.label}
        </span>
        <p className="text-sm text-slate-500">{connection.message}</p>
      </div>
      <form
        className="card mt-8 max-w-2xl p-4 sm:p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await saveProfile(v);
          setSaved(true);
        }}
      >
        <h2 className="mb-5 font-bold">Il tuo profilo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            required
            value={v.firstName}
            onChange={set("firstName")}
          />
          <Field
            label="Cognome"
            required
            value={v.lastName}
            onChange={set("lastName")}
          />
          <Field
            label="Professione"
            value={v.profession}
            onChange={set("profession")}
          />
          <Field
            label="Email"
            required
            type="email"
            value={v.email}
            onChange={set("email")}
          />
          <div className="sm:col-span-2">
            <Field
              label="Studio / centro"
              value={v.studio}
              onChange={set("studio")}
            />
          </div>
        </div>
        <button className="btn btn-primary mt-6 w-full sm:w-auto">Salva profilo</button>
        {saved && (
          <span className="mt-3 block text-sm font-bold text-sage-700 sm:ml-3 sm:inline">
            Modifiche salvate ✓
          </span>
        )}
      </form>
      <section className="card mt-5 max-w-2xl p-4 sm:p-6">
        <div><h2 className="font-bold">Logo professionista / studio</h2><p className="mt-1 text-sm text-slate-500">PNG, JPG o WebP · massimo 2 MB. Il logo verrà adattato automaticamente ai documenti.</p></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
          <div className="grid h-28 place-items-center overflow-hidden rounded-2xl border border-sage-100 bg-sage-50 p-4">
            {brandingReady ? <Image src={logoSrc} alt="Anteprima logo" width={180} height={90} unoptimized className="h-full w-full object-contain" /> : <span className="text-sm text-slate-400">Caricamento…</span>}
          </div>
          <div className="rounded-2xl border border-sage-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-sage-700">Così apparirà nei documenti</p>
            <div className="mt-3 flex items-center gap-3"><Image src={logoSrc} alt="" width={52} height={52} unoptimized className="h-12 w-14 object-contain" /><div><p className="font-bold">{data.profile.firstName} {data.profile.lastName}</p>{data.profile.profession&&<p className="text-sm text-slate-500">{data.profile.profession}</p>}{data.profile.studio&&<p className="text-xs text-slate-400">{data.profile.studio}</p>}</div></div>
          </div>
        </div>
        <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async(event)=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;setBrandingBusy(true);setBrandingMessage(null);try{await saveLogo(file);setBrandingMessage({kind:"success",text:"Logo salvato."})}catch(cause){setBrandingMessage({kind:"error",text:cause instanceof Error?cause.message:"Non è stato possibile salvare il logo."})}finally{setBrandingBusy(false)}}}/>
        <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={brandingBusy||!brandingReady} onClick={()=>logoInput.current?.click()} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">{hasCustomLogo?"Cambia logo":"Carica logo"}</button>{hasCustomLogo&&<button type="button" disabled={brandingBusy} onClick={async()=>{if(!confirm("Rimuovere il logo personale? Nei documenti verrà utilizzato il logo Armonia."))return;setBrandingBusy(true);setBrandingMessage(null);try{await removeLogo();setBrandingMessage({kind:"success",text:"Logo rimosso. È stato ripristinato il logo Armonia."})}catch(cause){setBrandingMessage({kind:"error",text:cause instanceof Error?cause.message:"Non è stato possibile rimuovere il logo."})}finally{setBrandingBusy(false)}}} className="btn btn-quiet">Rimuovi logo</button>}</div>
        {brandingMessage&&<p role={brandingMessage.kind==="error"?"alert":"status"} className={`mt-3 text-sm font-bold ${brandingMessage.kind==="error"?"text-red-600":"text-sage-700"}`}>{brandingMessage.text}</p>}
      </section>
      <section className="mt-8 max-w-2xl" aria-labelledby="calendars-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="calendars-title" className="text-lg font-bold uppercase tracking-wide text-sage-700">Calendari</h2><button type="button" onClick={()=>setCalendarsHelpOpen(true)} className="rounded-lg px-2 py-1 text-sm font-bold text-sage-700 outline-none hover:bg-sage-50 focus-visible:ring-2 focus-visible:ring-sage-500">ⓘ Come funzionano</button></div>
        <div className="card p-4 sm:p-6">
        <button type="button" aria-expanded={googleExpanded} aria-controls="google-calendar-settings" onClick={()=>setGoogleExpanded(open=>!open)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-4">
          <span className="min-w-0"><span className="block font-bold">Google Calendar</span>{syncState.pending>0&&<span className="mt-1 block text-sm text-slate-500">{syncState.pending} {syncState.pending===1?"modifica in attesa":"modifiche in attesa"}</span>}</span>
          <span className="flex min-w-0 items-center justify-end gap-2"><span className={`max-w-[13rem] rounded-full px-3 py-1 text-right text-xs font-bold leading-snug sm:text-sm ${google?.connected?syncPresentation.kind==="reconnect"?"bg-red-50 text-red-700":syncPresentation.kind==="pending"?"bg-amber-50 text-amber-800":"bg-sage-50 text-sage-700":"bg-slate-100 text-slate-500"}`}>{google?.connected?syncPresentation.kind==="reconnect"?"Ricollegamento necessario":syncPresentation.kind==="pending"?"Sincronizzazione in attesa":"Sincronizzazione attiva":"Non collegato"}</span><span aria-hidden="true" className="shrink-0 text-xl leading-none text-sage-700">{googleExpanded?"⌃":"⌄"}</span></span>
        </button>
        {googleExpanded&&<div id="google-calendar-settings">
        {!google?.configured ? <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><b>Configurazione Google Cloud necessaria</b><p className="mt-1">Aggiungi le credenziali OAuth locali per attivare il collegamento.</p></div> : google.connected ? <>
          <div role={syncPresentation.kind==="active"?"status":"alert"} className={`mt-5 rounded-xl border p-4 text-sm ${syncPresentation.kind==="reconnect"?"border-red-100 bg-red-50 text-red-700":syncPresentation.kind==="pending"?"border-amber-100 bg-amber-50 text-amber-900":"border-sage-100 bg-sage-50 text-sage-700"}`}>
            <p className="font-bold">{syncPresentation.title}</p>
            <p className="mt-1">{syncPresentation.message}</p>
            {syncPresentation.kind==="reconnect"&&syncState.pending>0&&<p className="mt-1">{syncState.pending} {syncState.pending===1?"modifica è in attesa di sincronizzazione.":"modifiche sono in attesa di sincronizzazione."}</p>}
          </div>
          {syncState.lastSyncedAt&&<p className="mt-2 text-xs text-slate-500">Ultima sincronizzazione riuscita: {new Date(syncState.lastSyncedAt).toLocaleString("it-IT")}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Titolo degli eventi<select value={googlePrefs.nameFormat} onChange={e=>updateGooglePreferences({nameFormat:e.target.value as GoogleCalendarPreferences["nameFormat"]})} className="mt-2 w-full rounded-xl border border-sage-100 bg-white px-3 py-2.5 font-normal outline-none focus:border-sage-500"><option value="first_initial">Nome + iniziale cognome</option><option value="full">Nome e cognome completo</option><option value="initials">Solo iniziali</option></select></label>
            <Field label="Promemoria (minuti prima)" type="number" min={0} max={40320} value={googlePrefs.reminderMinutes} onChange={e=>updateGooglePreferences({reminderMinutes:Math.max(0,Math.min(40320,Number(e.target.value)||0))})}/>
          </div>
          <div className="mt-4 rounded-xl bg-sage-50 p-4 text-sm"><b>Anteprima:</b> {googlePrefs.nameFormat==="full"?"Logopedia · Mario Rossi":googlePrefs.nameFormat==="initials"?"Logopedia · M. R.":"Logopedia · Mario R."}<p className="mt-1 text-slate-500">Descrizione vuota, evento privato, stato occupato e nessun invitato.</p></div>
          {googleNotice&&<p role="status" className={`mt-3 text-sm font-bold ${googleNotice.kind==="error"?"text-red-600":"text-sage-700"}`}>{googleNotice.text}</p>}
          {syncState.syncing&&syncPresentation.kind!=="reconnect"&&<p className="mt-3 text-sm text-slate-500">Nuovo tentativo in corso…</p>}
          {syncPresentation.kind!=="active"&&<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{syncPresentation.kind==="reconnect"?<a href="/api/google-calendar/connect?mode=reconnect" className="btn btn-primary w-full sm:w-auto">Ricollega Google</a>:<button type="button" className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={syncState.syncing||!syncState.pending} onClick={()=>void syncPendingGoogleOperations(flushGoogleCalendarQueue)}>Riprova sincronizzazione</button>}</div>}
          {syncPresentation.kind!=="reconnect"&&<div className="mt-5 rounded-xl border border-sage-100 p-4"><p className="text-sm font-bold">Risincronizzazione completa</p><p className="mt-1 text-sm text-slate-500">Usa questa funzione solo se il calendario Google non è allineato con Armonia.</p><button type="button" className="btn btn-quiet mt-3 w-full sm:w-auto" onClick={()=>{if(confirm("Rimettere in coda tutti gli appuntamenti Armonia? Usa questa funzione solo per una risincronizzazione completa."))void resyncAllGoogleAppointments(()=>queueAllGoogleAppointments(data.appointments,data.patients))}}>Risincronizza tutti gli appuntamenti</button></div>}
          <div className="mt-5 border-t border-sage-100 pt-4"><button type="button" className="btn btn-quiet w-full text-red-700 sm:w-auto" onClick={async()=>{if(!confirm("Scollegare Google Calendar da Armonia? Gli eventi già presenti nel calendario non saranno eliminati."))return;await fetch("/api/google-calendar/disconnect",{method:"POST"});clearGoogleCalendarLocalState();setGoogle({configured:true,connected:false});setGooglePrefs(getGoogleCalendarPreferences())}}>Scollega Google</button></div>
        </> : <div className="mt-5"><p className="text-sm text-slate-600">Collega Google Calendar per vedere automaticamente gli appuntamenti di Armonia nel tuo calendario Google. Armonia continua a funzionare anche senza collegamento.</p><a href="/api/google-calendar/connect" className="btn btn-primary mt-4 inline-block w-full sm:w-auto">Collega Google Calendar</a>{connectionError&&<p role="alert" className="mt-3 text-sm font-bold text-red-600">{connectionError.message}</p>}</div>}
        </div>}
        </div>
        <div className="mt-4"><CalendarFeedSettings cloudAvailable={cloudDataMode} googleConnected={Boolean(google?.connected)}/></div>
      </section>
      {calendarsHelpOpen&&<Modal title="Come funzionano i calendari?" onClose={()=>setCalendarsHelpOpen(false)}><div className="space-y-5 text-sm leading-6 text-slate-600"><section><h3 className="font-bold text-slate-800">Google Calendar</h3><p className="mt-1">Per chi usa Google Calendar. ARMONIA crea e aggiorna automaticamente gli appuntamenti nel calendario Google dedicato.</p></section><section><h3 className="font-bold text-slate-800">Calendario ARMONIA</h3><p className="mt-1">Per Apple Calendar, Outlook e altri client compatibili. È un calendario privato in sola lettura. Gli appuntamenti si modificano sempre in ARMONIA. L’app calendario decide quando aggiornare il feed, quindi le modifiche potrebbero non comparire immediatamente.</p></section><p className="rounded-xl bg-amber-50 p-4 text-amber-900">Puoi usare entrambi, ma se sono visibili nella stessa app potresti vedere gli stessi appuntamenti due volte.</p></div></Modal>}
      <section className="card mt-5 max-w-2xl p-4 sm:p-6">
        <h2 className="font-bold">Account</h2>
        <button
          disabled={connection.kind === "local"}
          title={connection.kind === "local" ? "Funzione non disponibile in modalità locale" : undefined}
          onClick={async () => { await signOut(); router.replace("/login"); }}
          className={`btn mt-4 ${connection.kind === "local" ? "cursor-not-allowed bg-slate-100 text-slate-400" : "btn-quiet"}`}
        >
          Esci dall’app
        </button>
      </section>
    </AppShell>
  );
}
