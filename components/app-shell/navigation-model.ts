export type NavigationSection = "primary" | "secondary";
export type NavigationIconName = "today" | "calendar" | "patients" | "resources" | "economy" | "statistics" | "settings";

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  mobileIcon: NavigationIconName;
  section: NavigationSection;
  desktopOrder: number;
};

export const navigationItems: readonly NavigationItem[] = [
  { icon: "◷", mobileIcon: "today", label: "Oggi", href: "/oggi", section: "primary", desktopOrder: 0 },
  { icon: "□", mobileIcon: "calendar", label: "Calendario", href: "/calendario", section: "primary", desktopOrder: 1 },
  { icon: "◎", mobileIcon: "patients", label: "Pazienti", href: "/pazienti", section: "primary", desktopOrder: 2 },
  { icon: "▧", mobileIcon: "resources", label: "Risorse", href: "/risorse", section: "primary", desktopOrder: 3 },
  { icon: "€", mobileIcon: "economy", label: "Economia", href: "/economia", section: "secondary", desktopOrder: 5 },
  { icon: "◔", mobileIcon: "statistics", label: "Statistiche", href: "/statistiche", section: "secondary", desktopOrder: 4 },
  { icon: "⚙", mobileIcon: "settings", label: "Impostazioni", href: "/impostazioni", section: "secondary", desktopOrder: 6 },
] as const;

export const primaryNavigationItems = navigationItems.filter((item) => item.section === "primary");
export const secondaryNavigationItems = navigationItems.filter((item) => item.section === "secondary");
export const desktopNavigationItems = [...navigationItems].sort((left, right) => left.desktopOrder - right.desktopOrder);

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/oggi" && pathname.startsWith(`${href}/`));
}

const detailTitles: readonly [prefix: string, title: string][] = [
  ["/calendar-v3-lab", "Calendario"],
  ["/pazienti/", "Paziente"],
  ["/sedute/", "Seduta"],
  ["/risorse/laboratorio", "Laboratorio"],
  ["/risorse/strumenti", "Strumenti clinici"],
  ["/risorse/documenti", "Documenti"],
  ["/materiali", "Materiali"],
];

export function mobilePageTitle(pathname: string) {
  const exactItem = navigationItems.find((item) => pathname === item.href);
  if (exactItem) return exactItem.label;
  const detailTitle = detailTitles.find(([prefix]) => pathname.startsWith(prefix))?.[1];
  if (detailTitle) return detailTitle;
  return navigationItems.find((item) => isNavigationItemActive(pathname, item.href))?.label ?? "Armonia";
}
