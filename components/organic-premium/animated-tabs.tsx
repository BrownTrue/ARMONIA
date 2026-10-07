"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import styles from "./animated-tabs.module.css";

export type AnimatedTabOption<T extends string> = { id: string; value: T; label: string; controls: string };

export function AnimatedTabs<T extends string>({ label, options, value, onChange, className = "" }: { label: string; options: readonly AnimatedTabOption<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = options[nextIndex];
    onChange(next.value);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-tab-index="${nextIndex}"]`)?.focus();
  };

  return <div role="tablist" aria-label={label} className={`${styles.list} ${className}`} style={{ "--tab-count": options.length, "--active-index": activeIndex } as CSSProperties}>
    <span className={styles.indicator} aria-hidden="true"/>
    {options.map((option, index) => <button key={option.value} id={option.id} data-tab-index={index} type="button" role="tab" aria-selected={value === option.value} aria-controls={option.controls} tabIndex={value === option.value ? 0 : -1} onClick={() => onChange(option.value)} onKeyDown={(event) => onKeyDown(event, index)} className={styles.tab}>{option.label}</button>)}
  </div>;
}
