import Image from "next/image";
import type { ClinicalValue, LanguageCommunicationAssessmentV1 } from "@/lib/clinical/assessment-v1";
import { assessmentPrintVisibility, formatClinicalValue, hasPrintableValue, printableLines, printableList, printableTestHasContent, readableClinicalLabel } from "@/lib/clinical/print-format";
import type { ClinicalAssessment } from "@/lib/clinical/types";
import type { Profile } from "@/lib/types";

type SummaryProps = { patientName: string; assessment: ClinicalAssessment; pathwayTitle?: string; professional?: Profile; logoSrc?: string };
const formatDate = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "Non indicata";

function monthsValue(value?: ClinicalValue<number>) {
  if (!value) return undefined;
  if (value.availability === "not_available") return "Non disponibile";
  if (value.availability === "not_applicable") return "Non applicabile";
  const base = hasPrintableValue(value.value) ? `${value.value} mesi` : undefined;
  const note = value.note?.trim();
  return note ? (base ? `${base} — ${note}` : note) : base;
}

function TextValue({ value }: { value: string | number }) {
  if (typeof value !== "string") return <>{value}</>;
  const lines = printableLines(value);
  if (lines.length <= 1) return <>{lines[0] || value}</>;
  return <span className="assessment-print-lines">{lines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</span>;
}

function Field({ label, value, list, emphasis = false }: { label: string; value?: string | number; list?: string[]; emphasis?: boolean }) {
  const items = printableList(list);
  if (!hasPrintableValue(value) && items.length === 0) return null;
  return <div className={`assessment-print-field${emphasis ? " assessment-print-field-emphasis" : ""}`}><dt>{label}</dt><dd>{items.length > 0 ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <TextValue value={value!} />}</dd></div>;
}

function Section({ number, title, children, visible }: { number: string; title: string; children: React.ReactNode; visible: boolean }) {
  if (!visible) return null;
  return <section className="assessment-print-section"><div className="assessment-print-section-title"><span>{number}</span><h2>{title}</h2></div><dl>{children}</dl></section>;
}

export function AssessmentSummary({ patientName, assessment, pathwayTitle, professional, logoSrc = "/branding/logo-mark.svg" }: SummaryProps) {
  const data: LanguageCommunicationAssessmentV1 = assessment.data;
  const access = data.accessReason || {}, anamnesis = data.anamnesis || {}, observation = data.observation || {}, tests = data.tests || {}, summary = data.summary || {}, goals = data.goals || {};
  const professionalName = [professional?.firstName, professional?.lastName].filter(Boolean).join(" ");
  const visible = assessmentPrintVisibility(data);
  const generatedOn = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

  return <article className="assessment-print-summary" aria-label="Riepilogo stampabile della valutazione">
    <header className="assessment-print-header">
      <div className="assessment-print-identity"><div className="assessment-print-logo">{logoSrc ? <Image src={logoSrc} alt="" width={190} height={68} priority unoptimized /> : <span aria-hidden="true">A</span>}</div><div><p className="assessment-print-professional">{professionalName || "Armonia"}</p>{professional?.profession?.trim() && <p>{professional.profession}</p>}{professional?.studio?.trim() && <p>{professional.studio}</p>}</div><p className="assessment-print-brand">ARMONIA</p></div>
      <div className="assessment-print-title-block"><p className="assessment-print-kicker">{pathwayTitle?.trim() || "Percorso clinico"}</p><h1>Prima valutazione</h1><p>Linguaggio e comunicazione</p></div>
      <div className="assessment-print-patient-card"><div><span>Paziente</span><strong>{patientName}</strong></div><div><span>Data clinica</span><strong>{formatDate(assessment.clinicalDate)}</strong></div></div>
    </header>

    <Section number="01" title="Motivo dell’accesso" visible={visible.access}><Field label="Motivazioni riferite" list={access.concerns} /><Field label="Chi richiede o invia" value={formatClinicalValue(access.reportedBy)} /><Field label="Descrizione" value={access.description} emphasis /><Field label="Note" value={access.notes} /></Section>
    <Section number="02" title="Anamnesi" visible={visible.anamnesis}>
      <Field label="Gravidanza e parto" value={formatClinicalValue(anamnesis.pregnancyBirth)} /><Field label="Sviluppo motorio" value={formatClinicalValue(anamnesis.motorDevelopment)} /><Field label="Prime parole" value={monthsValue(anamnesis.firstWordsMonths)} /><Field label="Prime combinazioni" value={monthsValue(anamnesis.firstCombinationsMonths)} /><Field label="Udito" value={formatClinicalValue(anamnesis.hearing)} /><Field label="Scolarizzazione" value={anamnesis.educational} /><Field label="Lingue parlate in famiglia" list={anamnesis.languages} /><Field label="Altri professionisti coinvolti" list={anamnesis.professionals} /><Field label="Aree non disponibili" list={anamnesis.unavailableAreas} /><Field label="Anamnesi generale" value={anamnesis.general} /><Field label="Sviluppo" value={anamnesis.developmental} /><Field label="Aspetti medici" value={anamnesis.medical} /><Field label="Contesto familiare" value={anamnesis.family} /><Field label="Note" value={anamnesis.notes} />
    </Section>
    <Section number="03" title="Osservazione" visible={visible.observation}>
      <Field label="Comunicazione" value={formatClinicalValue(observation.communication, "Non valutata")} /><Field label="Intenzionalità comunicativa" value={formatClinicalValue(observation.communicativeIntent, "Non valutata")} /><Field label="Comprensione" value={formatClinicalValue(observation.comprehensionProfile, "Non valutata")} /><Field label="Produzione" value={formatClinicalValue(observation.production, "Non valutata")} /><Field label="Intelligibilità" value={formatClinicalValue(observation.intelligibility, "Non valutabile")} /><Field label="Lessico" value={formatClinicalValue(observation.vocabulary, "Non valutato")} /><Field label="Morfosintassi" value={formatClinicalValue(observation.morphosyntax, "Non valutata")} /><Field label="Pragmatica" value={formatClinicalValue(observation.pragmatics, "Non valutata")} /><Field label="Contesto" value={observation.context} /><Field label="Profilo comunicativo" value={observation.communicationProfile} /><Field label="Comprensione — note" value={observation.comprehension} /><Field label="Espressione" value={observation.expression} /><Field label="Interazione" value={observation.interaction} /><Field label="Eloquio" value={observation.speech} /><Field label="Elementi osservati" list={observation.observedFeatures?.map((item) => item.label?.trim() || readableClinicalLabel(item.code))} /><Field label="Note" value={observation.notes} />
    </Section>
    <Section number="04" title="Test e strumenti" visible={visible.tests}>
      {tests.notAdministered && <Field label="Somministrazione" value="Test non somministrati" />}
      {tests.items?.map((test, index) => printableTestHasContent(test) ? <div className="assessment-print-test" key={test.id}><div className="assessment-print-test-heading"><span>{String(index + 1).padStart(2, "0")}</span><h3>{test.name?.trim() || `Test ${index + 1}`}</h3></div><dl><Field label="Area" value={test.area} /><Field label="Data" value={test.date ? formatDate(test.date) : undefined} /><Field label="Punteggio grezzo" value={test.rawScore} /><Field label="Punteggio standardizzato" value={test.standardizedScore} /><Field label="Percentile" value={test.percentile} /><Field label="Note" value={test.notes} /></dl></div> : null)}
      <Field label="Note generali" value={tests.notes} />
    </Section>
    <Section number="05" title="Sintesi clinica" visible={visible.summary}><Field label="Sintesi" value={summary.clinicalSummary} emphasis /><Field label="Punti di forza" list={summary.strengths} /><Field label="Difficoltà" list={summary.difficulties} /><Field label="Conclusioni" value={summary.conclusions} emphasis /><Field label="Raccomandazioni" value={summary.recommendations} /><Field label="Note" value={summary.notes} /></Section>
    <Section number="06" title="Obiettivi e pianificazione" visible={visible.goals}><Field label="Note di pianificazione" value={goals.planningNotes} emphasis /></Section>
    <footer className="assessment-print-footer"><p>Documento generato con Armonia il {generatedOn}</p><p>Valutazione clinica · {patientName}</p></footer>
  </article>;
}
