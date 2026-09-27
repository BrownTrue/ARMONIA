"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LocationsSettings } from "@/components/settings/locations-settings";
import { ServicesSettings } from "@/components/settings/services-settings";

type Section = "locations" | "services";

export function CalendarSettingsPanel({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const [section, setSection] = useState<Section>("locations");
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
      if (dialogs.at(-1) !== panel) return;
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  return <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onMouseDown={(event) => event.target === event.currentTarget && onCloseRef.current()}>
    <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-full w-full max-w-3xl flex-col bg-[#f8faf7] shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-sage-100 bg-white px-4 py-4 sm:px-6"><div><h2 id={titleId} className="text-xl font-bold">Impostazioni calendario</h2><p className="mt-1 text-sm text-slate-500">Organizza sedi e prestazioni per il tuo lavoro quotidiano.</p></div><button type="button" aria-label="Chiudi impostazioni calendario" onClick={() => onCloseRef.current()} className="btn btn-quiet grid h-11 w-11 shrink-0 place-items-center p-0 text-xl">×</button></header>
      <div className="shrink-0 border-b border-sage-100 bg-white px-4 sm:px-6"><div role="tablist" aria-label="Sezioni impostazioni calendario" className="grid grid-cols-2 gap-1 rounded-xl bg-sage-50 p-1"><button type="button" role="tab" aria-selected={section === "locations"} aria-controls="calendar-settings-locations" onClick={() => setSection("locations")} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-sage-600 ${section === "locations" ? "bg-white text-sage-700 shadow-sm" : "text-slate-500"}`}>Sedi</button><button type="button" role="tab" aria-selected={section === "services"} aria-controls="calendar-settings-services" onClick={() => setSection("services")} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-sage-600 ${section === "services" ? "bg-white text-sage-700 shadow-sm" : "text-slate-500"}`}>Prestazioni</button></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">{section === "locations" ? <div id="calendar-settings-locations" role="tabpanel"><LocationsSettings/></div> : <div id="calendar-settings-services" role="tabpanel"><ServicesSettings/></div>}</div>
    </aside>
  </div>;
}
