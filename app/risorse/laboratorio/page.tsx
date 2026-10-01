import Link from "next/link";
import { ResourceAreaShell } from "@/components/resource-area-shell";

export default function ResourceLabPage() {
  return <ResourceAreaShell title="Laboratorio esercizi ARMONIA" description="Un futuro spazio per costruire attività e compiti a casa collegabili al lavoro terapeutico, senza appesantire la gestione quotidiana." icon="◇" tone="bg-violet-50 text-violet-700">
    <div className="mt-8 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600" aria-label="Flusso futuro del laboratorio">
      {['Mattoncini', 'Ricette', 'Esercizi', 'Compiti a casa'].map((label, index) => <div className="contents" key={label}>{index > 0 && <span className="text-slate-300" aria-hidden="true">→</span>}<span className="rounded-full border border-violet-100 bg-violet-50/70 px-3 py-2">{label}</span></div>)}
    </div>
    <div className="mt-8 border-t border-violet-100 pt-6"><p className="text-sm font-bold">Fondazione editoriale</p><p className="mt-1 text-sm leading-6 text-slate-500">Consulta il catalogo curato che alimenterà i futuri strumenti del Laboratorio.</p><Link href="/risorse/laboratorio/banca" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-violet-100 px-4 text-sm font-bold text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">Apri Banca Asset →</Link></div>
  </ResourceAreaShell>;
}
