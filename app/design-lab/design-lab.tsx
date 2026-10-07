"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import styles from "./design-lab.module.css";
import ExperienceView from "./experience";

type Theme = "organic" | "editorial" | "playful";
type CursorDemo = "dot" | "elastic" | "magnetic" | "context";
type IconName = "spark" | "arrow" | "check" | "plus" | "heart" | "leaf" | "book" | "wave" | "more" | "calendar" | "message" | "home";

const themes: { id: Theme; name: string; note: string; swatches: string[] }[] = [
  { id: "organic", name: "Organic premium", note: "Calma · matericità · respiro", swatches: ["#dce7d7", "#667b68", "#b8a28b"] },
  { id: "editorial", name: "Editorial tech", note: "Contrasto · precisione · griglia", swatches: ["#e7e5df", "#364d61", "#bc755c"] },
  { id: "playful", name: "Modern playful", note: "Forma · colore · energia", swatches: ["#e9edc9", "#6d7861", "#d08d6c"] },
];

const cursorOptions: { id: CursorDemo; label: string; short: string }[] = [
  { id: "dot", label: "Punto fluido", short: "01" },
  { id: "elastic", label: "Anello elastico", short: "02" },
  { id: "magnetic", label: "Campo magnetico", short: "03" },
  { id: "context", label: "Etichetta contestuale", short: "04" },
];

const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, ReactNode> = {
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
    arrow: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z" />,
    leaf: <><path d="M20 4c-9 0-14 4-14 11a5 5 0 0 0 5 5c7 0 9-8 9-16Z" /><path d="M4 21c2-4 6-7 12-10" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20" /></>,
    wave: <path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 5-7 7 0" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function CursorStage({ demo, speed, motionOn }: { demo: CursorDemo; speed: number; motionOn: boolean }) {
  const [point, setPoint] = useState({ x: 50, y: 50, visible: false });
  const [label, setLabel] = useState("Esplora");
  const bounds = useRef<HTMLDivElement>(null);
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setPoint({ x, y, visible: true });
    event.currentTarget.querySelectorAll<HTMLButtonElement>(`.${styles.cursorZones} button`).forEach((button) => {
      if (demo !== "magnetic") {
        button.style.setProperty("--pull-x", "0px");
        button.style.setProperty("--pull-y", "0px");
        return;
      }
      const buttonRect = button.getBoundingClientRect();
      const dx = event.clientX - (buttonRect.left + buttonRect.width / 2);
      const dy = event.clientY - (buttonRect.top + buttonRect.height / 2);
      const distance = Math.hypot(dx, dy);
      const strength = Math.max(0, (130 - distance) / 130);
      const pull = distance ? Math.min(7, strength * 7) : 0;
      button.style.setProperty("--pull-x", `${(dx / distance || 0) * pull}px`);
      button.style.setProperty("--pull-y", `${(dy / distance || 0) * pull}px`);
    });
  };
  const resetAttraction = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.querySelectorAll<HTMLButtonElement>(`.${styles.cursorZones} button`).forEach((button) => {
      button.style.setProperty("--pull-x", "0px");
      button.style.setProperty("--pull-y", "0px");
    });
  };
  const customStyle = { "--cursor-x": `${point.x}px`, "--cursor-y": `${point.y}px`, "--speed": String(motionOn ? speed : 0) } as CSSProperties;
  return <div ref={bounds} className={`${styles.cursorStage} ${styles[`cursorStage_${demo}`]} ${point.visible ? styles.cursorVisible : ""}`} style={customStyle} onPointerMove={onMove} onPointerLeave={(event) => { resetAttraction(event); setPoint((current) => ({ ...current, visible: false })); }}>
    <div className={styles.cursorStageTop}><span className={styles.eyebrow}>AREA INTERATTIVA</span><span className={styles.stageHint}>Muovi il puntatore · usa anche i controlli sotto</span></div>
    <div className={styles.cursorStageScene}>
      <div className={styles.cursorOrb} aria-hidden="true"><span /></div>
      <div className={styles.cursorTrail} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.contextCursor} aria-hidden="true"><span>{label}</span><b /></div>
      <div className={styles.cursorSceneCopy}>
        <span className={styles.miniMark}><Icon name="leaf" size={19} /></span>
        <span className={styles.eyebrow}>ARMONIA / STUDIO</span>
        <strong>Il movimento<br />segue l’intenzione.</strong>
        <span className={styles.cursorSceneNote}>Un dettaglio alla volta, senza rumore.</span>
      </div>
      <div className={styles.cursorZones}>
        <button type="button" onPointerEnter={() => setLabel("Titolo")}>Titolo <span>01</span></button>
        <button type="button" onPointerEnter={() => setLabel("Dettaglio")}>Dettaglio <span>02</span></button>
        <button type="button" onPointerEnter={() => setLabel("Azione")}>Azione <span>03</span></button>
      </div>
    </div>
    <div className={styles.cursorStageFoot}><span><i /> Provalo qui</span><span>Il cursore personalizzato resta confinato a questa area</span></div>
  </div>;
}

