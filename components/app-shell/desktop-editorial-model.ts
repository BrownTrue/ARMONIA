const editorialSections: Readonly<Record<string, string>> = {
  "/oggi": "Oggi",
  "/pazienti": "Pazienti",
  "/risorse": "Risorse",
  "/economia": "Economia",
  "/statistiche": "Statistiche",
  "/impostazioni": "Impostazioni",
  "/materiali": "Materiali",
};

/** Presentational allow-list: detail/editor routes keep their own page chrome. */
export function desktopEditorialSection(pathname: string | null, desktopFullScreen: boolean) {
  if (desktopFullScreen || !pathname) return null;
  return editorialSections[pathname] ?? null;
}
