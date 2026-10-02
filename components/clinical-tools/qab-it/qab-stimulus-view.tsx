"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { QabStimulusCard } from "@/lib/clinical-tools/qab-it/types";

export function QabStimulusView({ card, onClose }: { card: QabStimulusCard; onClose: () => void }) {
  const stimulusRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !document.fullscreenElement) onClose(); };
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === stimulusRef.current);
    document.addEventListener("keydown", close);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      if (document.fullscreenElement === stimulusRef.current) void document.exitFullscreen().catch(() => undefined);
    };
  }, [onClose]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now() - elapsed * 1000;
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 100);
    return () => window.clearInterval(id);
  }, [elapsed, running]);

  const timerLabel = elapsed < 3 ? "Risposta senza latenza" : elapsed < 6 ? "Latenza" : "Finestra conclusa";
  const openFullscreen = () => void stimulusRef.current?.requestFullscreen?.().catch(() => undefined);

  return <div role="dialog" aria-modal="true" aria-label={`Carta ${card.cardNumber} del Modulo ${card.form}`} className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-slate-950/55 p-2 sm:p-5">
    <div className="flex h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-[#f7f7f4] shadow-2xl sm:h-[85vh] sm:w-[85vw]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-sage-100 bg-white px-3 py-2 sm:px-4">
        <div><p className="text-sm font-bold text-slate-800">Carta {card.cardNumber}</p><p className="text-xs text-slate-500">Modulo {card.form}</p></div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={openFullscreen} className="min-h-11 rounded-xl border border-sage-200 bg-white px-4 text-sm font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Schermo intero</button><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-sage-700 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Chiudi</button></div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-2 sm:grid-cols-[minmax(0,1fr)_15rem] sm:p-4">
        <div ref={stimulusRef} className="relative min-h-0 overflow-hidden rounded-xl bg-[#f7f7f4] p-2 sm:p-4">
          {failed || !card.assetAvailable ? <div className="grid h-full place-items-center"><p className="max-w-md rounded-2xl bg-white p-6 text-center text-lg font-semibold text-slate-700 shadow">Stimolo digitale non disponibile.<br/>Utilizzare la Carta {card.cardNumber} del Modulo {card.form} in formato cartaceo.</p></div> : <Image src={card.assetPath} alt={`Carta ${card.cardNumber} del Modulo ${card.form}`} fill priority unoptimized sizes={fullscreen ? "100vw" : "85vw"} className="object-contain" onError={() => setFailed(true)} />}
        </div>

        <aside className="shrink-0 rounded-xl border border-sage-100 bg-white p-3 sm:self-stretch sm:p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Timer QAB</p>
          <div className="mt-2 flex items-center justify-between gap-3 sm:block"><div><p className="text-3xl font-black tabular-nums text-slate-900 sm:text-4xl">{elapsed}s</p><p className="mt-1 text-sm font-semibold text-slate-600">{timerLabel}</p></div><div className="flex gap-2 sm:mt-4"><button type="button" onClick={() => setRunning((value) => !value)} className="min-h-11 rounded-xl border border-sage-200 bg-white px-4 text-sm font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">{running ? "Ferma" : "Avvia"}</button><button type="button" onClick={() => { setRunning(false); setElapsed(0); }} className="min-h-11 rounded-xl border border-sage-200 bg-white px-4 text-sm font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Reset</button></div></div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px] font-semibold text-slate-500 sm:grid-cols-1 sm:text-left"><span>0–3 s · senza latenza</span><span>3–6 s · latenza</span><span>6 s · fine finestra</span></div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Ausilio visivo: non assegna punteggi e non viene salvato.</p>
        </aside>
      </div>
    </div>
  </div>;
}
