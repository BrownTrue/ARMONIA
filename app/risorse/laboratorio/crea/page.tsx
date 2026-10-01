import Link from "next/link";
import { ResourceAreaShell } from "@/components/resource-area-shell";
import { ExerciseLabBuilder } from "@/components/exercise-lab-builder";

export default function ExerciseLabCreatePage() {
  return <ResourceAreaShell title="Crea attività" description="Parti da un’attività e lascia che ARMONIA selezioni il materiale." icon="◇" tone="bg-violet-50 text-violet-700">
    <div className="mt-5 flex flex-wrap gap-4"><Link href="/risorse/laboratorio" className="inline-flex text-sm font-bold text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">← Torna al Laboratorio</Link><Link href="/risorse/laboratorio/contenuti" className="inline-flex text-sm font-bold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">Banca contenuti →</Link></div>
    <ExerciseLabBuilder />
  </ResourceAreaShell>;
}
