import Link from "next/link";
import { ChevronRightIcon } from "@/components/app-shell/navigation-icons";

type ResourceArea = { title: string; description: string; href: string };

export function MobileResourceDirectory({ areas }: { areas: readonly ResourceArea[] }) {
  return <nav className="md:hidden" aria-label="Aree Risorse">
    <div className="divide-y divide-[#dde5db]">{areas.map((area) => <Link key={area.href} href={area.href} className="flex min-h-[5.25rem] w-full items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-[#f0f3ed] active:bg-[#e4ebe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e5ece1] text-[#526c59]"><ResourceAreaIcon href={area.href}/></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[0.98rem] font-semibold tracking-[-0.015em] text-[#2b3f34]">{area.title}</span><span className="mt-1 block line-clamp-1 text-xs leading-5 text-[#758179]">{area.description}</span></span>
      <ChevronRightIcon className="mr-1 h-4 w-4 shrink-0 text-[#91a097]"/>
    </Link>)}</div>
  </nav>;
}

function ResourceAreaIcon({ href }: { href: string }) {
  const common = { "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "h-5 w-5" };
  if (href === "/materiali") return <svg {...common}><path d="M4.25 7.25A2.25 2.25 0 0 1 6.5 5h3.75l2 2h5.25a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 17.5 19h-11a2.25 2.25 0 0 1-2.25-2.25Z"/><path d="M4.25 9.5h15.5"/></svg>;
  if (href === "/risorse/documenti") return <svg {...common}><path d="M6 3.75h8l4 4v12.5H6z"/><path d="M14 3.75v4h4M9 12h6M9 15.5h6"/></svg>;
  if (href === "/risorse/strumenti") return <svg {...common}><path d="M7.5 4.25h9v4.5a4.5 4.5 0 0 1-9 0Z"/><path d="M5 5.75H3.75v1.5A4.25 4.25 0 0 0 8 11.5M19 5.75h1.25v1.5A4.25 4.25 0 0 1 16 11.5M12 13.25v3.5M8.75 20h6.5M9.5 16.75h5"/></svg>;
  return <svg {...common}><path d="M8.25 3.75h7.5M9 3.75v5.1l-4.4 7.4A2.5 2.5 0 0 0 6.75 20h10.5a2.5 2.5 0 0 0 2.15-3.75L15 8.85v-5.1"/><path d="M7.5 14h9M10 10.75h4"/></svg>;
}
