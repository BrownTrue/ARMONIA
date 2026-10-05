"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { MobileAssessmentSurface } from "@/lib/clinical/mobile-assessment-navigation";
import { mobileAssessmentSearch, parseMobileAssessmentSurface, previousMobileAssessmentSurface } from "@/lib/clinical/mobile-assessment-navigation";

export function useMobileAssessmentLayout(stepCount: number) {
  const mobile = useSyncExternalStore(
    (notify) => { const media = window.matchMedia("(max-width: 767px)"); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
  const [surface, setSurface] = useState<MobileAssessmentSurface>({ kind: "overview" });
  useEffect(() => {
    const sync = () => setSurface(parseMobileAssessmentSurface(window.location.search, stepCount));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [stepCount]);
  const navigate = useCallback((next: MobileAssessmentSurface, replace = false) => {
    setSurface(next);
    const href = `${window.location.pathname}${mobileAssessmentSearch(window.location.search, next)}${window.location.hash}`;
    window.history[replace ? "replaceState" : "pushState"]({}, "", href);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const back = useCallback(() => navigate(previousMobileAssessmentSurface(surface), true), [navigate, surface]);
  return { mobile, surface, navigate, back };
}

export function MobileAssessmentIdentity({ patientName, assessmentType, status, saveLabel, saveError = false }: { patientName: string; assessmentType: string; status: string; saveLabel: string; saveError?: boolean }) {
  return <header className="border-b border-sage-100 bg-white px-4 py-5">
    <p className="text-sm font-semibold text-sage-700">{patientName}</p>
    <div className="mt-1 flex items-start justify-between gap-3"><div className="min-w-0"><h1 className="text-xl font-bold leading-tight">{assessmentType}</h1><p className="mt-1 text-xs text-slate-500">{status}</p></div><p aria-live="polite" className={`shrink-0 pt-1 text-xs font-semibold ${saveError ? "text-red-600" : "text-slate-400"}`}>{saveLabel}</p></div>
  </header>;
}

export function MobileAssessmentOverview({ title = "Sezioni della valutazione", children }: { title?: string; children: React.ReactNode }) {
  return <section className="px-4 pb-8 pt-5"><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">Apri una sezione alla volta. Le modifiche della bozza vengono salvate automaticamente.</p><div className="mt-4 overflow-hidden rounded-2xl border border-sage-100 bg-white">{children}</div></section>;
}

export function MobileAssessmentRow({ title, subtitle, invalid = false, onClick }: { title: string; subtitle?: string; invalid?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center justify-between gap-4 border-b border-sage-100 px-4 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500">
    <span className="min-w-0"><span className="block font-semibold text-ink">{title}</span>{subtitle && <span className={`mt-0.5 block text-xs ${invalid ? "font-semibold text-amber-700" : "text-slate-500"}`}>{subtitle}</span>}</span><span aria-hidden="true" className="text-xl text-sage-600">›</span>
  </button>;
}

export function MobileAssessmentFooter({ backLabel = "Indietro", nextLabel = "Continua", showBack = true, showNext = true, onBack, onNext }: { backLabel?: string; nextLabel?: string; showBack?: boolean; showNext?: boolean; onBack: () => void; onNext: () => void }) {
  return <div className="sticky bottom-0 z-20 mt-6 border-t border-sage-100 bg-[#f7f7f2]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"><div className="flex gap-3">{showBack && <button type="button" onClick={onBack} className="btn btn-quiet min-h-11 flex-1">{backLabel}</button>}{showNext && <button type="button" onClick={onNext} className="btn btn-primary min-h-11 flex-1">{nextLabel}</button>}</div></div>;
}