export function ButtonPlayground({ speed, motionOn }: { speed: number; motionOn: boolean }) {
  const [saved, setSaved] = useState(false);
  const [activated, setActivated] = useState(0);
  const setMagnet = (event: PointerEvent<HTMLButtonElement>) => {
    if (!motionOn || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${(event.clientX - (rect.left + rect.width / 2)) * 0.18}px`);
    event.currentTarget.style.setProperty("--my", `${(event.clientY - (rect.top + rect.height / 2)) * 0.18}px`);
  };
  const resetMagnet = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--mx", "0px");
    event.currentTarget.style.setProperty("--my", "0px");
  };
  return <div className={styles.buttonGrid} style={{ "--speed": String(motionOn ? speed : 0) } as CSSProperties}>
    <article className={styles.demoTile}><div className={styles.tileHead}><span>01 / AVVICINAMENTO</span><span>hover</span></div><button className={`${styles.demoButton} ${styles.magneticButton}`} onPointerMove={setMagnet} onPointerLeave={resetMagnet} onFocus={(event) => event.currentTarget.classList.add(styles.keyboardActive)} onBlur={(event) => event.currentTarget.classList.remove(styles.keyboardActive)} onClick={() => setActivated((n) => n + 1)}><span>Avvicinati</span><Icon name="arrow" /></button><p>Una risposta minima al campo del puntatore.</p></article>
    <article className={styles.demoTile}><div className={styles.tileHead}><span>02 / VELO LIQUIDO</span><span>hover</span></div><button className={`${styles.demoButton} ${styles.liquidButton}`} onClick={() => setActivated((n) => n + 1)}><span>Apri il dettaglio</span><Icon name="arrow" /></button><p>Il colore si espande dal punto di contatto.</p></article>
    <article className={styles.demoTile}><div className={styles.tileHead}><span>03 / BORDO VIVO</span><span>focus</span></div><button className={`${styles.demoButton} ${styles.borderButton}`} onClick={() => setActivated((n) => n + 1)}><span>Esplora</span><Icon name="spark" /></button><p>Un bordo sottile accompagna l’interazione.</p></article>
    <article className={styles.demoTile}><div className={styles.tileHead}><span>04 / RISPOSTA ELASTICA</span><span>click</span></div><button className={`${styles.demoButton} ${styles.springButton} ${saved ? styles.savedButton : ""}`} onClick={() => { setSaved((value) => !value); setActivated((n) => n + 1); }}><span>{saved ? "Salvato" : "Salva preferenza"}</span><span className={styles.springIcon}><Icon name={saved ? "check" : "heart"} /></span></button><p>Lo stato cambia, il feedback resta chiaro.</p></article>
    <div className={styles.interactionCount}><span>Interazioni di prova</span><strong>{activated.toString().padStart(2, "0")}</strong></div>
  </div>;
}

export function CardPlayground({ speed, motionOn }: { speed: number; motionOn: boolean }) {
  const [openCard, setOpenCard] = useState<number | null>(null);
  const handleSpotlight = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };
  const handleTilt = (event: PointerEvent<HTMLElement>) => {
    if (!motionOn || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 4}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 5}deg`);
  };
  const resetTilt = (event: PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty("--tilt-x", "0deg"); event.currentTarget.style.setProperty("--tilt-y", "0deg"); };
  return <div className={styles.cardGrid} style={{ "--speed": String(motionOn ? speed : 0) } as CSSProperties}>
    <article className={`${styles.showcaseCard} ${styles.spotlightCard}`} onPointerMove={handleSpotlight}>
      <div className={styles.cardArtwork}><div className={styles.artCircle} /><div className={styles.artLine} /><span className={styles.artIndex}>01</span><span className={styles.artCaption}>SPAZIO DI ASCOLTO</span></div>
      <div className={styles.showcaseCardBody}><span className={styles.eyebrow}>SPOTLIGHT / REATTIVO</span><h3>La luce segue<br />il punto di vista.</h3><p>Un accento morbido rende la superficie presente senza alzare la voce.</p></div>
    </article>
    <article className={`${styles.showcaseCard} ${styles.tiltCard}`} onPointerMove={handleTilt} onPointerLeave={resetTilt}>
      <div className={styles.tiltArtwork}><div className={styles.paperStack}><span className={styles.paperMeta}>SCHEDA · 04</span><span className={styles.paperTitle}>Ascoltare<br />prima di<br /><em>rispondere.</em></span><span className={styles.paperRule} /><span className={styles.paperFoot}>ARMONIA / NOTE DI LAVORO</span></div><div className={styles.tiltShadow} /></div>
      <div className={styles.showcaseCardBody}><span className={styles.eyebrow}>TILT / PROSPETTIVA LIEVE</span><h3>Una superficie,<br />non un effetto.</h3><p>La profondità è contenuta nel movimento e nel materiale.</p></div>
    </article>
    <article className={`${styles.showcaseCard} ${styles.expandCard} ${openCard === 3 ? styles.expandCardOpen : ""}`}>
      <div className={styles.expandArt}><span className={styles.expandNumber}>03</span><div className={styles.expandMark}><Icon name="wave" size={34} /></div><span className={styles.eyebrow}>UNA NOTA ALLA VOLTA</span><h3>Il contenuto<br />trova spazio.</h3></div>
      <div className={styles.showcaseCardBody}><p>Un invito breve che rivela il livello successivo solo quando serve.</p><button className={styles.textAction} type="button" aria-expanded={openCard === 3} onClick={() => setOpenCard(openCard === 3 ? null : 3)}>{openCard === 3 ? "Riduci" : "Leggi la nota"}<Icon name={openCard === 3 ? "plus" : "arrow"} /></button>{openCard === 3 && <div className={styles.expandedContent}>La micro-interazione non deve nascondere l’azione: accompagna l’attenzione e lascia scegliere il ritmo.</div>}</div>
    </article>
  </div>;
}

