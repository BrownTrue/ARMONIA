"use client";

import { Modal } from "@/components/modal";

export function DestructiveActionModal({ title, description, confirmLabel, busyLabel = "Eliminazione…", danger = true, busy, error, onClose, onConfirm }: { title: string; description: string; confirmLabel: string; busyLabel?: string; danger?: boolean; busy: boolean; error?: string; onClose: () => void; onConfirm: () => void | Promise<void> }) {
  return <Modal title={title} onClose={() => { if (!busy) onClose(); }}>
    <p className="text-sm leading-6 text-slate-600">{description}</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" disabled={busy} className="btn btn-quiet disabled:opacity-50" onClick={onClose}>Annulla</button>
      <button type="button" disabled={busy} aria-busy={busy} className={`${danger ? "btn bg-red-600 text-white" : "btn btn-primary"} disabled:cursor-wait disabled:opacity-60`} onClick={() => void onConfirm()}>{busy ? busyLabel : confirmLabel}</button>
    </div>
  </Modal>;
}
