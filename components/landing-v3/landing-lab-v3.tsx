"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./landing-lab-v3.module.css";

type SceneId = "pathway" | "laboratory" | "tools";
const SCENES: Array<{ id: SceneId; number: string; title: string; copy: string }> = [
  { id: "pathway", number: "01", title: "Percorso clinico", copy: "Una valutazione non resta isolata. Diventa parte del percorso." },
  { id: "laboratory", number: "02", title: "Laboratorio", copy: "Dal materiale in seduta al compito da portare a casa." },
  { id: "tools", number: "03", title: "Strumenti clinici", copy: "Strumenti diversi. Lo stesso spazio clinico." },
];

function ProductScene({ active }: { active: SceneId }) {
  return <div className={`${styles.productCanvas} ${styles[`canvas_${active}`]}`} data-visual-slot="SLOT A — Hero product render">
    <div className={styles.productNav} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" width={24} height={24} /><i /><i /><i /><i /></div>
    <div className={styles.productArea}>
      <section aria-hidden={active !== "pathway"} className={`${styles.scene} ${styles.pathScene} ${active === "pathway" ? styles.sceneActive : ""}`}>
        <header><span>Percorso di cura</span><strong>Mario Rossi</strong><small>Situazione attuale</small></header>
        <div className={styles.clinicalLine} aria-hidden="true"><i /><i /><i /><i /></div>
        <div className={styles.clinicalSteps}>
          <article><span>Valutazione</span><strong>Prima valutazione</strong><small>Quadro clinico registrato</small></article>
          <article className={styles.objective}><span>Obiettivo</span><strong>Comunicazione funzionale</strong><small>Attivo · aggiornato oggi</small><em>In corso</em></article>
          <article><span>Seduta</span><strong>Attività mirate</strong><small>Oggi · 45 minuti</small></article>
          <article><span>Follow-up</span><strong>Verifica del percorso</strong><small>Programmato</small></article>
        </div>
      </section>
      <section aria-hidden={active !== "laboratory"} className={`${styles.scene} ${styles.labScene} ${active === "laboratory" ? styles.sceneActive : ""}`}>
        <header><span>Laboratorio</span><strong>Scheda per Mario</strong><small>Pronta da usare</small></header>
        <div className={styles.sheetHeading}><span>Attività personalizzate</span><strong>Parole, suoni e lettura</strong></div>
        <div className={styles.exerciseDeck}>
          <article><i>01</i><b>casa</b><strong>Denominazione</strong><small>Immagini e parole</small></article>
          <article><i>02</i><b>p · b</b><strong>Coppie minime</strong><small>Ascolto e produzione</small></article>
          <article><i>03</i><b>Ab</b><strong>Lettura</strong><small>Frasi brevi</small></article>
        </div>
        <div className={styles.detachedHomework}><span>Compito a casa</span><strong>Continua con calma</strong><small>3 attività · scheda paziente</small></div>
      </section>
      <section aria-hidden={active !== "tools"} className={`${styles.scene} ${styles.toolsScene} ${active === "tools" ? styles.sceneActive : ""}`}>
        <header><span>Biblioteca clinica</span><strong>Strumenti selezionati</strong><small>Nel percorso, quando servono</small></header>
        <div className={styles.toolLibrary}>
          <article className={styles.toolOff}><span>Osservazione</span><strong>OFF</strong><small>Fonologia</small></article>
          <article className={styles.toolPlo}><span>Profilo</span><strong>PLO</strong><small>Linguaggio orale</small></article>
          <article className={styles.toolMot}><span>Originale ARMONIA</span><strong>MOT</strong><small>Monitoraggio obiettivi</small><em>Non standardizzato</em></article>
          <article className={styles.toolQab}><span>Integrato</span><strong>Italian QAB</strong><small>Valutazione dell’afasia</small><em>Apri strumento</em></article>
        </div>
      </section>
    </div>
    <div className={styles.contextChip} aria-hidden="true"><span>{active === "pathway" ? "Prossimo passo" : active === "laboratory" ? "Da condividere" : "Nel percorso"}</span><strong>{active === "pathway" ? "Seduta · martedì" : active === "laboratory" ? "Scheda pronta" : "Scelta professionale"}</strong></div>
  </div>;
}

