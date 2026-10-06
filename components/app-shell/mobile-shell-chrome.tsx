"use client";

import { useEffect, useRef, useState } from "react";
import { MobileHeader } from "./mobile-header";
import { MobileNavigationDrawer } from "./mobile-navigation-drawer";
import { mobilePageTitle } from "./navigation-model";
import type { MobileHeaderDetail } from "../app-shell";

const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function MobileShellChrome({ pathname, detailHeader, profile, localMode, onLogout }: { pathname: string; detailHeader?: MobileHeaderDetail; profile: { name: string; profession: string; initials: string }; localMode: boolean; onLogout: () => Promise<void> }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const closeDrawer = () => { setDrawerOpen(false); setAccountOpen(false); };
  useEffect(() => closeDrawer(), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const panel = drawerRef.current;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeDrawer(); return; }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(focusableSelector)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; menuButtonRef.current?.focus(); };
  }, [drawerOpen]);

  return <>
    <MobileHeader title={detailHeader?.title || mobilePageTitle(pathname)} detail={detailHeader} menuButtonRef={menuButtonRef} drawerOpen={drawerOpen} onOpen={() => setDrawerOpen(true)}/>
    {drawerOpen && <MobileNavigationDrawer pathname={pathname} drawerRef={drawerRef} profile={profile} accountOpen={accountOpen} localMode={localMode} onToggleAccount={() => setAccountOpen((current) => !current)} onClose={closeDrawer} onLogout={async () => { closeDrawer(); await onLogout(); }}/>} 
  </>;
}
