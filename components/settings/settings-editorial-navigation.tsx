"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { mobileSettingsSections, type MobileSettingsSection } from "@/lib/mobile-settings";
import styles from "@/app/impostazioni/settings-editorial.module.css";

const icons: Record<MobileSettingsSection, ReactNode> = {
  professional: <><circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M9 16h6"/></>,
  branding: <><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 4-6 5 7"/></>,
  calendars: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/></>,
  security: <><path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6Z"/><path d="m8 12 3 3 5-5"/></>,
  export: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>,
};

export function SettingsEditorialNavigation({ selected, onSelect }: {
  selected: MobileSettingsSection;
  onSelect: (section: MobileSettingsSection) => void;
}) {
  return <nav className={styles.navigation} aria-label="Aree Impostazioni desktop">
    <p className={styles.navEyebrow}>LE TUE IMPOSTAZIONI</p>
    {mobileSettingsSections.map((section, index) => <button key={section.id} type="button"
      aria-pressed={selected === section.id} aria-controls={`settings-${section.id}-panel`}
      onClick={() => onSelect(section.id)}>
      <span className={styles.icon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[section.id]}</svg></span>
      <span className={styles.navText}><strong>{section.label}</strong><small>{section.description}</small></span>
      <span className={styles.number} aria-hidden="true">0{index + 1}</span>
    </button>)}
    <Link className={styles.calendarLink} href="/calendario"><span className={styles.icon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">{icons.calendars}</svg></span><span><strong>Sedi e prestazioni</strong><small>Gestite nel Calendario <span aria-hidden="true">↗</span></small></span></Link>
  </nav>;
}
