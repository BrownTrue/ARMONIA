import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HANDOUTS_V1, type ArmoniaHandout } from "@/data/resources/handouts-v1";

const attestations = [
  {
    title: "Attestazione di presenza",
    description: "Documento professionale compilabile con i dati della presenza e del professionista.",
    href: "/risorse/documenti/presenza",
  },
  {
    title: "Attestazione di percorso logopedico",
    description: "Documento compilabile per attestare in modo essenziale un percorso logopedico.",
    href: undefined,
  },
] as const;

export default function ResourceDocumentsPage() {
  return <AppShell>
    <header className="max-w-3xl">
      <Link href="/risorse" className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">← Torna a Risorse</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-sage-600">Risorse</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Modulistica e handout</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Documenti pratici e materiali informativi pronti per il lavoro quotidiano.</p>
    </header>

    <section className="mt-10" aria-labelledby="attestations-title">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-sage-600">Modulistica</p>
      <h2 id="attestations-title" className="mt-1 text-2xl font-bold">Attestazioni</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {attestations.map((attestation) => <article key={attestation.title} className="flex flex-col rounded-[1.5rem] border border-sage-100 bg-white p-5 shadow-[0_12px_32px_rgba(43,69,55,.05)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-bold text-sage-700">Compilabile in ARMONIA</span>
            {!attestation.href && <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">Prossimamente</span>}
          </div>
          <h3 className="mt-5 text-lg font-bold text-slate-900">{attestation.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{attestation.description}</p>
          {attestation.href && <Link href={attestation.href} className="mt-5 inline-flex min-h-11 items-center self-start rounded-xl bg-sage-700 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Compila</Link>}
        </article>)}
      </div>
    </section>

    <section className="mt-12" aria-labelledby="handouts-title">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-sage-600">Materiali informativi</p>
        <h2 id="handouts-title" className="mt-1 text-2xl font-bold">Handout</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">PDF pronti da consultare, scaricare e condividere secondo le esigenze del percorso.</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {HANDOUTS_V1.map((handout) => <HandoutCard key={handout.id} handout={handout} />)}
      </div>
    </section>
  </AppShell>;
}

function HandoutCard({ handout }: { handout: ArmoniaHandout }) {
  return <article className="flex flex-col rounded-[1.5rem] border border-sage-100 bg-white p-5 shadow-[0_12px_32px_rgba(43,69,55,.05)] sm:p-6">
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-sage-700">
      <span className="rounded-full bg-sage-50 px-3 py-1">{handout.category}</span>
      <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">v{handout.version}</span>
    </div>
    <h3 className="mt-5 text-xl font-bold leading-tight text-slate-900">{handout.title}</h3>
    <p className="mt-1 text-sm font-medium text-sage-700">{handout.subtitle}</p>
    <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{handout.description}</p>
    <p className="mt-4 text-xs text-slate-500"><span className="font-bold text-slate-600">Destinatari:</span> {handout.audience}</p>
    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
      <a href={handout.pdfPath} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-sage-700 px-4 text-center text-sm font-bold text-white transition hover:bg-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Apri anteprima</a>
      <a href={handout.pdfPath} download={handout.fileName} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-sage-200 bg-white px-4 text-center text-sm font-bold text-sage-700 transition hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Scarica PDF</a>
    </div>
  </article>;
}
