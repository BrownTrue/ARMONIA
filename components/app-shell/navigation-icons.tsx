import type { NavigationIconName } from "./navigation-model";

const paths: Record<NavigationIconName, React.ReactNode> = {
  today: <><circle cx="12" cy="12" r="8.25"/><path d="M12 7.5v5l3.25 1.9"/></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.75v3.5M16 3.75v3.5M4 9.5h16"/></>,
  patients: <><circle cx="9" cy="8.5" r="3"/><path d="M3.75 19c.45-3.2 2.2-4.8 5.25-4.8s4.8 1.6 5.25 4.8M15.25 6.4a2.7 2.7 0 0 1 0 5.2M16.2 14.2c2.45.25 3.75 1.85 4.05 4.3"/></>,
  resources: <><path d="M3.75 7.25A2.25 2.25 0 0 1 6 5h4l2 2h6A2.25 2.25 0 0 1 20.25 9.25v7.5A2.25 2.25 0 0 1 18 19H6a2.25 2.25 0 0 1-2.25-2.25Z"/><path d="M3.75 9.5h16.5"/></>,
  economy: <><rect x="3.75" y="6" width="16.5" height="12" rx="2.5"/><path d="M3.75 10h16.5M16.5 14h.01"/></>,
  statistics: <><path d="M5 19V9.5M10 19V5M15 19v-6.5M20 19V8"/><path d="M3.5 19.25h18"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.2 13.8a7.8 7.8 0 0 0 0-3.6l1.6-1.25-2-3.45-2 .8a8 8 0 0 0-3.1-1.8L13.4 2h-4l-.3 2.5A8 8 0 0 0 6 6.3l-2-.8-2 3.45 1.6 1.25a7.8 7.8 0 0 0 0 3.6L2 15.05l2 3.45 2-.8a8 8 0 0 0 3.1 1.8l.3 2.5h4l.3-2.5a8 8 0 0 0 3.1-1.8l2 .8 2-3.45Z"/></>,
};

export function NavigationIcon({ name, className = "h-5 w-5" }: { name: NavigationIconName; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
