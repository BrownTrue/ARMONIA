"use client";
import { useState } from "react";

type ServiceRow = { key: string; name: string; sessions: number; minutes: number; percentage: number };
export function ServiceBreakdown({ rows }: { rows: ServiceRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 3);
  if (!rows.length) return <p className="text-sm text-slate-500">Nessuna seduta registrata nel periodo selezionato.</p>;
  return <div className="space-y-4">{visible.map((row) => <div key={row.key}>
    <div className="flex items-start justify-between gap-3 text-sm"><span className="font-semibold text-slate-800">{row.name}</span><span className="shrink-0 text-slate-500">{row.sessions} · {(row.minutes / 60).toLocaleString("it-IT", { maximumFractionDigits: 1 })} h</span></div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sage-500" style={{ width: `${Math.max(2, row.percentage)}%` }} /></div>
    <p className="mt-1 text-xs text-slate-400">{row.percentage.toLocaleString("it-IT", { maximumFractionDigits: 0 })}% del totale</p>
  </div>)}{rows.length > 3 && <button type="button" className="text-sm font-semibold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500" onClick={() => setExpanded((value) => !value)}>{expanded ? "Mostra meno" : `Mostra tutte (${rows.length})`}</button>}</div>;
}
