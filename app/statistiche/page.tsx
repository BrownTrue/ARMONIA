"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import styles from "./statistics-editorial.module.css";
import { ActivityChart } from "@/components/statistics/activity-chart";
import { MobileStatisticsDashboard } from "@/components/statistics/mobile-statistics-dashboard";
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

function MobileLoadingStatistics() {
  return <div className="mt-7 space-y-4" aria-label="Caricamento statistiche" aria-busy="true"><div className="grid grid-cols-2 gap-2"><div className="h-28 animate-pulse rounded-2xl bg-[#e8eee4]"/><div className="h-28 animate-pulse rounded-2xl bg-[#e8eee4]"/></div><div className="h-48 animate-pulse rounded-2xl bg-slate-100"/></div>;
}

function StatisticsHeading({ description = "Capisci come sta andando la tua attività, senza perdere il quadro d'insieme." }: { description?: string | false }) {
  return <header className={styles.heading}>
    <p className={styles.eyebrow}>UNO SGUARDO D’INSIEME</p>
    <h1 className={`text-2xl font-bold sm:text-3xl ${styles.headingTitle}`}>
      <span className={styles.tabletTitle}>Statistiche</span>
      <span className={styles.desktopTitle}>Il lavoro, <em>nel tempo.</em></span>
    </h1>
    {description && <p className={`mt-1 text-sm text-slate-500 sm:text-base ${styles.headingDescription}`}>{description}</p>}
  </header>;
}

