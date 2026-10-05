"use client";

import { useMemo } from "react";
import { useData } from "@/components/data-provider";
import { calendarFilterGroups, type CalendarSidebarMode } from "@/lib/calendar-v3-lab/sidebar-settings";
import { CalendarSidebarCatalog } from "./calendar-sidebar-catalog";
import styles from "./calendar-v3-lab.module.css";

export function MobileCalendarFilters({ realMode, hidden, onToggle, onReset }: {
  realMode: boolean;
  hidden: readonly string[];
  onToggle: (key: string) => void;
  onReset: () => void;
}) {
  const { data } = useData();
  const groups = useMemo(() => calendarFilterGroups({
    realMode,
    locations: data.locations,
    services: data.services,
  }), [data.locations, data.services, realMode]);

  return <div className={styles.mobileToolsSurface}>
    <div className={styles.mobileToolsIntro}>
      <div><span>Visibilità calendario</span><h1>Filtri</h1></div>
      {hidden.length ? <button type="button" onClick={onReset}>Mostra tutte</button> : null}
    </div>
    <MobileFilterGroup title="Sedi" items={groups.locations} hidden={hidden} onToggle={onToggle} />
    <MobileFilterGroup title="Prestazioni" items={groups.services} hidden={hidden} onToggle={onToggle} />
  </div>;
}

function MobileFilterGroup({ title, items, hidden, onToggle }: {
  title: string;
  items: ReturnType<typeof calendarFilterGroups>["locations"];
  hidden: readonly string[];
  onToggle: (key: string) => void;
}) {
  return <section className={styles.mobileFilterGroup} aria-labelledby={`mobile-filter-${title}`}>
    <h2 id={`mobile-filter-${title}`}>{title}</h2>
    <div>{items.map((item) => {
      const checked = !hidden.includes(item.filterKey);
      return <button key={item.id} type="button" role="checkbox" aria-checked={checked} onClick={() => onToggle(item.filterKey)}>
        <i style={{ borderColor: item.color, background: checked ? item.color : "transparent" }} aria-hidden="true">{checked ? "✓" : ""}</i>
        <span>{item.label}</span>
        {!item.active ? <small>Non attiva</small> : null}
      </button>;
    })}</div>
    {!items.length ? <p>Nessun elemento configurato.</p> : null}
  </section>;
}

export function MobileCalendarSettings({ realMode, mode, hidden, onModeChange, onToggle }: {
  realMode: boolean;
  mode: CalendarSidebarMode;
  hidden: readonly string[];
  onModeChange: (mode: CalendarSidebarMode) => void;
  onToggle: (key: string) => void;
}) {
  return <div className={styles.mobileToolsSurface}>
    <CalendarSidebarCatalog
      realMode={realMode}
      mode={mode}
      hidden={hidden}
      onModeChange={onModeChange}
      onToggle={onToggle}
      presentation="mobile-settings"
    />
  </div>;
}
