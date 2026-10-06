import type { ActivityPoint } from "@/lib/statistics/metrics";

export function ActivityChart({ points, compact = false }: { points: ActivityPoint[]; compact?: boolean }) {
  const max = Math.max(1, ...points.map((point) => point.sessions));
  const step = points.length > 18 ? Math.ceil(points.length / 7) : points.length > 10 ? 2 : 1;
  return <div>
    <div className="mb-4 flex items-center gap-2 text-xs text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-sage-500" aria-hidden="true" /> Numero di sedute</div>
    <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className={`flex items-end border-b border-slate-200 px-1 ${compact ? "h-48 min-w-0 gap-1" : "h-56 min-w-[580px] gap-1.5 sm:min-w-0 sm:gap-2"}`} role="img" aria-label="Andamento del numero di sedute nel periodo">
        {points.map((point, index) => <div key={point.key} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none" tabIndex={0} aria-label={`${point.label}: ${point.sessions} sedute, ${(point.minutes / 60).toLocaleString("it-IT", { maximumFractionDigits: 1 })} ore`}>
          <div className="pointer-events-none absolute bottom-[calc(var(--bar-height)+2.25rem)] z-10 hidden w-36 -translate-x-1/2 rounded-lg bg-slate-900 p-2 text-center text-xs text-white shadow-lg group-hover:block group-focus:block" style={{ left: "50%", ["--bar-height" as string]: `${Math.max(point.sessions ? 8 : 2, point.sessions / max * 150)}px` }}><b>{point.label}</b><br />{point.sessions} {point.sessions === 1 ? "seduta" : "sedute"} · {(point.minutes / 60).toLocaleString("it-IT", { maximumFractionDigits: 1 })} h</div>
          <span className="mb-1 text-[10px] font-bold text-slate-600">{point.sessions || ""}</span>
          <div className={`w-full rounded-t-md transition-colors ${point.sessions ? "bg-sage-500 group-hover:bg-sage-700 group-focus:bg-sage-700" : "bg-slate-100"}`} style={{ height: `${Math.max(point.sessions ? 8 : 2, point.sessions / max * 150)}px` }} />
          <span className="mt-2 h-5 whitespace-nowrap text-[10px] text-slate-500">{index % step === 0 || index === points.length - 1 ? point.label : ""}</span>
        </div>)}
      </div>
    </div>
  </div>;
}
