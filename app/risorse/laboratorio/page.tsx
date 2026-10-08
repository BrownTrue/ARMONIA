import Link from "next/link";
import { ResourceAreaShell } from "@/components/resource-area-shell";
import editorial from "@/components/resources/resource-editorial.module.css";

export default function ResourceLabPage() {
  const entries = [
    { title: "Crea nuova scheda", description: "Componi più attività in un’unica scheda.", action: "Crea scheda", href: "/risorse/laboratorio/crea" },
    { title: "Modelli di scheda", description: "Riutilizza schede complete che hai già preparato.", action: "Apri modelli", href: "/risorse/laboratorio/crea?mode=templates" },
    { title: "Attività salvate", description: "Riparti rapidamente da configurazioni di attività che usi spesso.", action: "Apri attività salvate", href: "/risorse/laboratorio/crea?mode=saved" },
    { title: "Banca contenuti", description: "Esplora immagini, parole, coppie, frasi e brani disponibili.", action: "Apri contenuti", href: "/risorse/laboratorio/contenuti" },
  ];
  return <ResourceAreaShell mainClassName={`${editorial.main} ${editorial.lab}`} title="Laboratorio esercizi" description="Crea attività e schede da usare in seduta o da stampare." icon="◇" tone="bg-violet-50 text-violet-700">
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{entries.map((entry) => <Link key={entry.href} href={entry.href} className="group flex min-h-52 flex-col rounded-[1.5rem] border border-violet-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><h2 className="text-lg font-bold text-slate-900">{entry.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{entry.description}</p><span className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-violet-800">{entry.action}<span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link>)}</div>
  </ResourceAreaShell>;
}
