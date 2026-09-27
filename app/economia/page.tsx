"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { formatEuroCents } from "@/lib/calendar-v2";
import { buildDeliveredServiceRows, deliveredValueCents, economyServiceKey, filterEconomySessions, missingPriceCount } from "@/lib/economy";

const monthBounds = (month: string) => ({ from: `${month}-01`, to: `${month}-31` });
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("it-IT");

export default function EconomyPage() {
  const { data, ready } = useData();
  const [month, setMonth] = useState(new Date().toLocaleDateString("sv-SE").slice(0, 7));
  const [patientId, setPatientId] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const serviceOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const session of data.sessions) options.set(economyServiceKey(session), session.serviceNameSnapshot || "Prestazione non specificata");
    return [...options].sort((a, b) => a[1].localeCompare(b[1], "it"));
  }, [data.sessions]);
  const monthSessions = useMemo(() => filterEconomySessions(data.sessions, monthBounds(month)), [data.sessions, month]);
  const visibleSessions = useMemo(() => filterEconomySessions(data.sessions, { ...monthBounds(month), patientId: patientId || undefined, serviceKey: serviceKey || undefined }), [data.sessions, month, patientId, serviceKey]);
  const rows = useMemo(() => buildDeliveredServiceRows(visibleSessions, data.patients), [visibleSessions, data.patients]);

  return <AppShell>
    <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-sage-700">Gestione economica</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Prestazioni erogate</h1><p className="mt-1 text-sm text-slate-500 sm:text-base">Prestazioni erogate e valori economici dello studio. Pagamenti e fatture non sono ancora gestiti.</p></header>
    {!ready ? <p className="mt-6 text-sm text-slate-500">Caricamento…</p> : <>
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label={`Riepilogo ${monthLabel(month)}`}>
        <Metric label="Valore erogato questo mese" value={formatEuroCents(deliveredValueCents(monthSessions))}/>
        <Metric label="Sedute registrate questo mese" value={String(monthSessions.length)}/>
        <Metric label="Prestazioni senza prezzo" value={String(missingPriceCount(monthSessions))} className="col-span-2 lg:col-span-1"/>
      </section>

      <section className="card mt-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-bold">Periodo<input type="month" value={month} onChange={(event)=>setMonth(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal sm:w-auto"/></label>
          <label className="text-sm font-bold sm:min-w-52">Paziente<select value={patientId} onChange={(event)=>setPatientId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal"><option value="">Tutti</option>{data.patients.map((patient)=><option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}</select></label>
          <label className="text-sm font-bold sm:min-w-52">Prestazione<select value={serviceKey} onChange={(event)=>setServiceKey(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal"><option value="">Tutte</option>{serviceOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="delivered-services-title">
        <div className="flex items-end justify-between gap-3"><div><h2 id="delivered-services-title" className="text-xl font-bold">Prestazioni svolte</h2><p className="mt-1 text-sm text-slate-500">Dati storici salvati nelle sedute, senza deduzioni dagli appuntamenti.</p></div><span className="text-sm font-bold text-slate-500">{rows.length}</span></div>
        {rows.length ? <><div className="mt-3 space-y-2 md:hidden">{rows.map((row)=><DeliveredCard key={row.session.id} row={row}/>)}</div><div className="card mt-3 hidden overflow-hidden md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Paziente</th><th className="px-4 py-3">Prestazione</th><th className="px-4 py-3">Importo</th><th className="px-4 py-3 text-right">Azioni</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row)=><tr key={row.session.id}><td className="px-4 py-3 font-medium">{dateLabel(row.session.date)}</td><td className="px-4 py-3">{row.patientName}</td><td className="px-4 py-3">{row.serviceName || "Non specificata"}</td><td className="px-4 py-3 font-bold">{priceLabel(row.effectivePriceCents)}</td><td className="px-4 py-3 text-right"><Link href={`/pazienti/${row.session.patientId}?tab=activity`} className="font-bold text-sage-700">Apri</Link></td></tr>)}</tbody></table></div></> : <div className="card mt-3 p-6 text-center text-sm text-slate-500">Nessuna prestazione per i filtri selezionati.</div>}
      </section>

      <section className="card mt-6 p-4 sm:p-5" aria-labelledby="service-catalog-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="service-catalog-title" className="text-xl font-bold">Catalogo prestazioni</h2><p className="mt-1 text-sm text-slate-500">Lo stesso catalogo usato dal Calendario e dalle sedute.</p></div><Link href="/calendario" className="text-sm font-bold text-sage-700">Gestisci nel Calendario</Link></div>{data.services.length?<div className="mt-4 grid gap-2 sm:grid-cols-2">{[...data.services].sort((a,b)=>a.displayOrder-b.displayOrder||a.name.localeCompare(b.name,"it")).map((service)=><div key={service.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{service.name}</p><p className="mt-1 text-sm text-slate-500">{service.defaultDurationMinutes} min · {service.defaultPriceCents===undefined?"Prezzo non specificato":service.defaultPriceCents===0?"Gratuita":formatEuroCents(service.defaultPriceCents)}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${service.isActive?"bg-sage-100 text-sage-800":"bg-slate-200 text-slate-600"}`}>{service.isActive?"Attiva":"Non attiva"}</span></div></div>)}</div>:<p className="mt-4 text-sm text-slate-500">Nessuna prestazione nel catalogo.</p>}</section>
    </>}
  </AppShell>;
}

function priceLabel(value?: number) { return value === undefined ? "Non specificato" : value === 0 ? "Gratuita" : formatEuroCents(value); }
function Metric({label,value,className=""}:{label:string;value:string;className?:string}) { return <div className={`card p-4 sm:p-5 ${className}`}><p className="text-xs leading-snug text-slate-500 sm:text-sm">{label}</p><p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">{value}</p></div>; }
function DeliveredCard({row}:{row:ReturnType<typeof buildDeliveredServiceRows>[number]}) { return <article className="card p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-slate-400">{dateLabel(row.session.date)}</p><p className="mt-1 truncate font-bold">{row.patientName}</p><p className="mt-0.5 truncate text-sm text-slate-500">{row.serviceName||"Prestazione non specificata"}</p></div><p className="shrink-0 text-sm font-bold">{priceLabel(row.effectivePriceCents)}</p></div><Link href={`/pazienti/${row.session.patientId}?tab=activity`} className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-sage-700">Apri</Link></article>; }
