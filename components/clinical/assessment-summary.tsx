import type { ClinicalValue, LanguageCommunicationAssessmentV1 } from "@/lib/clinical/assessment-v1";
import type { ClinicalAssessment } from "@/lib/clinical/types";

type SummaryProps = {
  patientName: string;
  assessment: ClinicalAssessment;
};

const LABELS: Record<string, string> = {
  family: "Famiglia", pediatrician: "Pediatra", neuropsychiatry: "Neuropsichiatria", school: "Scuola",
  other_professional: "Altro professionista", other: "Altro", expressive_difficulty: "Difficoltà espressive",
  comprehension_difficulty: "Difficoltà di comprensione", low_intelligibility: "Linguaggio poco intelligibile",
  late_language_emergence: "Ritardo nell’emergere del linguaggio", communication_difficulty: "Difficoltà comunicative",
  school_referral: "Segnalazione scolastica", professional_referral: "Invio da altro professionista", review: "Controllo / rivalutazione",
  typical: "Nella norma", relevant: "Elementi rilevanti", reported_delay: "Ritardo riferito", investigate: "Da approfondire",
  no_reported_difficulty: "Nessuna difficoltà riferita", recurrent_otitis: "Otiti ricorrenti",
  audiology_assessments: "Accertamenti audiologici", reported_difficulty: "Difficoltà riferite",
  adequate: "Adeguata", partly_adequate: "Parzialmente adeguata", difficulty_observed: "Difficoltà osservate",
  present: "Presente", inconsistent: "Discontinua", reduced: "Ridotta", mild_difficulty: "Lieve difficoltà",
  significant_difficulty: "Difficoltà significativa", vocalizations: "Vocalizzazioni", single_word: "Parola singola",
  combinations: "Combinazioni", simple_sentence: "Frase semplice", complex_sentence: "Frase complessa",
  spontaneous_language: "Linguaggio spontaneo", good: "Buona", fair: "Discreta", severely_reduced: "Fortemente ridotta",
  difficulty: "Difficoltà",
};

const present = (value?: string | number | null) => value !== undefined && value !== null && String(value).trim() !== "";
const humanize = (value: string) => LABELS[value] || `${value.charAt(0).toUpperCase()}${value.slice(1).replaceAll("_", " ")}`;
const formatDate = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "Non indicata";

function clinicalValue(value?: ClinicalValue<string | number | string[]>, unavailable = "Non disponibile") {
  if (!value) return undefined;
  if (value.availability === "not_available") return unavailable;
  if (value.availability === "not_applicable") return "Non applicabile";
  const raw = value.value;
  const formatted = Array.isArray(raw) ? raw.map(humanize).join(", ") : typeof raw === "string" ? humanize(raw) : raw;
  const base = present(formatted) ? String(formatted) : undefined;
  if (value.note?.trim()) return base ? `${base} — ${value.note.trim()}` : value.note.trim();
  return base;
}

function monthsValue(value?: ClinicalValue<number>) {
  if (!value) return undefined;
  if (value.availability === "not_available") return "Non disponibile";
  if (value.availability === "not_applicable") return "Non applicabile";
  const base = present(value.value) ? `${value.value} mesi` : undefined;
  if (value.note?.trim()) return base ? `${base} — ${value.note.trim()}` : value.note.trim();
  return base;
}

