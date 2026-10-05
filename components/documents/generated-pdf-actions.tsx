"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import {
  canShareDocument,
  prepareDocumentUrl,
  shareDocument,
  type DocumentSource,
} from "@/lib/documents/browser-actions";

type GeneratedPdfActionsProps = {
  title: string;
  fileName: string;
  revisionKey: string;
  generate: () => Promise<Blob | undefined>;
};

const releaseDelay = 60_000;

export function GeneratedPdfActions({ title, fileName, revisionKey, generate }: GeneratedPdfActionsProps) {
  const [source, setSource] = useState<DocumentSource>();
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const generatedRevision = useRef("");

  useEffect(() => {
    if (generatedRevision.current === revisionKey) return;
    setSource(undefined);
    setSheetOpen(false);
    setNotice("");
  }, [revisionKey]);

  const shareAvailable = useMemo(
    () => Boolean(source && typeof navigator !== "undefined" && canShareDocument(source, fileName, navigator)),
    [fileName, source],
  );

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

  const openPdf = () => {
    if (!source) return false;
    setNotice("");
    try {
      const prepared = prepareDocumentUrl(source);
      const opened = window.open(prepared.url, "_blank");
      if (opened) opened.opener = null;
      window.setTimeout(prepared.release, releaseDelay);
      if (!opened) {
        setNotice("Il browser ha bloccato l’apertura. Consenti i popup oppure usa Scarica.");
        return false;
      }
      return true;
    } catch {
      setNotice("Non è stato possibile aprire il PDF. Usa Scarica e aprilo dal dispositivo.");
      return false;
    }
  };

  const downloadPdf = () => {
    if (!source) return;
    setNotice("");
    try {
      const prepared = prepareDocumentUrl(source);
      const anchor = document.createElement("a");
      anchor.href = prepared.url;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(prepared.release, releaseDelay);
      setNotice("Download avviato. La posizione del file dipende dal browser e dal dispositivo.");
      setSheetOpen(false);
    } catch {
      setNotice("Non è stato possibile avviare il download. Riprova oppure apri il PDF.");
    }
  };

  const sharePdf = async () => {
    if (!source) return;
    setNotice("");
    try {
      const result = await shareDocument(source, fileName, title, navigator);
      if (result === "unsupported") setNotice("La condivisione diretta del file non è supportata qui. Puoi aprire o scaricare il PDF.");
      if (result === "shared") {
        setNotice("Documento condiviso.");
        setSheetOpen(false);
      }
    } catch {
      setNotice("Non è stato possibile condividere il PDF. Puoi aprirlo o scaricarlo.");
    }
  };

  const openForPrint = () => {
    if (openPdf()) {
      setNotice("PDF aperto: usa Stampa dal visualizzatore del browser.");
      setSheetOpen(false);
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
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_3rem] gap-2 sm:flex">
      <button type="button" onClick={openPdf} className="min-h-12 rounded-xl bg-sage-700 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Apri PDF</button>
      <button type="button" aria-label="Altre azioni sul PDF" aria-haspopup="dialog" onClick={() => setSheetOpen(true)} className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-sage-200 bg-white text-xl font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">•••</button>
    </div>
    {notice && <p role={notice.startsWith("Non è") || notice.startsWith("Il browser") ? "alert" : "status"} className="mt-3 text-sm text-slate-600">{notice}</p>}
    {sheetOpen && <Modal title="Azioni documento" onClose={() => setSheetOpen(false)}>
      <p className="mb-4 text-sm text-slate-600">Scegli come usare il PDF appena creato.</p>
      <div className="grid gap-2">
        {shareAvailable && <button type="button" onClick={() => void sharePdf()} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Condividi</button>}
        {!shareAvailable && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">La condivisione diretta del file non è disponibile in questo browser. Puoi aprire o scaricare il PDF.</p>}
        <button type="button" onClick={downloadPdf} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Scarica</button>
        <button type="button" onClick={openForPrint} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Stampa</button>
      </div>
    </Modal>}
  </div>;
}