function ProductStage() {
  const [active, setActive] = useState<SceneId>("pathway");
  const [reduced, setReduced] = useState(false);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const select = (index: number) => { const next = (index + SCENES.length) % SCENES.length; setActive(SCENES[next].id); refs.current[next]?.focus(); };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); select(index + 1); }
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); select(index - 1); }
    if (event.key === "Home") { event.preventDefault(); select(0); }
    if (event.key === "End") { event.preventDefault(); select(2); }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", String((event.clientX - box.left) / box.width - .5));
    event.currentTarget.style.setProperty("--y", String((event.clientY - box.top) / box.height - .5));
  };
  return <section id="funzioni" className={styles.productSection} aria-labelledby="product-title">
    <div className={styles.motifProduct} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="60vw" /></div>
    <div className={styles.productSticky}>
      <div className={styles.productCopy}>
        <p>Il prodotto cambia con il lavoro</p>
        <h2 id="product-title">Un unico spazio.<br /><em>Tre modi di usarlo.</em></h2>
        <div className={styles.sceneControls} role="tablist" aria-label="Aree del prodotto">
          {SCENES.map((scene, index) => <button key={scene.id} ref={(node) => { refs.current[index] = node; }} type="button" role="tab" aria-selected={active === scene.id} aria-controls={`v3-scene-${scene.id}`} tabIndex={active === scene.id ? 0 : -1} className={active === scene.id ? styles.controlActive : ""} onClick={() => setActive(scene.id)} onKeyDown={(event) => onKeyDown(event, index)}>
            <i aria-hidden="true">{active === scene.id ? "−" : "+"}</i><span><small>{scene.number}</small><strong>{scene.title}</strong>{active === scene.id && <em>{scene.copy}</em>}</span>
          </button>)}
        </div>
      </div>
      <div className={styles.productFrame} onPointerMove={onPointerMove} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--x", "0"); event.currentTarget.style.setProperty("--y", "0"); }} style={{ "--x": 0, "--y": 0 } as CSSProperties}>
        <ProductScene active={active} />
      </div>
    </div>
  </section>;
}

function Continuity() {
  const steps = [
    ["09:00", "Appuntamento", "Studio Centro"], ["45 min", "Seduta", "Attività registrate"], ["PDF", "Materiale", "Associato al paziente"], ["Casa", "Compito", "Scheda condivisa"], ["Attivo", "Percorso", "Tutto resta collegato"],
  ];
  return <section id="perche-armonia" className={styles.continuity} aria-labelledby="continuity-title">
    <div className={styles.continuityCopy}><p>Continuità, non frammenti</p><h2 id="continuity-title">Una seduta non è soltanto un appuntamento.</h2><span>Quello che accade prima, durante e dopo resta leggibile nel percorso del paziente.</span></div>
    <ol>{steps.map(([tag, title, description], index) => <li key={title}><i>{String(index + 1).padStart(2, "0")}</i><article><span>{tag}</span><strong>{title}</strong><small>{description}</small></article>{index < steps.length - 1 && <b aria-hidden="true">→</b>}</li>)}</ol>
  </section>;
}

function Materials() {
  return <section className={styles.materials} aria-labelledby="materials-title">
    <div className={styles.materialVisual} data-visual-slot="SLOT B — Material / lab visual">
      <div className={styles.assetCard}><span>Banca contenuti</span><strong>casa</strong><small>Immagine · denominazione</small></div>
      <div className={styles.worksheetPaper}><span>Scheda paziente</span><h3>Parole e immagini</h3><div><i>ca</i><i>sa</i><i>sole</i></div><small>Attività personalizzata</small></div>
      <div className={styles.handoutPaper}><span>Handout ARMONIA</span><strong>Esercizi a casa</strong><small>Indicazioni condivisibili</small></div>
      <div className={styles.provisionalLabel}>Visual provvisorio</div>
    </div>
    <div className={styles.materialCopy}><p>Oggetti di lavoro, non soltanto record</p><h2 id="materials-title">Dalla seduta a qualcosa che il paziente può portare con sé.</h2><span>Attività, worksheet e materiali restano disponibili nello stesso ambiente in cui nasce il lavoro clinico.</span><a href="#cta">Scopri il Laboratorio <b>↗</b></a></div>
  </section>;
}

function ProfessionalResources() {
  return <section className={styles.professional} aria-labelledby="professional-title">
    <div className={styles.professionalIntro}><p>Risorse professionali</p><h2 id="professional-title">Strumenti e documenti,<br />pronti quando servono.</h2></div>
    <div className={styles.professionalGrid}>
      <article className={styles.libraryFeature} data-visual-slot="SLOT C — Clinical tools visual"><div className={styles.miniLibrary} aria-hidden="true"><i>OFF</i><i>MOT</i><i>QAB</i></div><span>Strumenti clinici</span><strong>Una biblioteca professionale dentro il lavoro quotidiano.</strong><small>QAB integrato · strumenti originali ARMONIA chiaramente identificati</small></article>
      <article className={styles.documentsFeature}><div className={styles.paperStack} aria-hidden="true"><i /><i /><i /></div><span>Modulistica e handout</span><strong>Documenti professionali pronti quando servono.</strong><small>Attestazione di presenza · percorso · handout</small></article>
      <article className={styles.economyFeature}><div className={styles.economyRows} aria-hidden="true"><i /><i /><i /></div><span>Economia</span><strong>Prestazioni, pagamenti e proforma.</strong><small>La parte amministrativa rimane vicina, senza invadere il lavoro clinico.</small></article>
    </div>
  </section>;
}

