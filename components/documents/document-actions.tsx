"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import {
  canShareDocument,
  loadSameOriginPdf,
  prepareDocumentUrl,
  shareDocument,
  type DocumentSource,
} from "@/lib/documents/browser-actions";

type DocumentActionsProps = {
  title: string;
  fileName: string;
  source: DocumentSource;
  downloadSource?: DocumentSource;
  shareMode?: "source" | "authenticated-file" | "none";
  allowPrint?: boolean;
  openLabel?: string;
  className?: string;
};

const releaseDelay = 60_000;

export function DocumentActions({
  title,
  fileName,
  source,
  downloadSource,
  shareMode = "source",
  allowPrint = true,
  openLabel = "Apri PDF",
  className = "",
}: DocumentActionsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [privateShareSource, setPrivateShareSource] = useState<Extract<DocumentSource, { kind: "blob" }>>();
  const [preparingShare, setPreparingShare] = useState(false);
  const [sharePreparationFailed, setSharePreparationFailed] = useState(false);

  const nativeSharePresent = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const fileSharePotential = nativeSharePresent && typeof navigator.canShare === "function";
  const activeShareSource = shareMode === "source" ? source : privateShareSource;
  const shareAvailable = useMemo(
    () => Boolean(activeShareSource && typeof navigator !== "undefined" && canShareDocument(activeShareSource, fileName, navigator)),
    [activeShareSource, fileName],
  );

  useEffect(() => {
    if (!sheetOpen || shareMode !== "authenticated-file" || source.kind !== "url" || !fileSharePotential || privateShareSource || sharePreparationFailed) return;
    let active = true;
    setPreparingShare(true);
    void loadSameOriginPdf(source).then((loaded) => {
      if (active) setPrivateShareSource(loaded);
    }).catch(() => {
      if (active) setSharePreparationFailed(true);
    }).finally(() => {
      if (active) setPreparingShare(false);
    });
    return () => { active = false; };
  }, [fileSharePotential, privateShareSource, shareMode, sharePreparationFailed, sheetOpen, source]);

  const openDocument = () => {
    setNotice("");
    try {
      const prepared = prepareDocumentUrl(source);
      const opened = window.open(prepared.url, "_blank");
      if (opened) opened.opener = null;
      window.setTimeout(prepared.release, releaseDelay);
      if (!opened) {
        setNotice("Impossibile aprire il documento. Consenti i popup oppure usa Scarica.");
        return false;
      }
      return true;
    } catch {
      setNotice("Impossibile aprire il documento. Riprova oppure usa Scarica.");
      return false;
    }
  };

  const downloadDocument = () => {
    if (!downloadSource) return;
    setNotice("");
    try {
      const prepared = prepareDocumentUrl(downloadSource);
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
      setNotice("Impossibile preparare il download. Riprova oppure apri il documento.");
    }
  };

  const shareActiveDocument = async () => {
    if (!activeShareSource) return;
    setNotice("");
    try {
      const result = await shareDocument(activeShareSource, fileName, title, navigator);
      if (result === "shared") {
        setNotice("Documento condiviso.");
        setSheetOpen(false);
      }
    } catch {
      setNotice("Non è stato possibile condividere il documento. Puoi aprirlo o scaricarlo.");
    }
  };

  const openForPrint = () => {
    if (openDocument()) {
      setNotice("Documento aperto: usa Stampa dal visualizzatore del browser.");
      setSheetOpen(false);
    }
  };

  const hasSecondaryActions = shareMode !== "none" || Boolean(downloadSource) || allowPrint;

  return <div className={className}>
    <div className={`grid gap-2 ${hasSecondaryActions ? "grid-cols-[minmax(0,1fr)_3rem]" : "grid-cols-1"}`}>
      <button type="button" onClick={openDocument} className="min-h-12 rounded-xl bg-sage-700 px-4 text-sm font-bold text-white transition hover:bg-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">{openLabel}</button>
      {hasSecondaryActions && <button type="button" aria-label={`Altre azioni per ${title}`} aria-haspopup="dialog" onClick={() => setSheetOpen(true)} className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-sage-200 bg-white text-xl font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">•••</button>}
    </div>
    {notice && <p role={notice.startsWith("Impossibile") || notice.startsWith("Non è") ? "alert" : "status"} className="mt-3 text-sm text-slate-600">{notice}</p>}
    {sheetOpen && <Modal title="Azioni documento" onClose={() => setSheetOpen(false)}>
      <p className="mb-4 text-sm text-slate-600">Scegli come usare questo documento.</p>
      <div className="grid gap-2">
        {preparingShare && <p role="status" className="rounded-xl bg-sage-50 p-3 text-sm text-sage-800">Preparazione della condivisione…</p>}
        {shareAvailable && <button type="button" onClick={() => void shareActiveDocument()} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Condividi</button>}
        {shareMode !== "none" && !preparingShare && !shareAvailable && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">La condivisione diretta non è disponibile qui. Puoi aprire{downloadSource ? " o scaricare" : ""} il documento.</p>}
        {downloadSource && <button type="button" onClick={downloadDocument} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Scarica</button>}
        {allowPrint && <button type="button" onClick={openForPrint} className="min-h-12 rounded-xl px-4 text-left font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Stampa</button>}
      </div>
    </Modal>}
  </div>;
}
