import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import editorial from "@/components/resources/resource-editorial.module.css";
import { ClinicalToolDirectory } from "@/components/clinical-tools/tool-directory";
import { visibleClinicalTools } from "@/lib/clinical-tools/catalog";

export default function ResourceToolsPage() {
  return <AppShell mainClassName={`${editorial.main} ${editorial.tools}`}>
    <Link href="/risorse" className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">← Torna a Risorse</Link>
    <header className="mt-4 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Directory professionale</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Strumenti clinici</h1><p className="mt-3 text-base leading-7 text-slate-600">Trova strumenti di screening, valutazione e monitoraggio selezionati per la pratica logopedica.</p></header>
    <ClinicalToolDirectory tools={visibleClinicalTools} />
  </AppShell>;
}
