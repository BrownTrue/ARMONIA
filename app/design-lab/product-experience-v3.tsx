"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./product-experience-v3.module.css";

type Theme = "organic" | "editorial" | "playful";
type Screen = "Oggi" | "Statistiche" | "Impostazioni";
type SettingsSection = "Dati professionali e documenti" | "Logo dei documenti" | "Calendari" | "Account e sicurezza" | "Esportazione dati";

const screens: { label: Screen; icon: "sun" | "chart" | "settings" }[] = [
  { label: "Oggi", icon: "sun" },
  { label: "Statistiche", icon: "chart" },
  { label: "Impostazioni", icon: "settings" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 5-6" /><circle cx="19" cy="7" r="1" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
    leaf: <><path d="M20 4c-9 0-14 4-14 11a5 5 0 0 0 5 5c7 0 9-8 9-16Z" /><path d="M4 21c2-4 6-7 12-10" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
    trend: <><path d="m4 16 5-5 4 3 7-8" /><path d="M14 6h6v6" /></>,
    document: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6m-6 4h6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    cloud: <path d="M7 18a5 5 0 1 1 .6-9.97A6 6 0 0 1 19 10a4 4 0 0 1 0 8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.leaf}</svg>;
}

const appointments = [
  { time: "09:00", duration: "45 min", name: "Giulia Bianchi", note: "Prestazione · Valutazione", kind: "next", initials: "GB", color: "sage" },
  { time: "10:15", duration: "45 min", name: "Luca Ferri", note: "Prestazione · Seduta", kind: "next", initials: "LF", color: "clay" },
  { time: "11:30", duration: "60 min", name: "Marta Conti", note: "Prestazione · Seduta", kind: "next", initials: "MC", color: "blue" },
];
const settingsSections: { label: SettingsSection; note: string; icon: string }[] = [
  { label: "Dati professionali e documenti", note: "Identità professionale e intestazioni", icon: "person" },
  { label: "Logo dei documenti", note: "Immagine usata nelle stampe", icon: "leaf" },
  { label: "Calendari", note: "Google Calendar e Calendario ARMONIA", icon: "calendar" },
  { label: "Account e sicurezza", note: "Sessione e credenziali", icon: "shield" },
  { label: "Esportazione dati", note: "Scarica una copia dei tuoi dati", icon: "document" },
];

export default function ProductExperienceV3({ theme, motionOn, onThemeChange }: { theme: Theme; motionOn: boolean; onThemeChange: (theme: Theme) => void }) {
  const [screen, setScreen] = useState<Screen>("Oggi");
  const [todayConcept, setTodayConcept] = useState<"workspace" | "editorial">("workspace");
  const [period, setPeriod] = useState("30 giorni");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(settingsSections[0].label);
  const [feedback, setFeedback] = useState("");
  const showDemoFeedback = (what: string) => setFeedback(`${what} · anteprima dimostrativa, nessuna modifica salvata.`);

  return <div className={styles.lab} data-theme={theme} data-motion={motionOn ? "on" : "off"}>
    <div className={styles.intro}>
      <div><span className={styles.eyebrow}>ARMONIA / PRODUCT EXPERIENCE · V3</span><h1>Una giornata di lavoro,<br /><em>nel suo insieme.</em></h1><p>Tre superfici reali, rilette con una direzione Organic Premium. Qui ogni dato e ogni interazione sono solo dimostrativi.</p></div>
      <div className={styles.introSide}><span className={styles.demoBadge}><i /> DATI DIMOSTRATIVI · NESSUN DATO REALE</span><fieldset className={styles.themePicker}><legend>Direzione visiva</legend>{([ ["organic", "Organic"], ["editorial", "Editorial"], ["playful", "Playful"] ] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={theme === id} onClick={() => onThemeChange(id)}>{label}</button>)}</fieldset></div>
    </div>

    <section className={styles.productFrame} aria-label="Anteprima navigabile del prodotto">
      <aside className={styles.rail}>
        <div className={styles.railBrand} aria-label="ARMONIA"><span><Icon name="leaf" size={21} /></span><small>ARMONIA</small></div>
        <nav className={styles.primaryNav} aria-label="Schermate dimostrative">{screens.map((item, index) => <button type="button" key={item.label} className={screen === item.label ? styles.navActive : ""} aria-pressed={screen === item.label} onClick={() => { setScreen(item.label); setFeedback(""); }}><span className={styles.navIcon}><Icon name={item.icon} size={18} /></span><span>{item.label}</span><i>0{index + 1}</i></button>)}</nav>
        <div className={styles.railBottom}><span className={styles.avatar}>AR</span><span><b>Studio demo</b><small>Profilo dimostrativo</small></span><span className={styles.presence} aria-hidden="true" /></div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.workspaceHeader}><div><span className={styles.workspaceCrumb}>ARMONIA <b>/</b> {screen}</span><span className={styles.todayDate}>Giovedì, 8 ottobre 2026</span></div><div className={styles.headerActions}><span className={styles.demoFlag}>LAB · SOLO ANTEPRIMA</span><button type="button" className={styles.profileButton} aria-label="Profilo dimostrativo"><span>AR</span><i>Studio demo</i></button></div></header>
        {screen === "Oggi" && <section className={styles.screenBody} aria-labelledby="today-title">
          <div className={styles.screenTitleRow}><div><span className={styles.eyebrow}>LA TUA GIORNATA</span><h2 id="today-title">Oggi, con <em>presenza.</em></h2><p>Le attività di oggi, in un unico spazio.</p></div><div className={styles.conceptSwitch} role="group" aria-label="Confronta i concept Oggi"><button type="button" aria-pressed={todayConcept === "workspace"} onClick={() => setTodayConcept("workspace")}>A · Workspace</button><button type="button" aria-pressed={todayConcept === "editorial"} onClick={() => setTodayConcept("editorial")}>B · Editorial</button></div></div>
          {todayConcept === "workspace" ? <TodayWorkspace onAction={showDemoFeedback} /> : <TodayEditorial onAction={showDemoFeedback} />}
        </section>}
        {screen === "Statistiche" && <StatisticsScreen period={period} setPeriod={setPeriod} />}
        {screen === "Impostazioni" && <SettingsScreen section={settingsSection} setSection={setSettingsSection} onAction={showDemoFeedback} />}
        {feedback && <p className={styles.feedback} role="status"><Icon name="check" size={15} />{feedback}<button type="button" aria-label="Chiudi messaggio" onClick={() => setFeedback("")}>×</button></p>}
        <footer className={styles.workspaceFooter}><span>ARMONIA · Design Lab V3</span><span>Tutte le azioni sono dimostrative e non salvano dati.</span></footer>
      </div>
    </section>
  </div>;
}

