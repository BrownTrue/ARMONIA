export const mobileSettingsSections = [
  { id: "professional", label: "Dati professionali", description: "Profilo e dati amministrativi dei documenti" },
  { id: "branding", label: "Logo dei documenti", description: "Anteprima e gestione del logo professionale" },
  { id: "calendars", label: "Calendari", description: "Google Calendar e Calendario ARMONIA" },
  { id: "security", label: "Account e sicurezza", description: "Email, password e accesso" },
  { id: "export", label: "Esportazione dati", description: "Scarica una copia dei dati ARMONIA" },
] as const;

export type MobileSettingsSection = typeof mobileSettingsSections[number]["id"];

export function parseMobileSettingsSection(value: string | null): MobileSettingsSection | null {
  return mobileSettingsSections.some((section) => section.id === value) ? value as MobileSettingsSection : null;
}

export function mobileSettingsHref(section: MobileSettingsSection) {
  return `/impostazioni?section=${section}`;
}
