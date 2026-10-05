import Link from "next/link";
import type { RefObject } from "react";
import { MobileAccountMenu } from "./mobile-account-menu";
import { NavigationIcon } from "./navigation-icons";
import { isNavigationItemActive, primaryNavigationItems, secondaryNavigationItems, type NavigationItem } from "./navigation-model";

type ProfileSummary = { name: string; profession: string; initials: string };

export function MobileNavigationDrawer({ pathname, drawerRef, profile, accountOpen, localMode, onToggleAccount, onClose, onLogout }: { pathname: string; drawerRef: RefObject<HTMLElement | null>; profile: ProfileSummary; accountOpen: boolean; localMode: boolean; onToggleAccount: () => void; onClose: () => void; onLogout: () => Promise<void> }) {
  const managementItems = secondaryNavigationItems.filter((item) => item.href !== "/impostazioni");
  const settingsItem = secondaryNavigationItems.find((item) => item.href === "/impostazioni");
  return <div className="fixed inset-0 z-50 md:hidden">
    <button type="button" aria-label="Chiudi navigazione" className="mobile-drawer-backdrop absolute inset-0 bg-[#1f2e27]/15" onClick={onClose}/>
    <aside ref={drawerRef} id="mobile-navigation-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" className="mobile-drawer-panel absolute inset-y-0 left-0 flex w-[88vw] max-w-[22rem] flex-col overflow-hidden rounded-r-[1.75rem] bg-[#f7f6f0] pl-[max(0rem,env(safe-area-inset-left))] shadow-[20px_0_50px_rgba(31,45,37,.1)]">
      <h2 id="mobile-navigation-title" className="sr-only">Navigazione ARMONIA</h2>
      <div className="shrink-0 px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-2">
          <button type="button" aria-expanded={accountOpen} aria-controls="mobile-account-menu" onClick={onToggleAccount} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 text-left transition hover:bg-[#eef1e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e2e9dc] text-[0.72rem] font-semibold tracking-[0.08em] text-[#385842]">{profile.initials}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.92rem] font-semibold tracking-[-0.01em] text-[#24352f]">{profile.name}</span><span className="mt-0.5 block text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#819087]">Armonia</span></span>
            <span aria-hidden="true" className={`mr-1 text-xs text-[#89958e] transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}>⌄</span>
          </button>
          <button type="button" aria-label="Chiudi navigazione" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-light text-[#758179] transition hover:bg-[#e9ede5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">×</button>
        </div>
        <MobileAccountMenu open={accountOpen} localMode={localMode} onNavigate={onClose} onLogout={onLogout}/>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <MobileNavigationGroup label="Principale" items={primaryNavigationItems} pathname={pathname} onNavigate={onClose}/>
        <div className="mt-8"><MobileNavigationGroup label="Gestione" items={managementItems} pathname={pathname} onNavigate={onClose}/></div>
        {settingsItem && <div className="mt-auto pt-8"><MobileNavigationLink item={settingsItem} pathname={pathname} onNavigate={onClose}/></div>}
      </div>
    </aside>
  </div>;
}

function MobileNavigationGroup({ label, items, pathname, onNavigate }: { label: string; items: readonly NavigationItem[]; pathname: string; onNavigate: () => void }) {
  return <nav aria-label={label}><p className="mb-2.5 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#96a097]">{label}</p><div className="space-y-1">{items.map((item) => <MobileNavigationLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate}/>)}</div></nav>;
}

function MobileNavigationLink({ item, pathname, onNavigate }: { item: NavigationItem; pathname: string; onNavigate: () => void }) {
  const active = isNavigationItemActive(pathname, item.href);
  return <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3.5 rounded-2xl px-3.5 text-[0.94rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${active ? "bg-[#e7ede2] font-semibold text-[#294535]" : "font-medium text-[#637168] hover:bg-[#edefe9] hover:text-[#34483d]"}`}><NavigationIcon name={item.mobileIcon} className={`h-[1.18rem] w-[1.18rem] shrink-0 ${active ? "text-[#52715a]" : "text-[#849087]"}`}/><span>{item.label}</span></Link>;
}