function TodayWorkspace({ onAction }: { onAction: (what: string) => void }) {
  return <div className={styles.todayWorkspace}>
    <div className={styles.workspaceWelcome}><div><span className={styles.welcomeMark}><Icon name="sun" size={20} /></span><span className={styles.welcomeLabel}>GIOVEDÌ · 8 OTTOBRE</span><h3>Buongiorno,<br /><em>professionista.</em></h3><p>Hai 3 appuntamenti da fare oggi. Prendiamoli uno alla volta.</p></div><div className={styles.welcomeArt} aria-hidden="true"><span className={styles.orbitOne} /><span className={styles.orbitTwo} /><span className={styles.sunDisc} /><span className={styles.artLeaf}><Icon name="leaf" size={40} /></span><small>una cosa<br />alla volta</small></div></div>
    <div className={styles.actionRow}><button type="button" className={styles.primaryAction} onClick={() => onAction("Nuovo appuntamento")}><Icon name="plus" /> Nuovo appuntamento <Icon name="arrow" size={16} /></button><button type="button" className={styles.secondaryAction} onClick={() => onAction("Registra seduta")}><Icon name="check" /> Registra seduta</button></div>
    <div className={styles.metricsStrip} aria-label="Riepilogo attività dimostrativo"><Metric label="Da fare oggi" value="03" note="appuntamenti" icon="clock" /><Metric label="Completati oggi" value="02" note="sedute registrate" icon="check" /><Metric label="Pazienti attivi" value="18" note="nel tuo studio" icon="person" /></div>
    <div className={styles.workspaceColumns}><section className={styles.appointmentPanel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>AGENDA DI OGGI</span><h3>Prossimi appuntamenti</h3></div><button type="button" className={styles.inlineLink} onClick={() => onAction("Calendario")}>Apri calendario <Icon name="arrow" size={14} /></button></div><div className={styles.appointmentList}>{appointments.map((appointment, index) => <article className={styles.appointmentRow} key={appointment.name}><time>{appointment.time}</time><span className={`${styles.patientAvatar} ${styles[appointment.color]}`}>{appointment.initials}</span><div className={styles.appointmentText}><h4>{appointment.name}</h4><p>{appointment.note}</p></div><span className={styles.duration}>{appointment.duration}</span><button type="button" className={styles.rowAction} aria-label={`Apri ${appointment.name}`} onClick={() => onAction(`Apri ${appointment.name}`)}><Icon name="arrow" size={15} /></button><span className={styles.timelineStem} aria-hidden="true" />{index < appointments.length - 1 && <span className={styles.rowRule} aria-hidden="true" />}</article>)}</div><div className={styles.completedLine}><span className={styles.completedIcon}><Icon name="check" size={14} /></span><span><b>2 sedute registrate</b><small>Completati oggi</small></span><button type="button" onClick={() => onAction("Apri sedute completate")}>Vedi</button></div></section>
      <aside className={styles.contextPanel}><span className={styles.eyebrow}>IN SINTESI</span><h3>Il filo della giornata.</h3><p>Un quadro semplice delle attività già presenti in ARMONIA.</p><div className={styles.contextStat}><span className={styles.contextIcon}><Icon name="person" /></span><span><b>18</b><small>Pazienti attivi</small></span></div><div className={styles.contextStat}><span className={styles.contextIcon}><Icon name="calendar" /></span><span><b>246</b><small>Sedute registrate</small></span></div><button type="button" className={styles.contextButton} onClick={() => onAction("Dettaglio riepilogo")}>Vai al riepilogo <Icon name="arrow" size={15} /></button></aside></div>
  </div>;
}

function TodayEditorial({ onAction }: { onAction: (what: string) => void }) {
  return <div className={styles.todayEditorial}>
    <div className={styles.editorialMasthead}><div><span className={styles.welcomeLabel}>GIOVEDÌ · 8 OTTOBRE 2026</span><h3>Il tempo<br />della <em>cura.</em></h3><p>Tre appuntamenti in agenda.<br />Due sedute già registrate.</p></div><div className={styles.dayNumber}><span>GIO</span><strong>08</strong><small>OTT<br />2026</small></div><div className={styles.editorialSeal}><span>ARMONIA</span><Icon name="leaf" size={23} /><small>una giornata<br />alla volta</small></div></div>
    <div className={styles.editorialActions}><span>INIZIA DA QUI</span><button type="button" onClick={() => onAction("Nuovo appuntamento")}><Icon name="plus" /> Nuovo appuntamento <Icon name="arrow" /></button><button type="button" onClick={() => onAction("Registra seduta")}><Icon name="check" /> Registra seduta</button><button type="button" className={styles.editorialCalendar} onClick={() => onAction("Calendario")}>Apri calendario <Icon name="arrow" size={15} /></button></div>
    <div className={styles.editorialLedger}><div className={styles.ledgerHead}><div><span className={styles.eyebrow}>01 — IN AGENDA</span><h4>Appuntamenti <em>da fare</em></h4></div><span>03 / OGGI</span></div>{appointments.map((appointment, index) => <article className={styles.ledgerRow} key={appointment.name}><time>{appointment.time}</time><span className={styles.ledgerIndex}>0{index + 1}</span><div><h5>{appointment.name}</h5><p>{appointment.note}</p></div><span className={styles.duration}>{appointment.duration}</span><button type="button" aria-label={`Apri ${appointment.name}`} onClick={() => onAction(`Apri ${appointment.name}`)}><Icon name="arrow" size={16} /></button></article>)}
      <div className={styles.ledgerCompleted}><span className={styles.completedIcon}><Icon name="check" size={14} /></span><div><b>Completati oggi</b><p>2 sedute registrate</p></div><button type="button" onClick={() => onAction("Apri sedute completate")}>Apri</button></div></div>
    <div className={styles.editorialFoot}><span><b>18</b> pazienti attivi</span><i /><span><b>246</b> sedute registrate</span><span className={styles.editorialFootNote}>Il percorso continua, un incontro alla volta.</span></div>
  </div>;
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return <div className={styles.metric}><span className={styles.metricIcon}><Icon name={icon} size={16} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function StatisticsScreen({ period, setPeriod }: { period: string; setPeriod: (value: string) => void }) {
  const chartSets: Record<string, number[]> = { "7 giorni": [4, 6, 3, 8, 5, 9, 4], "30 giorni": [5, 7, 4, 9, 6, 8, 11, 7, 9, 6, 12, 8], "Anno": [5, 6, 7, 5, 9, 8, 10, 7, 11, 9, 12, 10] };
  const bars = chartSets[period];
  const days = period === "7 giorni" ? ["G", "V", "S", "D", "L", "M", "O"] : period === "30 giorni" ? ["01", "04", "07", "10", "13", "16", "19", "22", "25", "28", "31", "·"] : ["N", "D", "G", "F", "M", "A", "M", "G", "L", "A", "S", "O"];
  return <section className={styles.screenBody} aria-labelledby="stats-title"><div className={styles.screenTitleRow}><div><span className={styles.eyebrow}>UNO SGUARDO D’INSIEME</span><h2 id="stats-title">Il lavoro, <em>nel tempo.</em></h2><p>Indicatori chiari per leggere il ritmo della tua attività.</p></div><div className={styles.periodSwitch} role="group" aria-label="Periodo dimostrativo">{Object.keys(chartSets).map((item) => <button type="button" key={item} aria-pressed={period === item} onClick={() => setPeriod(item)}>{item}</button>)}</div></div>
    <div className={styles.statsHero}><div><span className={styles.heroLabel}><i /> ATTIVITÀ REGISTRATA · {period.toUpperCase()}</span><strong>42</strong><span className={styles.heroUnit}>sedute registrate</span><p>Un andamento costante, osservato senza classificazioni automatiche.</p></div><div className={styles.heroSide}><span className={styles.trendIcon}><Icon name="trend" size={19} /></span><b>+12%</b><small>rispetto al periodo<br />precedente · demo</small><div className={styles.heroSpark} aria-hidden="true">{[30, 44, 36, 58, 48, 67, 57, 82, 71, 91].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div><span className={styles.heroDecoration} aria-hidden="true" /></div>
    <div className={styles.statsMetrics}><Metric label="Sedute registrate" value="42" note="nel periodo" icon="check" /><Metric label="Ore lavorate" value="31,5 h" note="durata complessiva" icon="clock" /><Metric label="Pazienti seguiti" value="18" note="attivi correnti" icon="person" /><Metric label="Giorni lavorati" value="16" note="con sedute" icon="calendar" /></div>
    <div className={styles.statsGrid}><section className={styles.chartPanel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>RITMO</span><h3>Andamento dell’attività</h3><p>Sedute registrate nel periodo selezionato.</p></div><span className={styles.chartLegend}><i /> Sedute</span></div><div className={styles.barChart} role="img" aria-label={`Grafico dimostrativo sedute registrate, periodo ${period}`}>{bars.map((value, index) => <div className={styles.barColumn} key={`${period}-${index}`}><span className={styles.barValue}>{value}</span><div className={styles.barTrack}><i style={{ height: `${Math.max(18, value / 12 * 100)}%` }} /></div><small>{days[index]}</small></div>)}</div><div className={styles.chartFoot}><span>Periodo dimostrativo</span><b>42 sedute</b></div></section><section className={styles.distributionPanel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>PRESTAZIONI</span><h3>Distribuzione</h3><p>Per tipologia di prestazione.</p></div><span className={styles.smallIndex}>02</span></div><div className={styles.distributionChart}><div className={styles.donut}><div><strong>42</strong><small>sedute</small></div></div><div className={styles.legendList}><Legend label="Seduta" value="24" color="forest" /><Legend label="Valutazione" value="10" color="sage" /><Legend label="Colloquio" value="8" color="clay" /></div></div></section></div>
    <div className={styles.statsLower}><section className={styles.compactPanel}><span className={styles.eyebrow}>AGENDA</span><h3>Stato degli appuntamenti</h3><div className={styles.statusBars}><StatusBar label="Registrati" value="42" width="74%" color="forest" /><StatusBar label="Da registrare" value="8" width="26%" color="clay" /><StatusBar label="Annullati" value="3" width="12%" color="muted" /><StatusBar label="Manuali" value="5" width="18%" color="sage" /></div></section><section className={styles.compactPanel}><span className={styles.eyebrow}>PAZIENTI</span><h3>Continuità nel periodo</h3><div className={styles.patientStats}><div><strong>18</strong><span>Pazienti attivi correnti</span></div><div><strong>04</strong><span>Nuovi nel periodo</span></div><div><strong>16</strong><span>Seguiti nel periodo</span></div><div><strong>2,6</strong><span>Frequenza media · sedute</span></div></div></section><section className={`${styles.compactPanel} ${styles.economyPanel}`}><span className={styles.eyebrow}>ECONOMIA</span><h3>Prestazioni e incassi</h3><div className={styles.economyAmounts}><div><small>Prestazioni</small><strong>€ 2.160</strong></div><i /><div><small>Incassato</small><strong>€ 1.740</strong></div></div><p>Riepilogo economico dimostrativo del periodo.</p></section></div>
  </section>;
}

function Legend({ label, value, color }: { label: string; value: string; color: string }) { return <div className={styles.legendItem}><i className={styles[color]} /><span>{label}</span><b>{value}</b></div>; }
function StatusBar({ label, value, width, color }: { label: string; value: string; width: string; color: string }) { return <div className={styles.statusBar}><div><span>{label}</span><b>{value}</b></div><i><span className={styles[color]} style={{ width }} /></i></div>; }

function SettingsScreen({ section, setSection, onAction }: { section: SettingsSection; setSection: (section: SettingsSection) => void; onAction: (what: string) => void }) {
  const selected = settingsSections.find((item) => item.label === section) ?? settingsSections[0];
  return <section className={styles.screenBody} aria-labelledby="settings-title"><div className={styles.screenTitleRow}><div><span className={styles.eyebrow}>IL TUO SPAZIO</span><h2 id="settings-title">Impostazioni, <em>con chiarezza.</em></h2><p>Le aree professionali raccolte in un unico luogo.</p></div><span className={styles.settingsStatus}><i /> Profilo dimostrativo</span></div>
    <div className={styles.settingsLayout}><nav className={styles.settingsNav} aria-label="Aree impostazioni dimostrative">{settingsSections.map((item, index) => <button type="button" key={item.label} className={section === item.label ? styles.settingsActive : ""} aria-pressed={section === item.label} onClick={() => setSection(item.label)}><span className={styles.settingsIcon}><Icon name={item.icon} size={17} /></span><span><b>{item.label}</b><small>{item.note}</small></span><i>0{index + 1}</i></button>)}<div className={styles.settingsNote}><Icon name="calendar" size={16} /><span><b>Sedi e prestazioni</b><small>Gestite nella sezione Calendario.</small></span></div></nav>
      <div className={styles.settingsContent}><header className={styles.settingsContentHead}><span className={styles.contentIcon}><Icon name={selected.icon} size={19} /></span><div><span className={styles.eyebrow}>AREA {String(settingsSections.findIndex((item) => item.label === section) + 1).padStart(2, "0")}</span><h3>{selected.label}</h3><p>{selected.note}</p></div><span className={styles.settingsPreview}>ANTEPRIMA</span></header>
        {section === "Dati professionali e documenti" && <div className={styles.settingsFields}><DemoField label="Nome" value="Alessia" /><DemoField label="Cognome" value="Professionista" /><DemoField label="Professione" value="Logopedista" /><DemoField label="Studio / centro" value="Studio Armonia" /><div className={styles.fieldWide}><DemoField label="Email" value="studio@example.test" /></div><div className={styles.fieldWide}><p className={styles.helperText}>Questi dati vengono proposti nelle bozze dei documenti. I valori qui mostrati sono fittizi.</p></div></div>}
        {section === "Logo dei documenti" && <div className={styles.logoPreview}><div className={styles.logoSheet}><span className={styles.logoMark}><Icon name="leaf" size={24} /></span><span><b>Studio Armonia</b><small>Logopedista</small></span><i>DOCUMENTO</i></div><p>Anteprima illustrativa dell’identità professionale usata nelle stampe.</p><button type="button" className={styles.secondaryAction} onClick={() => onAction("Logo dei documenti")}>Esplora questa impostazione <Icon name="arrow" size={15} /></button></div>}
        {section === "Calendari" && <div className={styles.calendarSettings}><SettingRow icon="cloud" title="Google Calendar" detail="Collegamento e preferenze di sincronizzazione" state="Anteprima" /><SettingRow icon="calendar" title="Calendario ARMONIA" detail="Feed privato in sola lettura" state="Disponibile" /><p>Questa schermata non collega account né avvia sincronizzazioni.</p></div>}
        {section === "Account e sicurezza" && <div className={styles.securityPreview}><span className={styles.securitySeal}><Icon name="shield" size={26} /></span><h4>Il controllo resta nelle tue mani.</h4><p>La sezione reale raccoglie gestione dell’account, sessione e credenziali. Questa anteprima è solo visiva: non cambia password, sessioni o impostazioni di sicurezza.</p><button type="button" className={styles.quietAction} onClick={() => onAction("Account e sicurezza")}>Anteprima area account <Icon name="arrow" size={15} /></button></div>}
        {section === "Esportazione dati" && <div className={styles.exportPreview}><div className={styles.exportIcon}><Icon name="document" size={23} /></div><div><h4>Una copia dei tuoi dati, quando serve.</h4><p>L’area consente di preparare un’esportazione personale dei dati ARMONIA.</p></div><button type="button" className={styles.primaryAction} onClick={() => onAction("Esportazione dati")}>Vedi anteprima <Icon name="arrow" size={15} /></button><small>Nessun file viene generato in questo laboratorio.</small></div>}
        {section === "Dati professionali e documenti" && <div className={styles.settingsActions}><button type="button" className={styles.primaryAction} onClick={() => onAction("Dati professionali")}>Salva dati professionali <Icon name="arrow" size={15} /></button><span>Solo anteprima · nessun dato salvato</span></div>}
      </div>
    </div>
  </section>;
}

function DemoField({ label, value }: { label: string; value: string }) { return <label className={styles.demoField}>{label}<span>{value}<i>DEMO</i></span></label>; }
function SettingRow({ icon, title, detail, state }: { icon: string; title: string; detail: string; state: string }) { return <div className={styles.settingRow}><span><Icon name={icon} size={17} /></span><div><b>{title}</b><small>{detail}</small></div><i>{state}</i></div>; }
