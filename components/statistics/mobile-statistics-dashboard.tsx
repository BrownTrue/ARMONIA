import Link from "next/link";
import type { ReactNode } from "react";
import { ActivityChart } from "./activity-chart";
import { ServiceBreakdown } from "./service-breakdown";
import type { ActivityPoint } from "@/lib/statistics/metrics";

type Kpi = [label: string, value: string, detail: string];
type ServiceRow = { key: string; name: string; sessions: number; minutes: number; percentage: number };
type Agenda = { registered: number; cancelled: number; toRegister: number; manualSessions: number };
type Patients = { activeCurrent: number; newInPeriod: number; followed: number; averageFrequency?: number };

export function MobileStatisticsDashboard({ periodControl, hasAnySessions, kpis, sessionCount, chart, services, agenda, patients, economy }: { periodControl: ReactNode; hasAnySessions: boolean; kpis: Kpi[]; sessionCount: number; chart: ActivityPoint[]; services: ServiceRow[]; agenda: Agenda; patients: Patients; economy: { delivered: string; received: string; receivedCents: number } }) {
  return <div className="md:hidden">
    {periodControl}
    {!hasAnySessions ? <section className="mt-7 border-y border-[#dde5db] py-8 text-center"><h2 className="text-lg font-semibold tracking-[-0.02em] text-[#2c4035]">Le statistiche cresceranno con la tua attività</h2><p className="mt-2 text-sm leading-6 text-[#738078]">Compariranno dopo la registrazione delle prime sedute.</p></section> : <>
      <section className="mt-7" aria-label="Indicatori principali">
        <div className="grid grid-cols-2 gap-2">{kpis.slice(0, 2).map(([label, value, detail]) => <article key={label} className="rounded-2xl bg-[#e8eee4] p-4"><p className="text-xs font-semibold text-[#64736a]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#24352f]">{value}</p><p className="mt-1 text-[0.68rem] text-[#7b877f]">{detail}</p></article>)}</div>
        <dl className="mt-3 divide-y divide-[#dde5db] border-y border-[#dde5db]">{kpis.slice(2).map(([label, value]) => <div key={label} className="flex min-h-12 items-center justify-between gap-4"><dt className="text-sm text-[#637168]">{label}</dt><dd className="font-semibold text-[#2b3f34]">{value}</dd></div>)}</dl>
      </section>

      <section className="mt-8" aria-labelledby="mobile-statistics-activity"><h2 id="mobile-statistics-activity" className="text-lg font-semibold tracking-[-0.02em] text-[#2b3f34]">Andamento dell’attività</h2><p className="mt-1 text-sm text-[#758179]">Sedute registrate nel periodo.</p><div className="mt-4">{sessionCount ? <ActivityChart points={chart} compact/> : <CompactEmpty>Non ci sono sedute nel periodo selezionato.</CompactEmpty>}</div></section>

      <section className="mt-8 border-t border-[#dde5db] pt-7" aria-labelledby="mobile-statistics-services"><h2 id="mobile-statistics-services" className="text-lg font-semibold tracking-[-0.02em] text-[#2b3f34]">Prestazioni</h2><p className="mb-5 mt-1 text-sm text-[#758179]">Distribuzione delle sedute registrate.</p><ServiceBreakdown rows={services}/></section>

      <section className="mt-8 rounded-2xl bg-[#edf2e9] p-4" aria-labelledby="mobile-statistics-economy"><div className="flex items-start justify-between gap-3"><h2 id="mobile-statistics-economy" className="text-lg font-semibold tracking-[-0.02em] text-[#2b3f34]">Economia</h2><Link href="/economia" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#46654c] active:bg-[#dce6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Apri</Link></div><dl className="grid grid-cols-2 gap-3"><div><dt className="text-xs text-[#6f7d74]">Valore erogato</dt><dd className="mt-1 text-lg font-semibold text-[#24352f]">{economy.delivered}</dd></div><div><dt className="text-xs text-[#6f7d74]">Incassato</dt><dd className="mt-1 text-lg font-semibold text-[#24352f]">{economy.received}</dd></div></dl>{economy.receivedCents === 0 && <p className="mt-3 text-xs leading-5 text-[#758179]">Nessun incasso registrato nel periodo.</p>}</section>

      <StatisticsList title="Agenda" description="Appuntamenti e registrazioni nel periodo." rows={[["Registrati", agenda.registered], ["Annullati", agenda.cancelled], ["Da registrare", agenda.toRegister], ["Sedute manuali", agenda.manualSessions]]}/>
      <StatisticsList title="Pazienti" description="Persone seguite e continuità dell’attività." rows={[["Pazienti attivi correnti", patients.activeCurrent], ["Nuovi nel periodo", patients.newInPeriod], ["Seguiti nel periodo", patients.followed], ["Frequenza media", patients.averageFrequency === undefined ? "—" : `${patients.averageFrequency.toLocaleString("it-IT", { maximumFractionDigits: 1 })} sedute`]]}/>
    </>}
  </div>;
}

function StatisticsList({ title, description, rows }: { title: string; description: string; rows: [string, string | number][] }) {
  const id = `mobile-statistics-${title.toLocaleLowerCase("it-IT")}`;
  return <section className="mt-8 border-t border-[#dde5db] pt-7" aria-labelledby={id}><h2 id={id} className="text-lg font-semibold tracking-[-0.02em] text-[#2b3f34]">{title}</h2><p className="mt-1 text-sm text-[#758179]">{description}</p><dl className="mt-4 divide-y divide-[#e1e7df]">{rows.map(([label, value]) => <div key={label} className="flex min-h-12 items-center justify-between gap-4"><dt className="text-sm text-[#637168]">{label}</dt><dd className="shrink-0 font-semibold text-[#2b3f34]">{value}</dd></div>)}</dl></section>;
}

function CompactEmpty({ children }: { children: ReactNode }) {
  return <p className="border-y border-[#dde5db] py-7 text-center text-sm text-[#738078]">{children}</p>;
}