function TrustAndCta() {
  return <>
    <section className={styles.trust} aria-labelledby="trust-title"><div><p>Affidabilità concreta</p><h2 id="trust-title">Il tuo spazio professionale,<br />costruito con attenzione.</h2></div><ul><li><i aria-hidden="true">✓</i><span><strong>Accesso autenticato</strong><small>Il lavoro è disponibile dopo l’accesso personale.</small></span></li><li><i aria-hidden="true">✓</i><span><strong>Dati separati</strong><small>Ogni professionista lavora nel proprio spazio.</small></span></li><li><i aria-hidden="true">✓</i><span><strong>File protetti</strong><small>I materiali professionali cloud non sono pubblici.</small></span></li><li><i aria-hidden="true">✓</i><span><strong>Esportazione dati</strong><small>È possibile preparare una copia dei propri dati.</small></span></li></ul></section>
    <section id="cta" className={styles.finalCta} aria-labelledby="cta-title"><div className={styles.ctaMark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="75vw" /></div><p>ARMONIA</p><h2 id="cta-title">Porta il lavoro clinico<br /><em>nello stesso spazio.</em></h2><div><Link href="/signup" className={styles.primaryCta}>Crea account</Link><Link href="/login" className={styles.secondaryCta}>Accedi</Link></div><span>Uno spazio professionale pensato per il lavoro reale del logopedista.</span></section>
  </>;
}

export function LandingLabV3() {
  const pageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const page = pageRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!page || media.matches) return;
    let frame = 0;
    const update = () => { frame = 0; page.style.setProperty("--hero-progress", String(Math.min(1, window.scrollY / Math.max(1, window.innerHeight * .8)))); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <main ref={pageRef} className={styles.page} style={{ "--hero-progress": 0 } as CSSProperties}>
    <header className={styles.header}><Link href="/landing-lab-v3" className={styles.brand}><Image src="/branding/logo-mark.svg" alt="" width={31} height={31} /><span>ARMONIA</span></Link><nav aria-label="Navigazione principale"><a href="#funzioni">Funzioni</a><a href="#perche-armonia">Perché ARMONIA</a></nav><div className={styles.headerActions}><Link href="/login">Accedi</Link><Link href="/signup">Crea account</Link></div></header>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroMark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="75vw" priority /></div>
      <div className={styles.heroCopy}><p>ARMONIA · Gestionale per logopedisti</p><h1 id="hero-title">Il lavoro clinico.<br /><em>Tutto nello stesso spazio.</em></h1><span>Percorso clinico, materiali, strumenti, sedute e organizzazione che restano collegati al lavoro reale.</span><div><Link href="/signup" className={styles.primaryCta}>Crea account</Link><Link href="/login" className={styles.secondaryCta}>Accedi</Link></div><a href="#funzioni" className={styles.discover}>Scopri ARMONIA <b aria-hidden="true">↓</b></a></div>
      <div className={styles.heroProduct} aria-hidden="true" data-visual-slot="SLOT A — Hero product render"><div className={styles.heroShell}><i /><i /><i /><div><span /><span /><span /></div></div><div className={styles.heroGoal}><span>Obiettivo attivo</span><strong>Comunicazione funzionale</strong><small>Aggiornato oggi</small></div><div className={styles.heroDocument}><span>Scheda paziente</span><strong>Attività personalizzate</strong><i /><i /><i /></div></div>
    </section>
    <ProductStage />
    <Continuity />
    <Materials />
    <ProfessionalResources />
    <TrustAndCta />
    <footer className={styles.footer}><Link href="/landing-lab-v3" className={styles.brand}><Image src="/branding/logo-mark.svg" alt="" width={26} height={26} /><span>ARMONIA</span></Link><nav aria-label="Navigazione footer"><Link href="/privacy">Privacy</Link><Link href="/about">Chi siamo</Link><Link href="/login">Accedi</Link><Link href="/signup">Crea account</Link></nav></footer>
  </main>;
}
