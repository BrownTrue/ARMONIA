"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { ActivityChart } from "@/components/statistics/activity-chart";
import { ServiceBreakdown } from "@/components/statistics/service-breakdown";
import { StatisticsPeriodFilter } from "@/components/statistics/statistics-period-filter";
import { createClient } from "@/lib/supabase/client";
import { activitySeries, appointmentStatistics, coreStatistics, economyStatistics, patientStatistics, serviceStatistics } from "@/lib/statistics/metrics";
import { romeToday, statisticsPeriod, type StatisticsPeriodPreset } from "@/lib/statistics/periods";
import { loadCloudStatistics } from "@/lib/statistics/statistics-repository";
import { statisticsDatasetFromAppData, type StatisticsDataset } from "@/lib/statistics/types";

const money = (cents: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
const hours = (minutes: number) => (minutes / 60).toLocaleString("it-IT", { maximumFractionDigits: 1 });

function LoadingStatistics() {
  return <div className="mt-6 space-y-5" aria-label="Caricamento statistiche" aria-busy="true"><div className="h-20 animate-pulse rounded-2xl bg-slate-100" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function StatisticsPage() {
  const { data, ready, user } = useData();
  const today = romeToday();
  const [preset, setPreset] = useState<StatisticsPeriodPreset>("current_month");
  const [custom, setCustom] = useState({ from: `${today.slice(0, 7)}-01`, to: today });
  const [cloudData, setCloudData] = useState<StatisticsDataset | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const client = useMemo(() => user ? createClient() : null, [user]);
  const period = useMemo(() => statisticsPeriod(preset, today, custom), [preset, today, custom]);

  useEffect(() => {
    if (!ready || !user || !client) return;
    let active = true;
    setCloudLoading(true);
    setReaderError(null);
    void loadCloudStatistics(client, user.id)
      .then((result) => { if (active) setCloudData(result); })
      .catch(() => { if (active) setReaderError("Non è stato possibile caricare le statistiche. Riprova più tardi."); })
      .finally(() => { if (active) setCloudLoading(false); });
    return () => { active = false; };
  }, [ready, user, client]);

  const dataset = user ? cloudData : statisticsDatasetFromAppData(data);
  if (!ready || (user && (cloudLoading || !dataset) && !readerError)) return <AppShell><h1 className="text-2xl font-bold sm:text-3xl">Statistiche</h1><p className="mt-1 text-sm text-slate-500 sm:text-base">Una vista chiara sulla tua attività.</p><LoadingStatistics /></AppShell>;
  if (readerError || !dataset) return <AppShell><h1 className="text-2xl font-bold sm:text-3xl">Statistiche</h1><div className="card mt-6 border-rose-200 p-5"><h2 className="font-bold text-rose-800">Statistiche non disponibili</h2><p className="mt-1 text-sm text-rose-700">{readerError}</p></div></AppShell>;

  const core = coreStatistics(dataset, period, today);
  const patients = patientStatistics(dataset, period, today);
  const agenda = appointmentStatistics(dataset, period);
  const services = serviceStatistics(dataset, period, today);
  const economy = economyStatistics(dataset, period, today);
  const chart = activitySeries(dataset, period, today);
  const kpis = [
    ["Sedute registrate", String(core.sessionCount), "attività svolte"],
    ["Ore lavorate", `${hours(core.minutes)} h`, "durata complessiva"],
    ["Pazienti seguiti", String(core.patientCount), "pazienti distinti"],
    ["Giorni lavorati", String(core.workDays), "giorni con sedute"],
  ];

  return <AppShell>
    <header><h1 className="text-2xl font-bold sm:text-3xl">Statistiche</h1><p className="mt-1 text-sm text-slate-500 sm:text-base">Capisci come sta andando la tua attività, senza perdere il quadro d'insieme.</p></header>
    <div className="mt-5 sm:mt-7"><StatisticsPeriodFilter preset={preset} period={period} custom={custom} onPreset={setPreset} onCustom={setCustom} /></div>
    {!dataset.sessions.length ? <section className="card mt-5 p-6 text-center sm:mt-6 sm:p-10"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-xl" aria-hidden="true">↗</div><h2 className="mt-4 text-lg font-bold">Le statistiche cresceranno con la tua attività</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Le statistiche appariranno dopo la registrazione delle prime sedute.</p></section> : <>
      <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4" aria-label="Indicatori principali">{kpis.map(([label, value, detail]) => <article className="card min-w-0 p-4 sm:p-5" key={label}><p className="text-xs font-semibold leading-snug text-slate-500 sm:text-sm">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p><p className="mt-1 hidden text-xs text-slate-400 sm:block">{detail}</p></article>)}</section>
      <section className="card mt-5 p-4 sm:mt-6 sm:p-6"><h2 className="text-lg font-bold">Andamento dell'attività</h2><p className="mb-5 mt-1 text-sm text-slate-500">Sedute registrate nel periodo selezionato.</p>{core.sessionCount ? <ActivityChart points={chart} /> : <div className="flex min-h-40 items-center justify-center rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Nessuna seduta registrata nel periodo selezionato.</div>}</section>
      <div className="mt-5 grid gap-5 sm:mt-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6"><h2 className="text-lg font-bold">Prestazioni</h2><p className="mb-5 mt-1 text-sm text-slate-500">Distribuzione delle sedute registrate.</p><ServiceBreakdown rows={services} /></section>
        <section className="card p-4 sm:p-6"><h2 className="text-lg font-bold">Agenda</h2><p className="mt-1 text-sm text-slate-500">Appuntamenti e registrazioni nel periodo.</p><dl className="mt-5 grid grid-cols-2 gap-3">{[["Registrati", agenda.registered], ["Annullati", agenda.cancelled], ["Da registrare", agenda.toRegister], ["Sedute manuali", agenda.manualSessions]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd></div>)}</dl></section>
      </div>
      <div className="mt-5 grid gap-5 sm:mt-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6"><h2 className="text-lg font-bold">Pazienti</h2><p className="mt-1 text-sm text-slate-500">Persone seguite e continuità dell'attività.</p><dl className="mt-5 divide-y divide-slate-100">{[["Pazienti attivi correnti", patients.activeCurrent], ["Nuovi nel periodo", patients.newInPeriod], ["Seguiti nel periodo", patients.followed], ["Frequenza media", patients.averageFrequency === undefined ? "—" : `${patients.averageFrequency.toLocaleString("it-IT", { maximumFractionDigits: 1 })} sedute`]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><dt className="text-sm text-slate-600">{label}</dt><dd className="font-bold text-slate-900">{value}</dd></div>)}</dl></section>
        <section className="card p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Economia</h2><p className="mt-1 text-sm text-slate-500">Sintesi affidabile del periodo.</p></div><Link href="/economia" className="shrink-0 text-sm font-semibold text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Apri Economia</Link></div><dl className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-sage-50 p-3"><dt className="text-xs font-semibold text-slate-500">Valore erogato</dt><dd className="mt-1 text-xl font-bold text-slate-900">{money(economy.deliveredCents)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-500">Incassato</dt><dd className="mt-1 text-xl font-bold text-slate-900">{money(economy.receivedCents)}</dd></div></dl>{economy.receivedCents === 0 && <p className="mt-4 text-sm text-slate-500">Nessun incasso registrato nel periodo. Puoi gestire i pagamenti in Economia.</p>}</section>
      </div>
    </>}
  </AppShell>;
}
