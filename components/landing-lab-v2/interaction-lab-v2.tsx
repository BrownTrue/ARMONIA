"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./interaction-lab-v2.module.css";

type SceneId = "pathway" | "laboratory" | "tools";

const SCENES: Array<{ id: SceneId; eyebrow: string; title: string; description: string }> = [
  { id: "pathway", eyebrow: "01", title: "Percorso clinico", description: "Una valutazione non resta isolata. Diventa parte del percorso." },
  { id: "laboratory", eyebrow: "02", title: "Laboratorio", description: "Dal materiale in seduta al compito da portare a casa." },
  { id: "tools", eyebrow: "03", title: "Strumenti clinici", description: "Strumenti diversi. Lo stesso spazio clinico." },
];

function PathwayContent() {
  return <>
    <header className={styles.sceneHeader}><span>Percorso di cura</span><strong>Mario Rossi</strong><small>Continuità clinica</small></header>
    <div className={styles.pathRail} aria-hidden="true"><i /><i /><i /><i /></div>
    <div className={styles.pathSteps}>
      <article><span>Valutazione</span><strong>Prima valutazione</strong><small>Quadro clinico registrato</small></article>
      <article className={styles.goal}><span>Obiettivo</span><strong>Comunicazione funzionale</strong><small>Attivo · priorità alta</small><b>65%</b></article>
      <article><span>Seduta</span><strong>Attività mirate</strong><small>Oggi · 45 minuti</small></article>
      <article><span>Follow-up</span><strong>Verifica del percorso</strong><small>Programmato</small></article>
    </div>
  </>;
}

function LaboratoryContent() {
  return <>
    <header className={styles.sceneHeader}><span>Laboratorio</span><strong>Scheda per Mario</strong><small>Pronta da usare</small></header>
    <div className={styles.worksheetTitle}><span>Attività personalizzate</span><strong>Parole, suoni e lettura</strong></div>
    <div className={styles.activityGrid}>
      <article><i>01</i><strong>Denominazione</strong><span>Immagini e parole</span></article>
      <article><i>02</i><strong>Coppie minime</strong><span>Ascolto e produzione</span></article>
      <article><i>03</i><strong>Lettura</strong><span>Frasi brevi</span></article>
    </div>
    <div className={styles.homework}><span>Compito a casa</span><strong>Continua con calma</strong><small>3 attività · scheda paziente</small></div>
  </>;
}

function ToolsContent() {
  return <>
    <header className={styles.sceneHeader}><span>Biblioteca clinica</span><strong>Strumenti selezionati</strong><small>Nel percorso, quando servono</small></header>
    <div className={styles.libraryCards}>
      <article className={styles.off}><span>Osservazione</span><strong>OFF</strong><small>Fonologia</small></article>
      <article className={styles.plo}><span>Profilo</span><strong>PLO</strong><small>Linguaggio orale</small></article>
      <article className={styles.mot}><span>Originale ARMONIA</span><strong>MOT</strong><small>Monitoraggio obiettivi</small><em>Non standardizzato</em></article>
      <article className={styles.qab}><span>Integrato</span><strong>Italian QAB</strong><small>Valutazione dell'afasia</small><em>Apri strumento</em></article>
    </div>
  </>;
}

export function InteractionLabV2() {
  const [active, setActive] = useState<SceneId>("pathway");
  const [entered, setEntered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) { setEntered(true); return; }
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setEntered(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const selectAt = (index: number) => {
    const item = SCENES[(index + SCENES.length) % SCENES.length];
    setActive(item.id);
    buttonRefs.current[(index + SCENES.length) % SCENES.length]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); selectAt(index + 1); }
    if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); selectAt(index - 1); }
    if (event.key === "Home") { event.preventDefault(); selectAt(0); }
    if (event.key === "End") { event.preventDefault(); selectAt(SCENES.length - 1); }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--px", String((event.clientX - rect.left) / rect.width - 0.5));
    event.currentTarget.style.setProperty("--py", String((event.clientY - rect.top) / rect.height - 0.5));
  };

  return <main className={`${styles.page} ${active === "tools" ? styles.toolsMode : ""}`}>
    <header className={styles.topbar}>
      <a href="#experience" aria-label="Vai all'esperienza ARMONIA"><Image src="/branding/logo-mark.svg" alt="" width={30} height={30} /><span>ARMONIA</span></a>
      <p>Interaction lab · V2</p>
    </header>

    <section className={styles.intro} aria-labelledby="lab-v2-title">
      <div className={styles.brandMark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="70vw" priority /></div>
      <p>Il lavoro clinico, nello stesso spazio</p>
      <h1 id="lab-v2-title">Un solo spazio.<br /><em>Il lavoro cambia forma.</em></h1>
      <span>Tre momenti del lavoro quotidiano, connessi senza interrompere il percorso.</span>
      <a href="#experience">Esplora il prodotto <b aria-hidden="true">↓</b></a>
      <div className={styles.introProduct} aria-hidden="true"><i /><i /><i /><span /></div>
    </section>

    <section id="experience" ref={sectionRef} className={`${styles.experience} ${entered ? styles.entered : ""}`}>
      <div className={styles.experienceMark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="60vw" /></div>
      <div className={styles.stickyLayout}>
        <div className={styles.copy}>
          <p>ARMONIA accompagna il lavoro</p>
          <h2>Ogni gesto<br />trova continuità.</h2>
          <div className={styles.controls} role="tablist" aria-label="Aree di ARMONIA" aria-orientation="vertical">
            {SCENES.map((scene, index) => <button
              key={scene.id}
              ref={(node) => { buttonRefs.current[index] = node; }}
              id={`lab-v2-tab-${scene.id}`}
              type="button"
              role="tab"
              aria-selected={active === scene.id}
              aria-controls={`lab-v2-panel-${scene.id}`}
              tabIndex={active === scene.id ? 0 : -1}
              className={active === scene.id ? styles.selected : ""}
              onClick={() => setActive(scene.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            ><i aria-hidden="true">{active === scene.id ? "−" : "+"}</i><span><small>{scene.eyebrow}</small><strong>{scene.title}</strong>{active === scene.id && <em>{scene.description}</em>}</span></button>)}
          </div>
        </div>

        <div className={styles.stage} onPointerMove={onPointerMove} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--px", "0"); event.currentTarget.style.setProperty("--py", "0"); }} style={{ "--px": 0, "--py": 0 } as CSSProperties}>
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.productShell}>
            <nav aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" width={22} height={22} /><i /><i /><i /><i /></nav>
            <div className={styles.productSurface}>
              {SCENES.map((scene) => <section
                key={scene.id}
                id={`lab-v2-panel-${scene.id}`}
                role="tabpanel"
                aria-labelledby={`lab-v2-tab-${scene.id}`}
                aria-hidden={active !== scene.id}
                className={`${styles.scene} ${styles[scene.id]} ${active === scene.id ? styles.activeScene : styles.inactiveScene}`}
              >{scene.id === "pathway" ? <PathwayContent /> : scene.id === "laboratory" ? <LaboratoryContent /> : <ToolsContent />}</section>)}
            </div>
          </div>
          <div className={styles.sharedBadge} aria-hidden="true"><span>{active === "pathway" ? "Prossimo passo" : active === "laboratory" ? "Da condividere" : "Nel percorso"}</span><strong>{active === "pathway" ? "Seduta · martedì" : active === "laboratory" ? "Scheda pronta" : "Scelta professionale"}</strong></div>
        </div>
      </div>
    </section>
  </main>;
}
