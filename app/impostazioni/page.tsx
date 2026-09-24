"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";
import type { Profile } from "@/lib/types";
import { useBranding } from "@/components/branding-provider";
import {clearGoogleCalendarLocalState,flushGoogleCalendarQueue,getGoogleCalendarPreferences,getGoogleSyncState,persistGoogleCalendarPreferences,queueAllGoogleAppointments,saveGoogleCalendarPreferences,subscribeGoogleSync,type GoogleCalendarPreferences,type GoogleSyncState} from "@/lib/google-calendar/client-sync";
type GoogleStatus={configured:boolean;connected:boolean;calendarName?:string;error?:string;nameFormat?:GoogleCalendarPreferences["nameFormat"];reminderMinutes?:number;syncEnabled?:boolean};
const cloudDataMode=process.env.NEXT_PUBLIC_DATA_MODE!=="local";
export default function Settings() {
  const router = useRouter();
  const { data, ready, connection, saveProfile, signOut } = useData();
  const { logoSrc, hasCustomLogo, ready: brandingReady, saveLogo, removeLogo } = useBranding();
  const logoInput = useRef<HTMLInputElement>(null);
  const [v, setV] = useState<Profile>(data.profile),
    [saved, setSaved] = useState(false),
    [google,setGoogle]=useState<GoogleStatus|null>(null),
    [googlePrefs,setGooglePrefs]=useState<GoogleCalendarPreferences>({enabled:false,nameFormat:"first_initial",reminderMinutes:30}),
    [syncState,setSyncState]=useState<GoogleSyncState>({pending:0,syncing:false}),
    [brandingBusy,setBrandingBusy]=useState(false),
    [brandingMessage,setBrandingMessage]=useState<{kind:"success"|"error";text:string}|null>(null);
  useEffect(() => { if (ready) setV(data.profile); }, [ready, data.profile]);
  useEffect(()=>{setGooglePrefs(getGoogleCalendarPreferences());setSyncState(getGoogleSyncState());return subscribeGoogleSync(()=>setSyncState(getGoogleSyncState()))},[]);
  useEffect(()=>{fetch("/api/google-calendar/status",{cache:"no-store"}).then(r=>r.json()).then((status:GoogleStatus)=>{setGoogle(status);if(status.connected){const current=getGoogleCalendarPreferences(),preferences={...current,enabled:status.syncEnabled??true,nameFormat:cloudDataMode&&status.nameFormat?status.nameFormat:current.nameFormat,reminderMinutes:cloudDataMode&&status.reminderMinutes!==undefined?status.reminderMinutes:current.reminderMinutes};saveGoogleCalendarPreferences(preferences);setGooglePrefs(preferences);if(new URLSearchParams(window.location.search).get("google")==="connected")queueAllGoogleAppointments(data.appointments,data.patients)}}).catch(error=>setGoogle({configured:true,connected:false,error:error instanceof Error?error.message:"Errore di collegamento"}))},[ready]);
  const updateGooglePreferences=(patch:Partial<GoogleCalendarPreferences>)=>{const next={...googlePrefs,...patch};setGooglePrefs(next);void persistGoogleCalendarPreferences(next).then(()=>{if(google?.connected)queueAllGoogleAppointments(data.appointments,data.patients)}).catch(error=>setGoogle(old=>({...old!,error:error instanceof Error?error.message:"Salvataggio non riuscito"})))};
  const set =
    (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSaved(false);
      setV((old) => ({ ...old, [k]: value }));
    };
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
        className="card mt-8 max-w-2xl p-6"
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
        <button className="btn btn-primary mt-6">Salva profilo</button>
        {saved && (
          <span className="ml-3 text-sm font-bold text-sage-700">
            Modifiche salvate ✓
          </span>
        )}
      </form>
      <section className="card mt-5 max-w-2xl p-6">
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
      <section className="card mt-5 max-w-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-bold">Google Calendar</h2><p className="mt-1 text-sm text-slate-500">Sincronizzazione unidirezionale verso il calendario dedicato “Armonia”.</p></div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${google?.connected&&!syncState.error?"bg-blue-50 text-blue-700":google?.error||syncState.error?"bg-red-50 text-red-700":"bg-slate-100 text-slate-500"}`}>{google?.connected&&!syncState.error?"Collegato":google?.error||syncState.error?"Errore":"Non collegato"}</span>
        </div>
        {!google?.configured ? <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><b>Configurazione Google Cloud necessaria</b><p className="mt-1">Aggiungi le credenziali OAuth locali per attivare il collegamento.</p></div> : google.connected ? <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Titolo degli eventi<select value={googlePrefs.nameFormat} onChange={e=>updateGooglePreferences({nameFormat:e.target.value as GoogleCalendarPreferences["nameFormat"]})} className="mt-2 w-full rounded-xl border border-sage-100 bg-white px-3 py-2.5 font-normal outline-none focus:border-sage-500"><option value="first_initial">Nome + iniziale cognome</option><option value="full">Nome e cognome completo</option><option value="initials">Solo iniziali</option></select></label>
            <Field label="Promemoria (minuti prima)" type="number" min={0} max={40320} value={googlePrefs.reminderMinutes} onChange={e=>updateGooglePreferences({reminderMinutes:Math.max(0,Math.min(40320,Number(e.target.value)||0))})}/>
          </div>
          <div className="mt-4 rounded-xl bg-sage-50 p-4 text-sm"><b>Anteprima:</b> {googlePrefs.nameFormat==="full"?"Logopedia · Mario Rossi":googlePrefs.nameFormat==="initials"?"Logopedia · M. R.":"Logopedia · Mario R."}<p className="mt-1 text-slate-500">Descrizione vuota, evento privato, stato occupato e nessun invitato.</p></div>
          {syncState.error&&<p className="mt-3 text-sm font-bold text-red-600">{syncState.error}</p>}
          <p className="mt-3 text-sm text-slate-500">{syncState.syncing?"Sincronizzazione in corso…":syncState.pending?`${syncState.pending} modifiche in attesa`:syncState.lastSyncedAt?`Ultima sincronizzazione: ${new Date(syncState.lastSyncedAt).toLocaleString("it-IT")}`:"Pronto per la prima sincronizzazione"}</p>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn btn-primary" disabled={syncState.syncing} onClick={()=>{queueAllGoogleAppointments(data.appointments,data.patients);void flushGoogleCalendarQueue()}}>Sincronizza ora</button><button type="button" className="btn btn-quiet" onClick={async()=>{if(!confirm("Scollegare Google Calendar da Armonia? Gli eventi già presenti nel calendario non saranno eliminati."))return;await fetch("/api/google-calendar/disconnect",{method:"POST"});clearGoogleCalendarLocalState();setGoogle({configured:true,connected:false});setGooglePrefs(getGoogleCalendarPreferences())}}>Scollega</button></div>
        </> : <div className="mt-5"><a href="/api/google-calendar/connect" className="btn btn-primary inline-block">Collega Google Calendar</a>{google?.error&&<p className="mt-3 text-sm font-bold text-red-600">{google.error}</p>}</div>}
        <p className="mt-5 border-t border-sage-100 pt-4 text-xs text-slate-500">Prototipo locale: il token OAuth è cifrato sul dispositivo. Per la produzione sarà usato uno store backend persistente e cifrato.</p>
      </section>
      <section className="card mt-5 max-w-2xl p-6">
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