function Field({ label, value, list }: { label: string; value?: string | number; list?: string[] }) {
  if (!present(value) && !list?.length) return null;
  return <div className="assessment-print-field"><dt>{label}</dt><dd>{list?.length ? <ul>{list.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : value}</dd></div>;
}

function Section({ title, children, visible }: { title: string; children: React.ReactNode; visible: boolean }) {
  if (!visible) return null;
  return <section className="assessment-print-section"><h2>{title}</h2><dl>{children}</dl></section>;
}

function hasClinicalValue(value?: ClinicalValue<unknown>) {
  return Boolean(value && (value.availability || value.note?.trim() || (Array.isArray(value.value) ? value.value.length : present(value.value as string | number | undefined))));
}

export function AssessmentSummary({ patientName, assessment }: SummaryProps) {
  const data: LanguageCommunicationAssessmentV1 = assessment.data;
  const access = data.accessReason || {};
  const anamnesis = data.anamnesis || {};
  const observation = data.observation || {};
  const tests = data.tests || {};
  const summary = data.summary || {};
  const goals = data.goals || {};
  const accessVisible = Boolean(access.concerns?.length || hasClinicalValue(access.reportedBy) || access.description?.trim() || access.notes?.trim());
  const anamnesisVisible = Boolean(hasClinicalValue(anamnesis.pregnancyBirth) || hasClinicalValue(anamnesis.motorDevelopment) || hasClinicalValue(anamnesis.firstWordsMonths) || hasClinicalValue(anamnesis.firstCombinationsMonths) || hasClinicalValue(anamnesis.hearing) || anamnesis.educational?.trim() || anamnesis.languages?.length || anamnesis.professionals?.length || anamnesis.general?.trim() || anamnesis.developmental?.trim() || anamnesis.medical?.trim() || anamnesis.family?.trim() || anamnesis.notes?.trim());
  const observationVisible = Boolean(hasClinicalValue(observation.communication) || hasClinicalValue(observation.communicativeIntent) || hasClinicalValue(observation.comprehensionProfile) || hasClinicalValue(observation.production) || hasClinicalValue(observation.intelligibility) || hasClinicalValue(observation.vocabulary) || hasClinicalValue(observation.morphosyntax) || hasClinicalValue(observation.pragmatics) || observation.context?.trim() || observation.communicationProfile?.trim() || observation.comprehension?.trim() || observation.expression?.trim() || observation.interaction?.trim() || observation.speech?.trim() || observation.observedFeatures?.length || observation.notes?.trim());
  const testsVisible = Boolean(tests.notAdministered || tests.items?.length || tests.notes?.trim());
  const summaryVisible = Boolean(summary.clinicalSummary?.trim() || summary.strengths?.length || summary.difficulties?.length || summary.conclusions?.trim() || summary.recommendations?.trim() || summary.notes?.trim());

  return <article className="assessment-print-summary" aria-label="Riepilogo stampabile della valutazione">
    <header className="assessment-print-header"><p className="assessment-print-brand">ARMONIA</p><h1>Prima valutazione</h1><p>Linguaggio e comunicazione</p><div><strong>{patientName}</strong><span>Data clinica: {formatDate(assessment.clinicalDate)}</span></div></header>

    <Section title="Motivo dell’accesso" visible={accessVisible}>
      <Field label="Motivazioni riferite" list={access.concerns?.map(humanize)} />
      <Field label="Chi richiede o invia" value={clinicalValue(access.reportedBy)} />
      <Field label="Descrizione" value={access.description} /><Field label="Note" value={access.notes} />
    </Section>

    <Section title="Anamnesi" visible={anamnesisVisible}>
      <Field label="Gravidanza e parto" value={clinicalValue(anamnesis.pregnancyBirth)} />
      <Field label="Sviluppo motorio" value={clinicalValue(anamnesis.motorDevelopment)} />
      <Field label="Prime parole" value={monthsValue(anamnesis.firstWordsMonths)} />
      <Field label="Prime combinazioni" value={monthsValue(anamnesis.firstCombinationsMonths)} />
      <Field label="Udito" value={clinicalValue(anamnesis.hearing)} /><Field label="Scolarizzazione" value={anamnesis.educational} />
      <Field label="Lingue parlate in famiglia" list={anamnesis.languages} /><Field label="Altri professionisti coinvolti" list={anamnesis.professionals} />
      <Field label="Anamnesi generale" value={anamnesis.general} /><Field label="Sviluppo" value={anamnesis.developmental} />
      <Field label="Aspetti medici" value={anamnesis.medical} /><Field label="Contesto familiare" value={anamnesis.family} /><Field label="Note" value={anamnesis.notes} />
    </Section>

    <Section title="Osservazione" visible={observationVisible}>
      <Field label="Comunicazione" value={clinicalValue(observation.communication, "Non valutata")} />
      <Field label="Intenzionalità comunicativa" value={clinicalValue(observation.communicativeIntent, "Non valutata")} />
      <Field label="Comprensione" value={clinicalValue(observation.comprehensionProfile, "Non valutata")} />
      <Field label="Produzione" value={clinicalValue(observation.production, "Non valutata")} />
      <Field label="Intelligibilità" value={clinicalValue(observation.intelligibility, "Non valutabile")} />
      <Field label="Lessico" value={clinicalValue(observation.vocabulary, "Non valutato")} />
      <Field label="Morfosintassi" value={clinicalValue(observation.morphosyntax, "Non valutata")} />
      <Field label="Pragmatica" value={clinicalValue(observation.pragmatics, "Non valutata")} />
      <Field label="Contesto" value={observation.context} /><Field label="Profilo comunicativo" value={observation.communicationProfile} />
      <Field label="Comprensione — note" value={observation.comprehension} /><Field label="Espressione" value={observation.expression} />
      <Field label="Interazione" value={observation.interaction} /><Field label="Eloquio" value={observation.speech} />
      <Field label="Elementi osservati" list={observation.observedFeatures?.map((item) => item.label || humanize(item.code))} /><Field label="Note" value={observation.notes} />
    </Section>

    <Section title="Test e strumenti" visible={testsVisible}>
      {tests.notAdministered && <Field label="Somministrazione" value="Test non somministrati" />}
      {tests.items?.map((test, index) => <div className="assessment-print-test" key={test.id}><h3>{test.name?.trim() || `Test ${index + 1}`}</h3><dl><Field label="Area" value={test.area} /><Field label="Data" value={test.date ? formatDate(test.date) : undefined} /><Field label="Punteggio grezzo" value={test.rawScore} /><Field label="Punteggio standardizzato" value={test.standardizedScore} /><Field label="Percentile" value={test.percentile} /><Field label="Note" value={test.notes} /></dl></div>)}
      <Field label="Note generali" value={tests.notes} />
    </Section>

    <Section title="Sintesi" visible={summaryVisible}>
      <Field label="Sintesi clinica" value={summary.clinicalSummary} /><Field label="Punti di forza" list={summary.strengths} />
      <Field label="Difficoltà" list={summary.difficulties} /><Field label="Conclusioni" value={summary.conclusions} />
      <Field label="Raccomandazioni" value={summary.recommendations} /><Field label="Note" value={summary.notes} />
    </Section>
    <Section title="Obiettivi e pianificazione" visible={Boolean(goals.planningNotes?.trim())}><Field label="Note di pianificazione" value={goals.planningNotes} /></Section>
  </article>;
}
