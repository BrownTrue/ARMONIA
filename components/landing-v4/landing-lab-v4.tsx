"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { LandingLabV3 } from "@/components/landing-v3/landing-lab-v3";
import styles from "./landing-lab-v4.module.css";

export const PRICING_CONFIG = {
  monthlyPrice: 15,
  annualPrice: 120,
  pricingStatus: "prototype",
} as const;

const PLAN_FEATURES = ["Pazienti e percorso clinico", "Agenda e sedute", "Laboratorio e strumenti clinici", "Modulistica, economia ed export dati"];

function CommercialHeader() {
  return <header className={styles.header}>
    <Link href="/landing-lab-v4" className={styles.brand}><Image src="/branding/logo-mark.svg" alt="" width={31} height={31} /><span>ARMONIA</span></Link>
    <nav aria-label="Navigazione principale"><a href="#prodotto">Prodotto</a><a href="#perche-armonia">Perché ARMONIA</a><a href="#prezzi">Prezzi</a><a href="#supporto">Supporto</a></nav>
    <div className={styles.headerActions}><Link href="/login">Accedi</Link><Link href="/signup">Crea account</Link></div>
  </header>;
}

function DailyOrganization() {
  return <section className={styles.organization} aria-labelledby="organization-title">
    <div className={styles.organizationCopy}><p>Organizzazione quotidiana</p><h2 id="organization-title">Dall’appuntamento alla seduta,<br /><em>senza perdere il filo.</em></h2><span>Pazienti, sedi e prestazioni accompagnano il lavoro; il percorso conserva ciò che conta dopo l’agenda.</span></div>
    <div className={styles.organizationVisual} data-provisional-visual="agenda">
      <span className={styles.provisional}>Visual Agenda provvisorio</span>
      <article className={styles.patientCard}><i>MR</i><span>Paziente</span><strong>Mario Rossi</strong><small>Percorso attivo</small></article>
      <b aria-hidden="true">→</b>
      <article className={styles.appointmentCard}><span>Appuntamento</span><strong>Martedì · 09:00</strong><small>Studio Centro</small></article>
      <b aria-hidden="true">→</b>
      <article className={styles.sessionCard}><span>Seduta</span><strong>45 minuti</strong><small>Prestazione registrata</small></article>
      <b aria-hidden="true">→</b>
      <article className={styles.pathCard}><span>Percorso</span><strong>Attività collegate</strong><small>Continuità clinica</small></article>
    </div>
  </section>;
}

function SpecialistIdentity() {
  return <section className={styles.identity} aria-labelledby="identity-title">
    <div className={styles.identityMark} aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="65vw" /></div>
    <p>Costruita intorno alla pratica</p>
    <h2 id="identity-title">Pensata intorno al lavoro<br /><em>del logopedista.</em></h2>
    <div className={styles.clinicalWords} aria-label="Ambiti del lavoro logopedico"><span>Anamnesi</span><span>Valutazione</span><span>Obiettivi terapeutici</span><span>Fonetico-fonologico</span><span>CAA</span><span>Caregiver</span><span>Deglutizione e alimentazione</span><span>Follow-up</span></div>
    <strong>Non un insieme di moduli generici: uno spazio che usa il linguaggio del lavoro clinico.</strong>
  </section>;
}

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [centerNotice, setCenterNotice] = useState(false);
  const price = billing === "monthly" ? PRICING_CONFIG.monthlyPrice : PRICING_CONFIG.annualPrice;
  return <section id="prezzi" className={styles.pricing} aria-labelledby="pricing-title">
    <div className={styles.pricingIntro}><p>Pricing lab</p><h2 id="pricing-title">Un piano chiaro,<br />pensato per iniziare.</h2><span>Questa sezione serve a valutare struttura e posizionamento commerciale. Il prezzo non è ancora operativo.</span></div>
    <div className={styles.billingToggle} role="group" aria-label="Periodo del prezzo"><button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Mensile</button><button type="button" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>Annuale</button></div>
    <div className={styles.priceGrid}>
      <article className={styles.mainPlan}>
        <div><span>ARMONIA Professionista</span><em>Prezzo provvisorio</em></div><p>Per il logopedista libero professionista.</p>
        <strong className={styles.price}><small>€</small>{price}<em>/ {billing === "monthly" ? "mese" : "anno"}</em></strong>
        <ul>{PLAN_FEATURES.map((feature) => <li key={feature}><i aria-hidden="true">✓</i>{feature}</li>)}</ul>
        <Link href="/signup">Crea account</Link><small>Nessun checkout o abbonamento è collegato in questo prototipo.</small>
      </article>
      <article className={styles.centersPlan}>
        <div><span>Studi e centri</span><em>Prossimamente</em></div><h3>Per realtà con più professionisti.</h3><p>Le funzioni dedicate sono in preparazione. Non sono ancora promessi ruoli, équipe o amministrazione del centro.</p>
        <button type="button" onClick={() => setCenterNotice(true)}>Avvisami</button>
        {centerNotice && <p role="status" className={styles.demoNotice}>Richiesta non collegata: funzione dimostrativa del lab.</p>}
      </article>
    </div>
    <aside><span>Accesso iniziale</span><strong>ARMONIA è in una fase di accesso iniziale dedicata ai liberi professionisti.</strong><small>Modalità e disponibilità definitive saranno comunicate prima del lancio.</small></aside>
  </section>;
}