function NavigationPlayground({ speed, motionOn }: { speed: number; motionOn: boolean }) {
  const [active, setActive] = useState("Overview");
  const [dockActive, setDockActive] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const navItems = ["Overview", "Attività", "Note", "Condivisione"];
  const dockItems: { label: string; icon: IconName }[] = [{ label: "Home", icon: "home" }, { label: "Percorso", icon: "wave" }, { label: "Agenda", icon: "calendar" }, { label: "Messaggi", icon: "message" }, { label: "Altro", icon: "more" }];
  return <div className={styles.navigationGrid} style={{ "--speed": String(motionOn ? speed : 0) } as CSSProperties}>
    <article className={`${styles.navTile} ${styles.tabsTile}`}><div className={styles.tileHead}><span>01 / TAB CONDIVISE</span><span>seleziona</span></div><div className={styles.slidingTabs} role="tablist" aria-label="Sezioni demo">{navItems.map((item) => <button key={item} role="tab" aria-selected={active === item} className={active === item ? styles.tabActive : ""} onClick={() => setActive(item)}>{item}</button>)}</div><p className={styles.navFeedback}><span className={styles.statusDot} /> Sezione attiva: <strong>{active}</strong></p></article>
    <article className={`${styles.navTile} ${styles.dockTile}`}><div className={styles.tileHead}><span>02 / DOCK DI ICONE</span><span>hover · focus</span></div><nav className={styles.iconDock} aria-label="Demo dock">{dockItems.map((item, index) => <button key={item.label} aria-label={item.label} title={item.label} className={`${styles.dockButton} ${dockActive === index ? styles.dockSelected : ""}`} onPointerEnter={() => setDockActive(index)} onFocus={() => setDockActive(index)} onClick={() => setDockActive(index)}><Icon name={item.icon} size={20} /></button>)}</nav><span className={styles.dockLabel}>{dockActive === null ? "Passa sulle icone" : dockItems[dockActive].label}</span></article>
    <article className={`${styles.navTile} ${styles.popoverTile}`}><div className={styles.tileHead}><span>03 / MENU LEGGERO</span><span>click · escape</span></div><div className={styles.popoverAnchor}><button className={`${styles.popoverTrigger} ${menuOpen ? styles.popoverTriggerOpen : ""}`} aria-expanded={menuOpen} aria-haspopup="menu" aria-controls="design-lab-quick-menu" onClick={() => setMenuOpen((open) => !open)}><span>Azioni rapide</span><Icon name="plus" /></button>{menuOpen && <div id="design-lab-quick-menu" className={styles.popoverMenu} role="menu" onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }}><button role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="calendar" />Nuova attività</button><button role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="book" />Apri raccolta</button><button role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="more" />Altre opzioni</button></div>}</div><p>Un pannello piccolo, vicino al suo punto di origine.</p></article>
    <article className={`${styles.navTile} ${styles.saveTile}`}><div className={styles.tileHead}><span>04 / SUCCESSO VISIBILE</span><span>click</span></div><button className={`${styles.saveButton} ${saved ? styles.saveButtonDone : ""}`} onClick={() => setSaved((value) => !value)}><span className={styles.saveIcon}><Icon name={saved ? "check" : "heart"} /></span><span>{saved ? "Preferito salvato" : "Salva tra i preferiti"}</span>{!saved && <Icon name="arrow" />}</button><p>{saved ? "Stato aggiornato, feedback immediato." : "Un esito leggibile anche senza tooltip."}</p></article>
  </div>;
}

