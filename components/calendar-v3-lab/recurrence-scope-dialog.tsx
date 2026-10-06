"use client";

import { useEffect, useId, useRef } from "react";
import type { CalendarV3RecurrenceScope } from "@/lib/calendar-v3-lab/recurrence-scope";
import styles from "./calendar-v3-lab.module.css";

type ScopeOption = {
  scope: CalendarV3RecurrenceScope;
  label: string;
  description: string;
  summary: string;
  disabled: boolean;
};

export function RecurrenceScopeDialog({ options, saving, error, onChoose, onCancel }: {
  options: readonly ScopeOption[];
  saving: boolean;
  error: string;
  onChoose: (scope: CalendarV3RecurrenceScope) => void;
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
    <div
      ref={panelRef}
      className={styles.recurrenceDialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header>
        <span>APPUNTAMENTO RICORRENTE</span>
        <h2 id={titleId}>Modificare appuntamento ricorrente</h2>
        <p id={descriptionId}>Scegli a quali appuntamenti applicare la modifica.</p>
      </header>
      <div className={styles.recurrenceOptions}>
        {options.map((option) => <button
          key={option.scope}
          type="button"
          disabled={saving || option.disabled}
          onClick={() => onChoose(option.scope)}
        >
          <strong>{option.label}</strong>
          <span>{option.description}</span>
          <span>{option.summary}</span>
        </button>)}
      </div>
      <p className={styles.recurrenceWarning}>Le modifiche applicate in precedenza a singoli appuntamenti inclusi nella serie potrebbero essere sostituite.</p>
      {error ? <p className={styles.recurrenceDialogError} role="alert">{error}</p> : null}
      <footer>
        <button type="button" disabled={saving} onClick={onCancel}>Annulla</button>
        {saving ? <span role="status">Salvataggio…</span> : null}
      </footer>
    </div>
  </div>;
}