function KpiGlyph({ index }: { index: number }) {
  const shapes = [
    <><path d="M3 12h4l2.3-7 4.4 14 2.3-7H21" /></>,
    <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 15a4.8 4.8 0 0 1 3.5 4.6" /></>,
    <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></>,
  ];
  return <span className={styles.kpiGlyph} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{shapes[index] ?? shapes[0]}</svg></span>;
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
  const periodFilter = (variant: "default" | "mobile" = "default") => <StatisticsPeriodFilter preset={preset} period={period} custom={custom} onPreset={setPreset} onCustom={setCustom} variant={variant}/>;
  if (!ready || (user && (cloudLoading || !dataset) && !readerError)) return <AppShell desktopWideAtLarge><div className="md:hidden">{periodFilter("mobile")}<MobileLoadingStatistics/></div><div className={`hidden md:block ${styles.desktopPage}`}><StatisticsHeading description="Una vista chiara sulla tua attività."/><LoadingStatistics /></div></AppShell>;
  if (readerError || !dataset) return <AppShell desktopWideAtLarge><div className="md:hidden"><section className="border-y border-rose-200 py-7"><h2 className="font-semibold text-rose-800">Statistiche non disponibili</h2><p className="mt-1 text-sm text-rose-700">{readerError}</p></section></div><div className={`hidden md:block ${styles.desktopPage}`}><StatisticsHeading description={false}/><div className={`card mt-6 border-rose-200 p-5 ${styles.errorPanel}`}><h2 className="font-bold text-rose-800">Statistiche non disponibili</h2><p className="mt-1 text-sm text-rose-700">{readerError}</p></div></div></AppShell>;

  const core = coreStatistics(dataset, period, today);
  const patients = patientStatistics(dataset, period, today);
  const agenda = appointmentStatistics(dataset, period);
  const services = serviceStatistics(dataset, period, today);
  const economy = economyStatistics(dataset, period, today);
  const chart = activitySeries(dataset, period, today);
  const kpis: [string, string, string][] = [
    ["Sedute registrate", String(core.sessionCount), "attività svolte"],
    ["Ore lavorate", `${hours(core.minutes)} h`, "durata complessiva"],
    ["Pazienti seguiti", String(core.patientCount), "pazienti distinti"],
    ["Giorni lavorati", String(core.workDays), "giorni con sedute"],
  ];

  return <AppShell desktopWideAtLarge>
    <MobileStatisticsDashboard periodControl={periodFilter("mobile")} hasAnySessions={dataset.sessions.length > 0} kpis={kpis} sessionCount={core.sessionCount} chart={chart} services={services} agenda={agenda} patients={patients} economy={{ delivered: money(economy.deliveredCents), received: money(economy.receivedCents), receivedCents: economy.receivedCents }}/>
    <div className={`hidden md:block ${styles.desktopPage} ${dataset.sessions.length ? styles.populatedPage : ""}`}>
    <StatisticsHeading />
    <div className={`mt-5 sm:mt-7 ${styles.periodFilter}`}>{periodFilter()}</div>
    {dataset.sessions.length > 0 && <div className={styles.heroBackdrop} aria-hidden="true" />}
    {!dataset.sessions.length ? <section className={`card mt-5 p-6 text-center sm:mt-6 sm:p-10 ${styles.emptyState}`}><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-xl" aria-hidden="true">↗</div><h2 className="mt-4 text-lg font-bold">Le statistiche cresceranno con la tua attività</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Le statistiche appariranno dopo la registrazione delle prime sedute.</p></section> : <>
      <section className={`mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4 ${styles.indicators}`} aria-label="Indicatori principali">{kpis.map(([label, value, detail], index) => <article className={`card min-w-0 p-4 sm:p-5 ${styles.kpiCard}`} key={label}><KpiGlyph index={index}/><p className="text-xs font-semibold leading-snug text-slate-500 sm:text-sm">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p><p className="mt-1 hidden text-xs text-slate-400 sm:block">{detail}</p>{index === 0 && <span className={styles.heroPeriod}>{period.label}</span>}</article>)}</section>
      <div className={styles.dashboardPanels}>
        <section className={`card mt-5 p-4 sm:mt-6 sm:p-6 ${styles.panel} ${styles.activityPanel}`}><h2 className={`text-lg font-bold ${styles.panelTitle}`}>Andamento dell'attività</h2><p className={`mb-5 mt-1 text-sm text-slate-500 ${styles.panelDescription}`}>Sedute registrate nel periodo selezionato.</p>{core.sessionCount ? <div className={styles.activityChart}><ActivityChart points={chart} /></div> : <div className={`flex min-h-40 items-center justify-center rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 ${styles.periodEmpty}`}>Nessuna seduta registrata nel periodo selezionato.</div>}</section>
        <div className={`mt-5 grid gap-5 sm:mt-6 lg:grid-cols-2 ${styles.panelGroup}`}>
          <section className={`card p-4 sm:p-6 ${styles.panel} ${styles.servicesPanel}`}><h2 className={`text-lg font-bold ${styles.panelTitle}`}>Prestazioni</h2><p className={`mb-5 mt-1 text-sm text-slate-500 ${styles.panelDescription}`}>Distribuzione delle sedute registrate.</p><ServiceBreakdown rows={services} /></section>
          <section className={`card p-4 sm:p-6 ${styles.panel} ${styles.agendaPanel}`}><h2 className={`text-lg font-bold ${styles.panelTitle}`}>Agenda</h2><p className={`mt-1 text-sm text-slate-500 ${styles.panelDescription}`}>Appuntamenti e registrazioni nel periodo.</p><dl className="mt-5 grid grid-cols-2 gap-3">{[["Registrati", agenda.registered], ["Annullati", agenda.cancelled], ["Da registrare", agenda.toRegister], ["Sedute manuali", agenda.manualSessions]].map(([label, value]) => <div key={label} className={`rounded-xl bg-slate-50 p-3 ${styles.agendaMetric}`}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd></div>)}</dl></section>
        </div>
        <div className={`mt-5 grid gap-5 sm:mt-6 lg:grid-cols-2 ${styles.panelGroup}`}>
          <section className={`card p-4 sm:p-6 ${styles.panel} ${styles.patientsPanel}`}><h2 className={`text-lg font-bold ${styles.panelTitle}`}>Pazienti</h2><p className={`mt-1 text-sm text-slate-500 ${styles.panelDescription}`}>Persone seguite e continuità dell'attività.</p><dl className={`mt-5 divide-y divide-slate-100 ${styles.patientRows}`}>{[["Pazienti attivi correnti", patients.activeCurrent], ["Nuovi nel periodo", patients.newInPeriod], ["Seguiti nel periodo", patients.followed], ["Frequenza media", patients.averageFrequency === undefined ? "—" : `${patients.averageFrequency.toLocaleString("it-IT", { maximumFractionDigits: 1 })} sedute`]].map(([label, value]) => <div key={label} className={`flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 ${styles.patientRow}`}><dt className="text-sm text-slate-600">{label}</dt><dd className="font-bold text-slate-900">{value}</dd></div>)}</dl></section>
          <section className={`card p-4 sm:p-6 ${styles.panel} ${styles.economyPanel}`}><div className="flex items-start justify-between gap-4"><div><h2 className={`text-lg font-bold ${styles.panelTitle}`}>Economia</h2><p className={`mt-1 text-sm text-slate-500 ${styles.panelDescription}`}>Sintesi affidabile del periodo.</p></div><Link href="/economia" className="shrink-0 text-sm font-semibold text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Apri Economia</Link></div><dl className={`mt-5 grid grid-cols-2 gap-3 ${styles.economyMetrics}`}><div className={`rounded-xl bg-sage-50 p-3 ${styles.economyMetric}`}><dt className="text-xs font-semibold text-slate-500">Valore erogato</dt><dd className="mt-1 text-xl font-bold text-slate-900">{money(economy.deliveredCents)}</dd></div><div className={`rounded-xl bg-slate-50 p-3 ${styles.economyMetric}`}><dt className="text-xs font-semibold text-slate-500">Incassato</dt><dd className="mt-1 text-xl font-bold text-slate-900">{money(economy.receivedCents)}</dd></div></dl>{economy.receivedCents === 0 && <p className="mt-4 text-sm text-slate-500">Nessun incasso registrato nel periodo. Puoi gestire i pagamenti in Economia.</p>}</section>
        </div>
      </div>
    </>}
    </div>
  </AppShell>;
}
