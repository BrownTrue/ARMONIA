"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentActions } from "@/components/documents/document-actions";
import type { DocumentSource } from "@/lib/documents/browser-actions";

type GeneratedPdfActionsProps = {
  title: string;
  fileName: string;
  revisionKey: string;
  generate: () => Promise<Blob | undefined>;
};

export function GeneratedPdfActions({ title, fileName, revisionKey, generate }: GeneratedPdfActionsProps) {
  const [source, setSource] = useState<DocumentSource>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const generatedRevision = useRef("");

  useEffect(() => {
    if (generatedRevision.current === revisionKey) return;
    setSource(undefined);
    setNotice("");
  }, [revisionKey]);

  const createPdf = async () => {
    setBusy(true);
    setNotice("");
    try {
      const blob = await generate();
      if (!blob) return;
      setSource({ kind: "blob", blob });
      generatedRevision.current = revisionKey;
      setNotice("PDF pronto.");
    } catch {
      setNotice("Non è stato possibile creare il PDF. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  if (!source) {
    return <div className="mt-6">
      {notice && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{notice}</p>}
      <button type="button" disabled={busy} aria-busy={busy} onClick={() => void createPdf()} className="min-h-11 w-full rounded-xl bg-sage-700 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Creazione PDF…" : "Crea PDF"}</button>
    </div>;
  }

  return <div className="mt-6 rounded-2xl border border-sage-200 bg-sage-50/70 p-4" aria-live="polite">
    <div className="flex items-start justify-between gap-3">
      <div><p className="font-bold text-sage-900">PDF pronto</p><p className="mt-1 break-all text-xs text-slate-500">{fileName}</p></div>
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sage-700">✓</span>
    </div>
    <DocumentActions title={title} fileName={fileName} source={source} downloadSource={source} className="mt-4" />
    {notice && <p role={notice.startsWith("Non è") || notice.startsWith("Il browser") ? "alert" : "status"} className="mt-3 text-sm text-slate-600">{notice}</p>}
  </div>;
}
