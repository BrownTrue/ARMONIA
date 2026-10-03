import type { StatisticsPeriod, StatisticsPeriodPreset } from "@/lib/statistics/periods";

const options: [StatisticsPeriodPreset, string][] = [
  ["current_month", "Questo mese"], ["previous_month", "Mese scorso"], ["last_3_months", "Ultimi 3 mesi"],
  ["last_6_months", "Ultimi 6 mesi"], ["current_year", "Quest'anno"], ["custom", "Personalizzato"],
];

export function StatisticsPeriodFilter({ preset, period, custom, onPreset, onCustom }: { preset: StatisticsPeriodPreset; period: StatisticsPeriod; custom: { from: string; to: string }; onPreset: (value: StatisticsPeriodPreset) => void; onCustom: (value: { from: string; to: string }) => void }) {
  return <div className="rounded-2xl border border-sage-100 bg-white p-3 shadow-sm sm:p-4">
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden" aria-label="Periodo statistiche">
      {options.map(([key, label]) => <button key={key} type="button" aria-pressed={preset === key} onClick={() => onPreset(key)} className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${preset === key ? "border-sage-600 bg-sage-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-sage-300 hover:bg-sage-50"}`}>{label}</button>)}
    </div>
    {preset === "custom" && <div className="mt-3 grid gap-3 sm:max-w-lg sm:grid-cols-2">
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Dal<input type="date" value={custom.from} max={custom.to} onChange={(event) => onCustom({ ...custom, from: event.target.value })} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal normal-case text-slate-800 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100" /></label>
      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Al<input type="date" value={custom.to} min={custom.from} onChange={(event) => onCustom({ ...custom, to: event.target.value })} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal normal-case text-slate-800 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100" /></label>
    </div>}
    <p className="mt-2 text-xs text-slate-500">Periodo effettivo: {period.label}</p>
  </div>;
}
