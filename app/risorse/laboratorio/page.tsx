import { ResourceAreaShell } from "@/components/resource-area-shell";

export default function ResourceLabPage() {
  return <ResourceAreaShell title="Laboratorio esercizi ARMONIA" description="Un futuro spazio per costruire attività e compiti a casa collegabili al lavoro terapeutico, senza appesantire la gestione quotidiana." icon="◇" tone="bg-violet-50 text-violet-700">
    <div className="mt-8 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600" aria-label="Flusso futuro del laboratorio">
      {['Mattoncini', 'Ricette', 'Esercizi', 'Compiti a casa'].map((label, index) => <div className="contents" key={label}>{index > 0 && <span className="text-slate-300" aria-hidden="true">→</span>}<span className="rounded-full border border-violet-100 bg-violet-50/70 px-3 py-2">{label}</span></div>)}
    </div>
  </ResourceAreaShell>;
}
