import Image from "next/image";
import Link from "next/link";
import { desktopNavigationItems, isNavigationItemActive } from "./navigation-model";

export function DesktopShellChrome({ pathname, profile }: { pathname: string; profile: { firstName: string; lastName: string; profession: string } }) {
  return <aside className="hidden w-64 shrink-0 border-r border-sage-100 bg-white px-5 py-7 md:block">
    <Link href="/oggi" className="mb-10 flex items-center gap-3 text-xl font-bold"><Image src="/branding/logo-mark.svg" alt="" width={35} height={40} priority className="h-10 w-auto shrink-0"/>Armonia</Link>
    <nav className="space-y-2" aria-label="Navigazione principale">{desktopNavigationItems.map((item) => <Link className={`nav-link ${isNavigationItemActive(pathname, item.href) ? "active" : ""}`} key={item.href} href={item.href} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined}><span aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>)}</nav>
    <Link href="/impostazioni" className="mt-12 block rounded-2xl bg-sage-50 p-4 text-sm"><p className="font-bold">{profile.firstName} {profile.lastName}</p><p className="mt-1 text-slate-500">{profile.profession}</p></Link>
  </aside>;
}
