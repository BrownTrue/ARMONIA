import Link from "next/link";
import type { RefObject } from "react";
import { TwoLineMenuIcon } from "./navigation-icons";
import type { MobileHeaderDetail } from "../app-shell";

export function MobileHeader({ title, detail, menuButtonRef, drawerOpen, onOpen }: { title: string; detail?: MobileHeaderDetail; menuButtonRef: RefObject<HTMLButtonElement | null>; drawerOpen: boolean; onOpen: () => void }) {
  return <header className="sticky top-0 z-30 flex min-h-[calc(3.65rem+env(safe-area-inset-top))] items-end border-b border-[#dfe7dc]/70 bg-[#f7f7f2]/95 pb-2 pt-[max(0.45rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] backdrop-blur-md md:hidden">
    {detail ? detail.onBack ? <button type="button" onClick={detail.onBack} aria-label={detail.backLabel || "Torna indietro"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf1e9]/80 text-[#526159] transition-colors hover:bg-[#e5ece1] active:bg-[#dce6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f2]"><BackIcon /></button> : <Link href={detail.backHref} aria-label={detail.backLabel || "Torna indietro"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf1e9]/80 text-[#526159] transition-colors hover:bg-[#e5ece1] active:bg-[#dce6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f2]"><BackIcon /></Link> : <button ref={menuButtonRef} type="button" aria-label="Apri menu" aria-expanded={drawerOpen} aria-controls="mobile-navigation-drawer" onClick={onOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf1e9]/80 text-[#526159] transition-colors hover:bg-[#e5ece1] active:bg-[#dce6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f2]">
      <TwoLineMenuIcon className="h-5 w-5"/>
    </button>}
    <h1 className="min-w-0 flex-1 truncate px-2.5 pb-[0.7rem] text-left text-[0.98rem] font-semibold tracking-[-0.012em] text-[#24352f]">{title}</h1>
  </header>;
}

function BackIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6-6 6 6 6"/><path d="M9 12h9"/></svg>;
}
