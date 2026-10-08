import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export function ResourceAreaShell({ title, description, icon, tone, children, mainClassName }: { title: string; description: string; icon: string; tone: string; children?: React.ReactNode; mainClassName?: string }) {
  return <AppShell mainClassName={mainClassName}>
    <Link href="/risorse" className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">← Torna a Risorse</Link>
    <section className="mx-auto mt-4 max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(43,69,55,.06)] sm:p-10">
      <div className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl ${tone}`} aria-hidden="true">{icon}</div>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-slate-400">In preparazione</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      {children}
    </section>
  </AppShell>;
}
