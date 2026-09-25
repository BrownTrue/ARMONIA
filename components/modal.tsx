"use client";

import { useEffect, useId, useRef } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [onClose]);
  return <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 grid place-items-end bg-black/30 sm:place-items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div ref={panelRef} className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-3xl"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-sage-100 px-5 py-4 sm:px-7"><h2 id={titleId} className="min-w-0 text-xl font-bold">{title}</h2><button aria-label="Chiudi" onClick={onClose} className="btn btn-quiet grid h-11 w-11 shrink-0 place-items-center p-0 text-xl">×</button></div><div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">{children}</div></div></div>;
}
