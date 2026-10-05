import Link from "next/link";
import { ChevronRightIcon } from "@/components/app-shell/navigation-icons";
import { patientDirectoryMeta } from "@/lib/patient-directory";
import type { Patient } from "@/lib/types";
import { fullName, initials } from "@/lib/types";

type Props = {
  patients: Patient[];
  totalPatients: number;
  ready: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
};

export function MobilePatientDirectory({ patients, totalPatients, ready, query, onQueryChange, onCreate }: Props) {
  return <div className="md:hidden">
    <div className="mb-6 flex items-center gap-2">
      <label htmlFor="mobile-patient-search" className="relative min-w-0 flex-1">
        <span className="sr-only">Cerca paziente</span>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-[#819087]"/>
        <input id="mobile-patient-search" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cerca paziente" className="h-12 w-full rounded-xl border border-[#dce5da] bg-white/80 py-2 pl-10 pr-3 text-[0.95rem] text-[#2d4036] outline-none transition-colors placeholder:text-[#929c95] focus:border-[#76917b] focus:bg-white focus-visible:ring-2 focus-visible:ring-sage-400"/>
      </label>
      <button type="button" onClick={onCreate} className="inline-flex h-12 shrink-0 items-center rounded-xl bg-[#46654c] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#385840] active:bg-[#2f4c37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">+ Nuovo</button>
    </div>

    {!ready ? <p className="py-8 text-sm text-[#738078]">Caricamento…</p> : totalPatients === 0 ? <EmptyDirectory onCreate={onCreate}/> : patients.length === 0 ? <p className="border-y border-[#dde5db] py-8 text-center text-sm text-[#6f7d74]" role="status">Nessun paziente trovato.</p> : <div className="divide-y divide-[#dde5db]" aria-label="Elenco pazienti">{patients.map((patient) => <PatientRow key={patient.id} patient={patient}/>)}</div>}
  </div>;
}

function PatientRow({ patient }: { patient: Patient }) {
  return <Link href={`/pazienti/${patient.id}`} aria-label={`Apri ${fullName(patient)}`} className="flex min-h-[4.75rem] w-full items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-[#f0f3ed] active:bg-[#e4ebe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e3eadf] text-xs font-semibold tracking-[0.03em] text-[#46654c]">{initials(patient)}</span>
    <span className="min-w-0 flex-1"><span className="block truncate text-[0.98rem] font-semibold tracking-[-0.015em] text-[#2b3f34]">{fullName(patient)}</span><span className="mt-1 block truncate text-xs text-[#758179]">{patientDirectoryMeta(patient)}</span></span>
    <ChevronRightIcon className="mr-1 h-4 w-4 shrink-0 text-[#91a097]"/>
  </Link>;
}

function EmptyDirectory({ onCreate }: { onCreate: () => void }) {
  return <section className="border-y border-[#dde5db] py-8 text-center" aria-labelledby="mobile-patients-empty"><h2 id="mobile-patients-empty" className="text-lg font-semibold tracking-[-0.02em] text-[#2c4035]">Nessun paziente ancora.</h2><p className="mt-1 text-sm leading-6 text-[#738078]">Aggiungi la prima persona alla tua directory.</p><button type="button" onClick={onCreate} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#46654c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#385840] active:bg-[#2f4c37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Nuovo paziente</button></section>;
}

function SearchIcon({ className }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="10.75" cy="10.75" r="6.25"/><path d="m15.5 15.5 4 4"/></svg>;
}
