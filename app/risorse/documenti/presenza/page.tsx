import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import editorial from "@/components/resources/resource-editorial.module.css";
import { AttendanceAttestationGenerator } from "@/components/resources/attendance-attestation-generator";

export default function AttendanceAttestationPage() {
  return <AppShell mainClassName={`${editorial.detailMain} ${editorial.attendance}`}>
    <header className="max-w-3xl">
      <Link href="/risorse/documenti" className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">← Torna a Modulistica e handout</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-sage-600">Modulistica</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Attestazione di presenza</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Genera un documento professionale a partire da una seduta già registrata.</p>
    </header>
    <AttendanceAttestationGenerator />
  </AppShell>;
}
