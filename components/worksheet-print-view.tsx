"use client";

import { useMemo, useState } from "react";
import { WorksheetPrintDocument } from "@/components/worksheet-print-document";
import { buildWorksheetPrintModel, type WorksheetPrintVariant } from "@/lib/exercise-lab/worksheet-print";
import type { WorksheetDraft } from "@/lib/exercise-lab/worksheet-draft";

export function WorksheetPrintView({ worksheet, onBack }: { worksheet: WorksheetDraft; onBack: () => void }) {
  const [variant, setVariant] = useState<WorksheetPrintVariant>("patient");
  const model = useMemo(() => buildWorksheetPrintModel(worksheet, variant), [variant, worksheet]);
  return <div className="worksheet-print-mode mt-8">
    <div className="worksheet-print-controls mx-auto mb-6 flex max-w-[210mm] flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" onClick={onBack} className="btn btn-quiet">← Torna all’anteprima</button>
      <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Versione della scheda"><VariantButton value="patient" current={variant} onChange={setVariant}>Paziente</VariantButton><VariantButton value="therapist" current={variant} onChange={setVariant}>Terapista</VariantButton></div>
      <button type="button" onClick={async () => { await waitForWorksheetPrintImages(); window.print(); }} className="btn btn-primary">Stampa / Salva PDF</button>
    </div>
    <div className="worksheet-print-sheet mx-auto max-w-[210mm] overflow-hidden bg-white"><WorksheetPrintDocument model={model} /></div>
  </div>;
}

async function waitForWorksheetPrintImages() {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>(".worksheet-print-document img"));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) await new Promise<void>((resolve) => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); });
    if (typeof image.decode === "function") await image.decode().catch(() => undefined);
  }));
}

function VariantButton({ value, current, onChange, children }: { value: WorksheetPrintVariant; current: WorksheetPrintVariant; onChange: (value: WorksheetPrintVariant) => void; children: React.ReactNode }) {
  const selected = value === current;
  return <button type="button" aria-pressed={selected} onClick={() => onChange(value)} className={`min-h-11 rounded-lg px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${selected ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}>{children}</button>;
}
