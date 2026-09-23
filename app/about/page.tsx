import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Informazioni | Armonia",
  description: "Informazioni su Armonia, gestionale per l'attività professionale logopedica.",
};

const features = [
  "Pazienti",
  "Appuntamenti",
  "Sedute",
  "Obiettivi",
  "Materiali",
  "Calendario professionale",
];

export default function AboutPage() {
  return (
    <PublicPage>
      <section className="card p-6 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-sage-700">Informazioni</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Armonia</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Armonia è un&apos;applicazione per la gestione dell&apos;attività professionale logopedica.
        </p>

        <h2 className="mt-10 text-2xl font-bold">Un unico spazio di lavoro</h2>
        <p className="mt-3 leading-7 text-slate-600">
          L&apos;app riunisce gli strumenti necessari per organizzare il lavoro quotidiano:
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="rounded-xl bg-sage-50 px-4 py-3 font-medium">
              {feature}
            </li>
          ))}
        </ul>

        <section className="mt-10 rounded-2xl border border-sage-100 bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Google Calendar</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Armonia può collegarsi volontariamente a Google Calendar per creare e mantenere
            sincronizzati gli appuntamenti nel calendario dedicato creato dall&apos;app.
          </p>
          <p className="mt-4 font-bold text-sage-700">Sincronizzazione unidirezionale: Armonia → Google Calendar.</p>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="btn btn-primary">Leggi la Privacy Policy</Link>
          <Link href="/login" className="font-bold text-sage-700 hover:underline">Accedi ad Armonia</Link>
        </div>
      </section>
    </PublicPage>
  );
}