function ContactSupport() {
  const [status, setStatus] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setStatus("Modulo non ancora collegato"); };
  return <section id="supporto" className={styles.support} aria-labelledby="support-title">
    <div className={styles.supportCopy}><p>Parla con noi</p><h2 id="support-title">Domande sul prodotto?<br />Iniziamo da qui.</h2><span>Il canale di supporto definitivo non è ancora attivo.</span><dl><div><dt>supporto@conarmonia.it</dt><dd>indirizzo previsto · non ancora operativo</dd></div><div><dt>ciao@conarmonia.it</dt><dd>indirizzo previsto · non ancora operativo</dd></div></dl></div>
    <form onSubmit={submit} aria-describedby={status ? "contact-demo-status" : undefined}>
      <div><label htmlFor="v4-name">Nome</label><input id="v4-name" name="name" autoComplete="name" required /></div>
      <div><label htmlFor="v4-email">Email</label><input id="v4-email" name="email" type="email" autoComplete="email" required /></div>
      <div className={styles.fullField}><label htmlFor="v4-reason">Motivo</label><select id="v4-reason" name="reason" defaultValue=""><option value="" disabled>Seleziona</option><option>Informazioni sul prodotto</option><option>Accesso iniziale</option><option>Supporto</option></select></div>
      <div className={styles.fullField}><label htmlFor="v4-message">Messaggio</label><textarea id="v4-message" name="message" rows={5} required /></div>
      <button type="submit">Invia messaggio</button>
      {status && <p id="contact-demo-status" role="status">{status}. Nessun dato è stato inviato.</p>}
    </form>
  </section>;
}

const FAQ = [
  ["A chi è rivolta ARMONIA?", "Ai logopedisti che desiderano riunire organizzazione, percorso clinico, materiali e attività professionale nello stesso spazio."],
  ["Posso usarla come libero professionista?", "Sì. L’esperienza attuale è progettata principalmente per il lavoro del libero professionista."],
  ["È prevista una versione per studi e centri?", "È un’area in preparazione. Le funzioni multi-professionista non sono ancora disponibili né definite."],
  ["I miei dati possono essere esportati?", "Sì. ARMONIA include una funzione di esportazione dei dati dell’utente."],
  ["Posso accedere da più dispositivi?", "In modalità cloud l’accesso avviene tramite il proprio account autenticato. La continuità effettiva dipende dalla connessione e dalla sessione attiva."],
] as const;

function Faq() {
  return <section className={styles.faq} aria-labelledby="faq-title"><div><p>Domande essenziali</p><h2 id="faq-title">Prima di iniziare.</h2></div><div className={styles.faqList}>{FAQ.map(([question, answer]) => <details key={question}><summary>{question}<i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div></section>;
}

function TrustFinalFooter() {
  const trust = [["Accesso autenticato", "Il lavoro è disponibile dopo l’accesso personale."], ["Dati separati", "Ogni professionista lavora nel proprio spazio."], ["File protetti", "I materiali professionali cloud non sono pubblici."], ["Esportazione dati", "È possibile preparare una copia dei propri dati."]];
  return <>
    <section className={styles.trust} aria-labelledby="trust-title"><div><p>Affidabilità concreta</p><h2 id="trust-title">Il tuo spazio professionale,<br />costruito con attenzione.</h2></div><ul>{trust.map(([title, copy]) => <li key={title}><i aria-hidden="true">✓</i><span><strong>{title}</strong><small>{copy}</small></span></li>)}</ul></section>
    <section className={styles.finalCta} aria-labelledby="final-title"><div aria-hidden="true"><Image src="/branding/logo-mark.svg" alt="" fill sizes="75vw" /></div><p>ARMONIA</p><h2 id="final-title">Porta il lavoro clinico<br /><em>nello stesso spazio.</em></h2><nav><Link href="/signup">Crea account</Link><a href="#supporto">Parla con noi</a></nav></section>
    <footer className={styles.footer}><Link href="/landing-lab-v4" className={styles.brand}><Image src="/branding/logo-mark.svg" alt="" width={27} height={27} /><span>ARMONIA</span></Link><nav aria-label="Navigazione footer"><a href="#prodotto">Prodotto</a><a href="#prezzi">Prezzi</a><a href="#supporto">Supporto</a><Link href="/privacy">Privacy</Link><Link href="/about">Chi siamo</Link><Link href="/login">Accedi</Link></nav></footer>
  </>;
}

export function LandingLabV4() {
  return <div className={styles.page}>
    <CommercialHeader />
    <div id="prodotto" className={styles.v3Core}><LandingLabV3 /></div>
    <DailyOrganization />
    <SpecialistIdentity />
    <Pricing />
    <ContactSupport />
    <Faq />
    <TrustFinalFooter />
  </div>;
}
