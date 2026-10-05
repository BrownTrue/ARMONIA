"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./calendar-v3-lab.module.css";

export function AppointmentCancelDialog({ recurring, saving, error, onConfirm, onCancel }: {
  recurring: boolean;
  saving: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, []);

  return <div
    className={styles.recurrenceDialogLayer}
    role="presentation"
    onMouseDown={(event) => {
      if (!saving && event.target === event.currentTarget) onCancel();
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }}
  >
    <div ref={panelRef} className={styles.cancelDialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <header>
        <span>ANNULLAMENTO</span>
        <h2 id={titleId}>{recurring ? "Annullare questo appuntamento?" : "Annullare l’appuntamento?"}</h2>
        <p id={descriptionId}>L’appuntamento resterà nello storico e non verrà eliminato.</p>
      </header>
      {error ? <p className={styles.recurrenceDialogError} role="alert">{error}</p> : null}
      <footer>
        <button type="button" disabled={saving} onClick={onCancel}>Indietro</button>
        <button type="button" className={styles.cancelDialogConfirm} disabled={saving} onClick={onConfirm}>{saving ? "Annullamento…" : recurring ? "Annulla questo appuntamento" : "Annulla appuntamento"}</button>
      </footer>
    </div>
  </div>;
}

