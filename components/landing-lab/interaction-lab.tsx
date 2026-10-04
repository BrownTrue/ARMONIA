"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./interaction-lab.module.css";

type StoryId = "pathway" | "laboratory" | "tools";
type Story = { id: StoryId; label: string; title: string; copy: string };

const stories: Story[] = [
  { id: "pathway", label: "Percorso clinico", title: "Una valutazione non finisce in un PDF.", copy: "Diventa parte del percorso." },
  { id: "laboratory", label: "Laboratorio", title: "Dal materiale in seduta", copy: "al compito da portare a casa." },
  { id: "tools", label: "Strumenti clinici", title: "Strumenti diversi.", copy: "Lo stesso spazio clinico." },
];

function PathwayScene() {
  return <div className={`${styles.story} ${styles.pathway}`} data-story="pathway">
    <div className={styles.patientBar}><div><span>Paziente</span><strong>Giulia Bianchi</strong></div><small>Percorso attivo</small></div>
    <div className={styles.pathwayGrid}>
      <div className={styles.timeline}>
        {[['Valutazione','Profilo linguistico'],['Obiettivo','Priorità condivisa'],['Seduta','Attività e materiali'],['Follow-up','Continuità nel tempo']].map(([title,note],index)=><div className={styles.timelineItem} key={title} style={{"--order":index} as React.CSSProperties}><i/><div><b>{title}</b><span>{note}</span></div></div>)}
      </div>
      <div className={styles.focusCard}><span>Obiettivo terapeutico</span><strong>Generalizzazione nella comunicazione quotidiana</strong><div><i/><small>Collegato a 3 sedute</small></div></div>
    </div>
  </div>;
}

function LaboratoryScene() {
  return <div className={`${styles.story} ${styles.laboratory}`} data-story="laboratory">
    <div className={styles.worksheetHeader}><div><span>Laboratorio</span><strong>Scheda per Giulia</strong></div><small>4 attività</small></div>
    <div className={styles.sheet}>
      <div className={styles.sheetTop}><span>Attività per la settimana</span><i>ARMONIA</i></div>
      <div className={styles.exerciseGrid}>{["Denominazione","Coppie minime","Lettura","Compito a casa"].map((label,index)=><div className={styles.exercise} key={label} style={{"--order":index} as React.CSSProperties}><span>{String(index+1).padStart(2,"0")}</span><b>{label}</b><div className={styles.exerciseLines}><i/><i/><i/></div></div>)}</div>
    </div>
    <div className={styles.assignment}><span>Assegnata al paziente</span><strong>Pronta da stampare</strong></div>
  </div>;
}

function ToolsScene() {
  return <div className={`${styles.story} ${styles.tools}`} data-story="tools">
    <div className={styles.libraryHeader}><div><span>Biblioteca clinica</span><strong>Strumenti selezionati</strong></div><div className={styles.search}>Cerca per area o popolazione</div></div>
    <div className={styles.toolGrid}>
      <article className={styles.qab}><span>Valutazione · Linguaggio</span><strong>Italian QAB</strong><p>Somministrazione e scoring integrati nello spazio clinico.</p><i>Integrato</i></article>
      <article className={styles.mot}><span>Monitoraggio</span><strong>MOT</strong><p>Strumento originale ARMONIA.</p><div><i>Originale ARMONIA</i><em>Non standardizzato</em></div></article>
      <article className={styles.miniTool}><span>PLO</span><small>Profilo del linguaggio orale</small></article>
      <article className={styles.miniTool}><span>OFF</span><small>Osservazione fonetico-fonologica</small></article>
    </div>
  </div>;
}

export function InteractionLab() {
  const [active, setActive] = useState<StoryId>("pathway");
  const [entered, setEntered] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const activeIndex = stories.findIndex((story) => story.id === active);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setEntered(entry.isIntersecting), { threshold: .24 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    event.currentTarget.style.setProperty("--pointer-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--pointer-y", y.toFixed(3));
  };
  const reset = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--pointer-x", "0");
    event.currentTarget.style.setProperty("--pointer-y", "0");
  };

  return <main className={styles.page}>
    <div className={styles.watermark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" width={620} height={680} priority /></div>
    <header className={styles.header}><div className={styles.brand}><Image src="/branding/logo-mark.svg" alt="" width={27} height={30}/><span>ARMONIA</span></div><p>Interaction Lab · Visual provvisorio</p></header>
    <section className={styles.intro}><p>Tre aree. Un solo spazio clinico.</p><h1>Il prodotto racconta<br/>come cambia il lavoro.</h1><span>Scorri per entrare nella scena</span></section>
    <section ref={stageRef} className={`${styles.lab} ${entered?styles.entered:""}`} aria-labelledby="lab-title">
      <div className={styles.copyColumn}>
        <p className={styles.kicker}>Product storytelling · V1</p><h2 id="lab-title">ARMONIA, in movimento.</h2>
        <div className={styles.controls} role="tablist" aria-label="Aree del prodotto">
          {stories.map((story,index)=>{const selected=story.id===active;return <button key={story.id} type="button" role="tab" id={`lab-tab-${story.id}`} aria-selected={selected} aria-controls={`lab-panel-${story.id}`} tabIndex={selected?0:-1} className={selected?styles.selected:""} onClick={()=>setActive(story.id)} onKeyDown={(event)=>{if(!["ArrowDown","ArrowUp","ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?stories.length-1:(index+(event.key==="ArrowDown"||event.key==="ArrowRight"?1:-1)+stories.length)%stories.length;setActive(stories[next].id);requestAnimationFrame(()=>document.getElementById(`lab-tab-${stories[next].id}`)?.focus())}}><span>{String(index+1).padStart(2,"0")}</span><div><strong>{story.label}</strong>{selected&&<p>{story.title}<br/><em>{story.copy}</em></p>}</div><i aria-hidden="true"/></button>})}
        </div>
        <p className={styles.hint}>Seleziona un’area o usa le frecce della tastiera.</p>
      </div>
      <div className={styles.stageWrap} onPointerMove={move} onPointerLeave={reset} style={{"--active-index":activeIndex} as React.CSSProperties}>
        <div className={styles.glow}/><div className={styles.stage}>
          <div className={styles.chrome}><div><i/><i/><i/></div><span>SPAZIO CLINICO</span><small>{stories[activeIndex].label}</small></div>
          <div className={styles.shell}><aside><Image src="/branding/logo-mark.svg" alt="" width={23} height={26}/>{stories.map(s=><i key={s.id} className={s.id===active?styles.activeNav:""}/>)}</aside><div className={styles.canvas}>
            {stories.map(story=><div key={story.id} id={`lab-panel-${story.id}`} role="tabpanel" aria-labelledby={`lab-tab-${story.id}`} aria-hidden={story.id!==active} className={`${styles.panel} ${story.id===active?styles.activePanel:styles.inactivePanel}`}>{story.id==="pathway"?<PathwayScene/>:story.id==="laboratory"?<LaboratoryScene/>:<ToolsScene/>}</div>)}
          </div></div>
        </div>
        <div className={styles.depthCard}><span>Area attiva</span><strong>{stories[activeIndex].label}</strong></div>
      </div>
    </section>
  </main>;
}
