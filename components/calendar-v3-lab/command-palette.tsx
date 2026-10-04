"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  filterCalendarCommands,
  isValidCalendarCommandDate,
  nextEnabledCalendarCommandIndex,
  type CalendarCommandId,
} from "@/lib/calendar-v3-lab/command-palette";
import type { CalendarDate } from "@/lib/calendar-v3-lab/date-time";
import type { CalendarLabView } from "@/lib/calendar-v3-lab/view";
import styles from "./calendar-v3-lab.module.css";

type CommandPaletteProps = {
  origin: HTMLElement;
  activeView: CalendarLabView;
  onCommand: (command: Exclude<CalendarCommandId, "go_to_date">) => void;
  onGoToDate: (date: CalendarDate) => void;
  onClose: () => void;
};

export function CommandPalette({ origin, activeView, onCommand, onGoToDate, onClose }: CommandPaletteProps) {
  const titleId = useId();
  const listId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"commands" | "date">("commands");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const commands = useMemo(() => filterCalendarCommands(query, activeView), [activeView, query]);
  const [activeIndex, setActiveIndex] = useState(() => commands.findIndex((command) => command.enabled));

  useEffect(() => {
    const nextIndex = commands.findIndex((command) => command.enabled);
    setActiveIndex(nextIndex);
  }, [commands]);

  useEffect(() => {
    const timer = window.setTimeout(() => mode === "commands" ? searchRef.current?.focus() : dateRef.current?.focus());
    return () => window.clearTimeout(timer);
  }, [mode]);

  const closeAndRestore = () => {
    onClose();
    origin.focus();
  };

  const activate = (commandId: CalendarCommandId) => {
    const command = commands.find((item) => item.id === commandId);
    if (!command?.enabled) return;
    if (commandId === "go_to_date") {
      setMode("date");
      return;
    }
    onCommand(commandId);
  };

  const submitDate = () => {
    if (isValidCalendarCommandDate(date)) onGoToDate(date);
  };

  return <div className={styles.commandPaletteLayer} role="presentation" onPointerDown={(event) => {
    if (event.target === event.currentTarget) closeAndRestore();
  }}>
    <div
      ref={dialogRef}
      className={styles.commandPalette}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          closeAndRestore();
          return;
        }
        if (event.key === "Tab") {
          const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("input:not([tabindex='-1']), button:not([disabled]):not([tabindex='-1'])") ?? [])];
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          return;
        }
        if (mode !== "commands") return;
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          setActiveIndex((current) => nextEnabledCalendarCommandIndex(commands, current, event.key as "ArrowDown" | "ArrowUp" | "Home" | "End"));
        } else if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          activate(commands[activeIndex].id);
        }
      }}
    >
      <h2 id={titleId} className={styles.srOnly}>Comandi calendario</h2>
      {mode === "commands" ? <>
        <div className={styles.commandSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            type="search"
            role="combobox"
            aria-label="Cerca un comando"
            aria-controls={listId}
            aria-expanded="true"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${commands[activeIndex].id}` : undefined}
            placeholder="Cerca un comando…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd>⌘K / Ctrl+K</kbd>
          <button type="button" aria-label="Chiudi comandi" onClick={closeAndRestore}>×</button>
        </div>
        <div className={styles.commandSectionLabel}>CALENDARIO</div>
        <div id={listId} className={styles.commandList} role="listbox" aria-label="Comandi calendario">
          {commands.length ? commands.map((command, index) => <button
            key={command.id}
            id={`${listId}-${command.id}`}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            aria-disabled={!command.enabled}
            disabled={!command.enabled}
            tabIndex={-1}
            onPointerMove={() => { if (command.enabled) setActiveIndex(index); }}
            onClick={() => activate(command.id)}
          >
            <span>{command.label}</span>
            {command.badge ? <small>{command.badge}</small> : command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
          </button>) : <p className={styles.commandEmpty}>Nessun comando trovato.</p>}
        </div>
      </> : <form className={styles.commandDateForm} onSubmit={(event) => { event.preventDefault(); submitDate(); }}>
        <button type="button" className={styles.commandBack} onClick={() => setMode("commands")}>← Comandi</button>
        <label htmlFor="calendar-command-date">Vai a una data</label>
        <input ref={dateRef} id="calendar-command-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <div>
          <button type="button" onClick={closeAndRestore}>Annulla</button>
          <button type="submit" disabled={!isValidCalendarCommandDate(date)}>Vai</button>
        </div>
      </form>}
    </div>
  </div>;
}