export default function DesignLab() {
  const reducedMotion = useReducedMotion();
  const [theme, setTheme] = useState<Theme>("organic");
  const [cursorDemo, setCursorDemo] = useState<CursorDemo>("dot");
  const [speed, setSpeed] = useState(1);
  const [motionOn, setMotionOn] = useState(true);
  const [activeSection, setActiveSection] = useState("cursori");
  const [view, setView] = useState<"experience" | "v1">("experience");
  const effectiveMotion = motionOn && !reducedMotion;
  const durations = [90, 160, 180, 190, 200, 220, 230, 240, 250, 260, 330, 350, 420];
  const rootStyle = {
    ...Object.fromEntries(durations.map((duration) => [`--duration-${duration}`, effectiveMotion ? `${Math.round(duration / speed)}ms` : "0ms"])),
    "--duration-5s": effectiveMotion ? `${(5 / speed).toFixed(2)}s` : "0s",
  } as CSSProperties;
  const sections = [{ id: "cursori", label: "Cursori", count: "04" }, { id: "pulsanti", label: "Pulsanti", count: "04" }, { id: "schede", label: "Schede", count: "03" }, { id: "navigazione", label: "Navigazione", count: "04" }];
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActiveSection(current.target.id);
    }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.5, 0.8] });
    sections.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);
  const navigateTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: effectiveMotion ? "smooth" : "auto", block: "start" });
  };
  return <main className={`${styles.lab} ${styles[`theme_${theme}`]}`} data-theme={theme} data-motion={effectiveMotion ? "on" : "off"} style={rootStyle}>
    <div className={styles.noise} aria-hidden="true" />
    <header className={styles.topbar}><a className={styles.brand} href="#top" aria-label="Design lab, inizio pagina"><span className={styles.brandMark}><Icon name="leaf" size={20} /></span><span>ARMONIA <i>/</i> DESIGN LAB</span></a><div className={styles.topbarMeta}><div className={styles.labViews} role="group" aria-label="Vista del Design Lab"><button type="button" aria-pressed={view === "experience"} onClick={() => setView("experience")}>ARMONIA Experience</button><button type="button" aria-pressed={view === "v1"} onClick={() => setView("v1")}>Esperimenti V1</button></div><span className={styles.localBadge}><i /> LAB LOCALE</span><span className={styles.topVersion}>V2.0 <b>·</b> INTERACTION LAB</span></div></header>
    {view === "experience" ? <ExperienceView theme={theme} speed={speed} motionOn={effectiveMotion} onThemeChange={setTheme} /> : <div className={styles.layout} id="top">
      <aside className={styles.controlRail}>
        <div className={styles.railIntro}><span className={styles.eyebrow}>CAMPO DI PROVA <span>01—04</span></span><h1>Materia<br />in <em>movimento.</em></h1><p>Piccole interazioni, osservate da vicino. Scegli una direzione e lasciala attraversare il playground.</p></div>
        <div className={styles.controlGroup}><div className={styles.controlHeading}><span>01</span><h2>Direzione visiva</h2></div><div className={styles.themeOptions} role="group" aria-label="Direzione visiva">{themes.map((item) => <button key={item.id} aria-pressed={theme === item.id} className={`${styles.themeOption} ${theme === item.id ? styles.themeOptionActive : ""}`} onClick={() => setTheme(item.id)}><span className={styles.themeSwatches}>{item.swatches.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><span><strong>{item.name}</strong><small>{item.note}</small></span><span className={styles.radioMark} /></button>)}</div></div>
        <div className={styles.controlGroup}><div className={styles.controlHeading}><span>02</span><h2>Cursore demo</h2></div><div className={styles.cursorOptions}>{cursorOptions.map((item) => <button key={item.id} className={`${styles.cursorOption} ${cursorDemo === item.id ? styles.cursorOptionActive : ""}`} aria-pressed={cursorDemo === item.id} onClick={() => setCursorDemo(item.id)}><span>{item.short}</span>{item.label}<i /></button>)}</div></div>
        <div className={styles.controlGroup}><div className={styles.controlHeading}><span>03</span><h2>Ritmo</h2></div><label className={styles.speedControl}><span>Velocità animazione</span><strong>{speed.toFixed(1)}×</strong><input aria-label="Velocità animazione" type="range" min="0.6" max="1.5" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><span className={styles.rangeEnds}><i>Lento</i><i>Rapido</i></span></label><button className={`${styles.motionToggle} ${motionOn ? styles.motionToggleOn : ""}`} aria-pressed={motionOn} onClick={() => setMotionOn((on) => !on)}><span><span className={styles.toggleTrack}><i /></span><span>Movimento interattivo</span></span><small>{reducedMotion ? "Ridotto dal dispositivo" : motionOn ? "Attivo" : "In pausa"}</small></button></div>
        <div className={styles.railFoot}><span><Icon name="spark" size={15} /> Nessun dato reale</span><small>Ogni demo è indipendente<br />dall’interfaccia dell’app.</small></div>
      </aside>
      <div className={styles.workbench}>
        <div className={styles.workbenchHeader}><div><span className={styles.eyebrow}>ARMONIA INTERACTION LAB <span>·</span> 04 STUDI</span><h2>Un’interfaccia che <em>risponde.</em></h2></div><div className={styles.studioStamp}><span>STUDIO / 26</span><b>01</b></div></div>
        <nav className={styles.sectionNav} aria-label="Sezioni del playground">{sections.map((section) => <button key={section.id} className={activeSection === section.id ? styles.sectionActive : ""} onClick={() => navigateTo(section.id)}><span>{section.label}</span><i>{section.count}</i></button>)}<span className={styles.sectionNavRule} /></nav>
        <section className={styles.demoSection} id="cursori"><div className={styles.sectionTitle}><span className={styles.eyebrow}>01 / PRESENZA</span><div><h2>Un cursore con <em>intenzione.</em></h2><p>Una grammatica sottile tra puntatore e superficie.</p></div><span className={styles.demoCount}>04 STUDI</span></div><div className={styles.cursorDemoBar}><span>{cursorOptions.find((item) => item.id === cursorDemo)?.short} / {cursorOptions.find((item) => item.id === cursorDemo)?.label}</span><div>{cursorOptions.map((item) => <button key={item.id} className={cursorDemo === item.id ? styles.miniChoiceActive : ""} aria-label={`Mostra ${item.label}`} aria-pressed={cursorDemo === item.id} onClick={() => setCursorDemo(item.id)}>{item.short}</button>)}</div></div><CursorStage demo={cursorDemo} speed={speed} motionOn={effectiveMotion} /><p className={styles.sectionNote}>Cursore nativo invariato fuori dall’area di prova. Su touch e tastiera restano disponibili tutte le azioni.</p></section>
        <section className={styles.demoSection} id="pulsanti"><div className={styles.sectionTitle}><span className={styles.eyebrow}>02 / RISPOSTA</span><div><h2>Un gesto, una <em>risposta.</em></h2><p>Micro-feedback tangibili, senza trasformare ogni CTA in uno spettacolo.</p></div><span className={styles.demoCount}>04 STUDI</span></div><ButtonPlayground speed={speed} motionOn={effectiveMotion} /></section>
        <section className={styles.demoSection} id="schede"><div className={styles.sectionTitle}><span className={styles.eyebrow}>03 / SUPERFICIE</span><div><h2>Profondità <em>controllata.</em></h2><p>Luce, prospettiva e contenuto espandibile: tre modi di rendere una superficie presente.</p></div><span className={styles.demoCount}>03 STUDI</span></div><CardPlayground speed={speed} motionOn={effectiveMotion} /></section>
        <section className={styles.demoSection} id="navigazione"><div className={styles.sectionTitle}><span className={styles.eyebrow}>04 / ORIENTAMENTO</span><div><h2>Muoversi con <em>leggerezza.</em></h2><p>La navigazione comunica sempre dove sei e cosa è appena accaduto.</p></div><span className={styles.demoCount}>04 STUDI</span></div><NavigationPlayground speed={speed} motionOn={effectiveMotion} /></section>
        <footer className={styles.labFooter}><span>ARMONIA <i>·</i> DESIGN LAB V1</span><span>Un laboratorio locale, non una nuova superficie di prodotto.</span><a href="#top">Torna all’inizio ↑</a></footer>
      </div>
    </div>}
  </main>;
}
