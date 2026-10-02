"use client";

import { useState } from "react";
import type { NativeClinicalToolEnvelope } from "@/lib/clinical-tools/native-registry";
import type { QabAdministrationV1 } from "@/lib/clinical-tools/qab-it/types";
import { QabResults } from "./qab-it/qab-results";
import { QabRunner } from "./qab-it/qab-runner";

export function NativeToolEditor({ value, readOnly, onChange }: { value: NativeClinicalToolEnvelope; readOnly: boolean; onChange: (value: NativeClinicalToolEnvelope) => void }) {
  const [open, setOpen] = useState(false);
  if (value.toolId !== "qab-it") return <p className="text-sm text-red-600">Strumento nativo non supportato.</p>;
  const administration = value.data as QabAdministrationV1;
  const label = administration.status === "not_started" ? "Avvia somministrazione" : administration.status === "in_progress" ? "Riprendi somministrazione" : "Vedi risultati";
  return <div className="mt-4 rounded-2xl border border-sage-200 bg-sage-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-sage-700">Strumento nativo ARMONIA</p><p className="mt-1 font-bold">{administration.status === "completed" ? "Somministrazione completata" : administration.status === "stopped" ? "Somministrazione interrotta" : administration.status === "in_progress" ? `Modulo ${administration.form} · in corso` : "Pronto per la somministrazione"}</p></div><button type="button" onClick={() => setOpen(true)} className="btn btn-primary min-h-11">{label}</button></div>{administration.status === "completed" && <div className="mt-4"><QabResults value={administration} compact /></div>}{open && <QabRunner value={administration} readOnly={readOnly} onChange={(data) => onChange({ ...value, data })} onClose={() => setOpen(false)} />}</div>;
}
