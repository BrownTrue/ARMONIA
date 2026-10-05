import Image from "next/image";
import type { RefObject } from "react";

export function MobileHeader({ title, menuButtonRef, drawerOpen, onOpen }: { title: string; menuButtonRef: RefObject<HTMLButtonElement | null>; drawerOpen: boolean; onOpen: () => void }) {
  return <header className="sticky top-0 z-30 flex min-h-[calc(3.65rem+env(safe-area-inset-top))] items-end border-b border-[#dfe7dc]/70 bg-[#f7f7f2]/95 pb-2 pt-[max(0.45rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] backdrop-blur-md md:hidden">
    <button ref={menuButtonRef} type="button" aria-label="Apri menu" aria-expanded={drawerOpen} aria-controls="mobile-navigation-drawer" onClick={onOpen} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#edf1e9]/80 px-2.5 pr-3.5 text-[#526159] transition hover:bg-[#e5ece1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f2]">
      <Image src="/branding/logo-mark.svg" alt="" width={23} height={27} priority className="h-[1.7rem] w-auto"/>
      <span aria-hidden="true" className="text-[0.78rem] font-medium tracking-[0.01em]">Menu</span>
    </button>
    <h1 className="min-w-0 flex-1 truncate px-2.5 pb-[0.7rem] text-left text-[0.98rem] font-semibold tracking-[-0.012em] text-[#24352f]">{title}</h1>
  </header>;
}
