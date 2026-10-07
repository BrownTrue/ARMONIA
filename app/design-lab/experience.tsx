"use client";

import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { ButtonPlayground, CardPlayground } from "./design-lab";
import { AnimatedTabs } from "@/components/organic-premium/animated-tabs";
import styles from "./experience.module.css";

type Theme = "organic" | "editorial" | "playful";
type Screen = "Oggi" | "Calendario" | "Pazienti" | "Risorse" | "Statistiche" | "Economia" | "Impostazioni";
type Props = { theme: Theme; speed: number; motionOn: boolean; onThemeChange: (theme: Theme) => void };

const navigation: { label: Screen; icon: ReactNode }[] = [
  { label: "Oggi", icon: <><path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6"/></> },
  { label: "Calendario", icon: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h3M8 17h6"/></> },
  { label: "Pazienti", icon: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 15a4.5 4.5 0 0 1 3.5 4.4"/></> },
  { label: "Risorse", icon: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 1 5 16.5v-12Z"/><path d="M5 15.5A2.5 2.5 0 0 1 7.5 13H20M9 6h7M9 9h5"/></> },
  { label: "Statistiche", icon: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 19h21"/></> },
  { label: "Economia", icon: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/><circle cx="16.5" cy="14.5" r="2"/></> },
  { label: "Impostazioni", icon: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.8-1.7 2.9-2.1-.6a7 7 0 0 1-1.7 1l-.4 2.2h-3.4l-.4-2.2a7 7 0 0 1-1.7-1l-2.1.6-1.7-2.9 1.1-1.8A7 7 0 0 1 6.3 13l-2-1 1-3.3 2.2-.2c.4-.6.9-1.1 1.5-1.5l.2-2.2h3.5l.2 2.2c.6.4 1.1.9 1.5 1.5l2.2.2 1 3.3-2 1c0 .7-.1 1.3-.2 2Z" transform="translate(0 -1) scale(.92 1)"/></> },
];

const themeLabels: Record<Theme, string> = { organic: "Organic Premium", editorial: "Editorial Tech", playful: "Modern Playful" };

function Glyph({ children, size = 19 }: { children: ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export default function ExperienceView({ theme, speed, motionOn, onThemeChange }: Props) {
  const [screen, setScreen] = useState<Screen>("Calendario");
  const [navStyle, setNavStyle] = useState<"rail" | "dock">("dock");
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [calendarFilter, setCalendarFilter] = useState("Tutte");
  const [patientTab, setPatientTab] = useState("Panoramica");
  const [saved, setSaved] = useState(false);

  const handleNavKeys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? navigation.length - 1 : (index + (event.key === "ArrowDown" ? 1 : navigation.length - 1)) % navigation.length;
    setScreen(navigation[next].label);
    const nav = event.currentTarget.closest("nav");
    const buttons = nav?.querySelectorAll<HTMLButtonElement>("[data-section-button]");
    buttons?.[next]?.focus();
  };

  return <div className={styles.experience} data-theme={theme} data-motion={motionOn ? "on" : "off"}>
    <div className={styles.introBar}>
      <div><span className={styles.eyebrow}>DESIGN LAB / 02</span><h1>ARMONIA <em>Experience</em></h1><p>Un’unica grammatica, dentro il ritmo quotidiano del lavoro.</p></div>
      <div className={styles.identityControl} role="group" aria-label="Confronta identità visive">
        {(Object.keys(themeLabels) as Theme[]).map((variant) => <button type="button" key={variant} className={variant === theme ? styles.identitySelected : ""} aria-pressed={variant === theme} onClick={() => onThemeChange(variant)}>{themeLabels[variant]}</button>)}
      </div>
    </div>
    <div className={styles.prototypeMeta}><span>PROTOTIPO NAVIGABILE</span><span>Contenuti dimostrativi · nessun dato reale</span><div className={styles.navVariant} role="group" aria-label="Variante navigazione"><button type="button" aria-pressed={navStyle === "rail"} onClick={() => setNavStyle("rail")}>Rail</button><button type="button" aria-pressed={navStyle === "dock"} onClick={() => setNavStyle("dock")}>Dock</button></div></div>
    <section className={`${styles.productShell} ${navStyle === "dock" ? styles.dockMode : styles.railMode}`} aria-label="Prototipo ARMONIA">
      <nav className={`${styles.globalNav} ${labelsOpen ? styles.labelsVisible : ""}`} aria-label="Navigazione principale" onMouseLeave={() => setLabelsOpen(false)}>
        <div className={styles.navBrand}><span className={styles.brandMark} aria-hidden="true">a</span><span className={styles.navBrandLabel}>ARMONIA</span></div>
        <button className={styles.expandNav} type="button" aria-label={labelsOpen ? "Riduci navigazione" : "Espandi etichette navigazione"} aria-pressed={labelsOpen} onClick={() => setLabelsOpen((open) => !open)} onMouseEnter={() => setLabelsOpen(true)}>
          <Glyph><rect x="4" y="4" width="16" height="16" rx="3"/><path d={labelsOpen ? "M14 8l-4 4 4 4" : "M10 8l4 4-4 4"}/></Glyph><span className={styles.navLabel}>Espandi menu</span>
        </button>
        <div className={styles.navItems} role="tablist" aria-label="Sezioni ARMONIA" aria-orientation="vertical">
          {navigation.map((item, index) => <button key={item.label} data-section-button type="button" role="tab" aria-selected={screen === item.label} aria-label={item.label} title={item.label} onClick={() => setScreen(item.label)} onKeyDown={(event) => handleNavKeys(event, index)} className={`${styles.navItem} ${screen === item.label ? styles.navActive : ""}`}>
            <Glyph>{item.icon}</Glyph><span className={styles.navLabel}>{item.label}</span><span className={styles.navTooltip} aria-hidden="true">{item.label}</span>
          </button>)}
        </div>
        <button className={styles.accountButton} type="button" aria-label="Account Bruno Verdi" title="Bruno Verdi"><span className={styles.avatarSmall}>BV</span><span className={styles.navLabel}>Bruno Verdi</span></button>
      </nav>
      {screen === "Calendario" && contextOpen && <aside className={styles.contextPanel} aria-label="Pannello contestuale Calendario">
        <div className={styles.contextTitle}><div><span className={styles.eyebrow}>CALENDARIO</span><h2>Ottobre 2026</h2></div><button type="button" aria-label="Chiudi pannello Calendario" onClick={() => setContextOpen(false)}><Glyph size={17}><path d="M6 6l12 12M18 6 6 18"/></Glyph></button></div>
        <div className={styles.miniCalendar} aria-label="Calendario dimostrativo ottobre 2026"><div className={styles.weekdays}>{["L", "M", "M", "G", "V", "S", "D"].map((day, i) => <span key={`${day}${i}`}>{day}</span>)}</div><div className={styles.monthDays}>{Array.from({ length: 35 }, (_, i) => { const day = i - 3; return <span key={i} className={`${day === 8 ? styles.todayDate : ""} ${day < 1 || day > 31 ? styles.mutedDate : ""}`}>{day < 1 ? 30 + day : day > 31 ? day - 31 : day}</span>; })}</div></div>
        <div className={styles.contextGroup}><div className={styles.groupHeading}><span>Sedi</span><button type="button" aria-label="Aggiungi sede">+</button></div><button className={styles.filterRow} onClick={() => setCalendarFilter(calendarFilter === "Studio" ? "Tutte" : "Studio")} aria-pressed={calendarFilter === "Studio"}><i className={styles.locationDot}/> Studio · centro <span>{calendarFilter === "Studio" ? "✓" : ""}</span></button><button className={styles.filterRow} onClick={() => setCalendarFilter(calendarFilter === "Online" ? "Tutte" : "Online")} aria-pressed={calendarFilter === "Online"}><i className={styles.onlineDot}/> Online <span>{calendarFilter === "Online" ? "✓" : ""}</span></button></div>
        <div className={styles.contextGroup}><div className={styles.groupHeading}><span>Prestazioni</span><button type="button" aria-label="Aggiungi prestazione">+</button></div><button className={styles.filterRow} onClick={() => setCalendarFilter(calendarFilter === "Valutazione" ? "Tutte" : "Valutazione")} aria-pressed={calendarFilter === "Valutazione"}><i className={styles.serviceDot}/> Valutazione <span>{calendarFilter === "Valutazione" ? "✓" : ""}</span></button><button className={styles.filterRow} onClick={() => setCalendarFilter(calendarFilter === "Seduta" ? "Tutte" : "Seduta")} aria-pressed={calendarFilter === "Seduta"}><i className={styles.sessionDot}/> Seduta individuale <span>{calendarFilter === "Seduta" ? "✓" : ""}</span></button></div>
        <button type="button" className={styles.contextFooter}><Glyph size={15}><path d="M12 3v18M3 12h18"/></Glyph> Impostazioni calendario</button>
      </aside>}
      <main className={styles.mainCanvas}>
        <div className={styles.canvasTopbar}><div><span className={styles.eyebrow}>MERCOLEDÌ · 7 OTTOBRE</span><h2>{screen}</h2></div><div className={styles.canvasActions}>{screen === "Calendario" && <><button className={styles.contextToggle} type="button" aria-expanded={contextOpen} onClick={() => setContextOpen((open) => !open)}>{contextOpen ? "Nascondi pannello" : "Mostra pannello"}</button><button className={styles.todayButton} type="button">Oggi</button><button className={styles.primaryAction} type="button">Nuovo appuntamento <Glyph size={16}><path d="M12 5v14M5 12h14"/></Glyph></button></>}</div></div>
        {screen === "Calendario" && <CalendarDemo filter={calendarFilter} contextOpen={contextOpen} />}
        {screen === "Oggi" && <TodayDemo speed={speed} motionOn={motionOn} saved={saved} setSaved={setSaved} />}
        {screen === "Risorse" && <ResourcesDemo speed={speed} motionOn={motionOn} />}
        {screen === "Pazienti" && <PatientsDemo tab={patientTab} setTab={setPatientTab} />}
        {screen === "Statistiche" && <StatsDemo />}
        {screen === "Economia" && <EconomyDemo />}
        {screen === "Impostazioni" && <SettingsDemo />}
      </main>
    </section>
    <div className={styles.experienceFoot}><span>ORGANIC PREMIUM · DIREZIONE INIZIALE</span><span>Le transizioni accompagnano l’azione, non la anticipano.</span></div>
  </div>;
}

function CalendarDemo({ filter, contextOpen }: { filter: string; contextOpen: boolean }) {
  const events = [
    { time: "09:00", name: "Giulia Bianchi", kind: "Valutazione", place: "Studio", tone: "sage", height: 82 },
    { time: "10:30", name: "Luca Ferri", kind: "Seduta individuale", place: "Studio", tone: "sand", height: 68 },
    { time: "12:00", name: "Marta Conti", kind: "Seduta individuale", place: "Online", tone: "blue", height: 68 },
    { time: "15:00", name: "Andrea Riva", kind: "Valutazione", place: "Studio", tone: "rose", height: 82 },
  ];
  const visible = filter === "Tutte" ? events : events.filter((event) => event.kind === filter || event.place === filter);
  return <div className={`${styles.weekDemo} ${contextOpen ? "" : styles.weekWide}`}>
    <div className={styles.weekToolbar}><div><button type="button" aria-label="Settimana precedente">‹</button><button type="button" aria-label="Settimana successiva">›</button><strong>5 — 11 ottobre 2026</strong></div><span>Settimana <i>⌄</i></span></div>
    <div className={styles.weekGrid}><div className={styles.timeGutter}><span>CEST</span>{["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => <span key={time}>{time}</span>)}</div>
      {["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"].map((day, dayIndex) => <div className={styles.dayColumn} key={day}><div className={`${styles.dayHeading} ${dayIndex === 2 ? styles.dayToday : ""}`}><span>{day.slice(0, 3)}</span><b>{5 + dayIndex}</b></div><div className={styles.dayTrack}>{[0,1,2,3,4,5,6,7,8].map((line) => <i key={line}/ >)}{dayIndex === 2 && visible.map((event) => <article key={event.name} className={`${styles.eventCard} ${styles[`event_${event.tone}`]}`} style={{ top: `${(Number(event.time.slice(0,2)) - 8) * 52 + 7}px`, minHeight: event.height }}><b>{event.name}</b><span>{event.time} · 50 min</span><small>{event.kind}</small></article>)}</div></div>)}
    </div><div className={styles.calendarLegend}><span><i className={styles.locationDot}/> Studio</span><span><i className={styles.onlineDot}/> Online</span><span>{visible.length} appuntamenti dimostrativi</span></div>
  </div>;
}

function TodayDemo({ speed, motionOn, saved, setSaved }: { speed: number; motionOn: boolean; saved: boolean; setSaved: (saved: boolean) => void }) {
  return <div className={styles.todayContent}><div className={styles.welcomeCard}><div><span className={styles.eyebrow}>IL TUO MERCOLEDÌ, CON CALMA</span><h3>Una cosa alla volta.</h3><p>La giornata è pronta. Il quadro resta vicino, senza fare rumore.</p></div><span className={styles.welcomeSun}>✳</span></div><div className={styles.todayStats}><article><span>Oggi</span><strong>6</strong><small>appuntamenti</small></article><article><span>Da completare</span><strong>2</strong><small>note di seduta</small></article><article><span>In attesa</span><strong>1</strong><small>follow-up</small></article></div><div className={styles.actionSurface}><div className={styles.surfaceHeading}><div><span className={styles.eyebrow}>RISPOSTE PICCOLE, UTILI</span><h3>Azioni rapide</h3></div><button type="button" className={styles.savePreference} aria-pressed={saved} onClick={() => setSaved(!saved)}>{saved ? "Preferenza salvata ✓" : "Salva preferenza ♡"}</button></div><ButtonPlayground speed={speed} motionOn={motionOn}/></div></div>;
}

function ResourcesDemo({ speed, motionOn }: { speed: number; motionOn: boolean }) { return <div className={styles.resourcesContent}><div className={styles.resourcesIntro}><span className={styles.eyebrow}>RACCOLTE PER IL LAVORO QUOTIDIANO</span><h3>Materiali che lasciano spazio.</h3><p>Una selezione dimostrativa, organizzata intorno a ciò che serve in seduta.</p></div><CardPlayground speed={speed} motionOn={motionOn}/></div>; }

function PatientsDemo({ tab, setTab }: { tab: string; setTab: (tab: string) => void }) {
  const tabs = [
    { id: "design-patient-overview-tab", value: "Panoramica", label: "Panoramica", controls: "design-patient-tabpanel" },
    { id: "design-patient-activity-tab", value: "Attività", label: "Attività", controls: "design-patient-tabpanel" },
    { id: "design-patient-path-tab", value: "Percorso", label: "Percorso", controls: "design-patient-tabpanel" },
  ] as const;
  const activeTab = tabs.find((item) => item.value === tab) ?? tabs[0];
  return <div className={styles.patientContent}><article className={styles.patientHero}><div className={styles.patientAvatar}>GB</div><div><span className={styles.eyebrow}>PAZIENTE · DEMO</span><h3>Giulia Bianchi</h3><p>Percorso seguito con continuità · dal 12 settembre 2026</p></div><button type="button">Apri scheda <span>↗</span></button></article><div style={{ marginTop: 15 }}><AnimatedTabs label="Sezioni scheda paziente" value={activeTab.value} onChange={setTab} options={tabs}/></div><div id="design-patient-tabpanel" role="tabpanel" aria-labelledby={activeTab.id} tabIndex={0} className={styles.patientCards}>{(tab === "Panoramica" ? [["Prossimo appuntamento", "Mer 7 ott · 09:00"], ["Percorso clinico", "Valutazione · in corso"], ["Ultima attività", "Nota di seduta · 30 set"]] : tab === "Attività" ? [["Sedute", "12 incontri registrati"], ["Materiali", "3 risorse condivise"], ["Ultimo aggiornamento", "30 settembre 2026"]] : [["Valutazione", "12 settembre · registrata"], ["Obiettivo", "Comunicazione funzionale"], ["Follow-up", "7 ottobre · pianificato"]]).map(([title, value], index) => <article key={title}><span className={styles.cardIndex}>0{index + 1}</span><span>{title}</span><strong>{value}</strong></article>)}</div></div>;
}

function StatsDemo() { return <div className={styles.statsContent}><div className={styles.metricRow}>{[["Sedute questo mese", "42", "+8%"], ["Ore dedicate", "31,5", "stabili"], ["Percorsi attivi", "18", "+2"]].map(([label, value, change]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{change}</small></article>)}</div><div className={styles.chartCard}><div><span className={styles.eyebrow}>ATTIVITÀ NEL TEMPO</span><strong>Un ritmo leggibile, non una gara.</strong></div><div className={styles.barChart}>{[28,38,32,56,46,70,51,62,43,79,58,68,49,88].map((height, i) => <span key={i} style={{ height: `${height}%` }}/>)}</div><div className={styles.chartMonths}><span>Set</span><span>Ott</span></div></div></div>; }
function EconomyDemo() { return <div className={styles.economyContent}><div className={styles.economyTotal}><span className={styles.eyebrow}>RIEPILOGO DIMOSTRATIVO · OTTOBRE</span><strong>€ 2.480</strong><span>Incassi registrati nel mese</span></div><div className={styles.economyList}>{[["Sedute", "€ 1.860", "26 prestazioni"], ["Pagamenti", "€ 2.100", "18 movimenti"], ["Documenti", "4", "proforma emessi"]].map(([a,b,c]) => <article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small><span>↗</span></article>)}</div></div>; }
function SettingsDemo() { return <div className={styles.settingsContent}><div className={styles.settingsIntro}><span className={styles.eyebrow}>IL TUO SPAZIO DI LAVORO</span><h3>Essenziale, come preferisci.</h3><p>Impostazioni dimostrative: le scelte sono rappresentate, non persistite.</p></div>{[["Dati professionali", "Intestazione e contatti"], ["Sedi e prestazioni", "Organizza il tuo calendario"], ["Preferenze", "Lingua, aspetto e accessibilità"]].map(([title, detail]) => <button type="button" key={title}><span><strong>{title}</strong><small>{detail}</small></span><b>→</b></button>)}</div>; }
