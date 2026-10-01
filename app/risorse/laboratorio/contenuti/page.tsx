import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ContentBankBrowser } from "@/components/content-bank-browser";
import { getContents } from "@/lib/content-bank/catalog";

export default function ContentBankPage() {
  return <AppShell>
    <Link href="/risorse/laboratorio" className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">← Torna al Laboratorio</Link>
    <header className="mt-4 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">Catalogo editoriale read-only</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Banca Contenuti ARMONIA</h1><p className="mt-3 text-base leading-7 text-slate-600">Parole, non-parole, coppie fonologiche, frasi, brani e sequenze riutilizzabili. Questa pagina mostra il mini corpus editoriale: non crea esercizi e non modifica dati clinici.</p></header>
    <ContentBankBrowser contents={getContents()} />
  </AppShell>;
}
