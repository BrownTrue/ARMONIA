import Image from "next/image";
import type { ClinicalAssessmentV2 } from "@/lib/clinical/types";
import { clinicalAssessmentTypeLabel } from "@/lib/clinical/assessment-v2";
import { getClinicalModuleDefinition, toClinicalAssessmentV2PrintSections, type ClinicalPrintField } from "@/lib/clinical/module-registry";
import type { Goal, Profile } from "@/lib/types";

type Props = { patientName: string; assessment: ClinicalAssessmentV2; pathwayTitle?: string; professional?: Profile; logoSrc?: string; goals?: Goal[] };
const formatDate = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "Non indicata";

function Field({ field }: { field: ClinicalPrintField }) { const values = Array.isArray(field.value) ? field.value.filter(Boolean) : []; if (!field.value || (Array.isArray(field.value) && !values.length)) return null; return <div className="assessment-print-field"><dt>{field.label}</dt><dd>{values.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : field.value}</dd></div>; }
function Section({ number, title, fields }: { number: string; title: string; fields: ClinicalPrintField[] }) { if (!fields.length) return null; return <section className="assessment-print-section"><div className="assessment-print-section-title"><span>{number}</span><h2>{title}</h2></div><dl>{fields.map((field, index) => <Field key={`${field.label}-${index}`} field={field} />)}</dl></section>; }

export function AssessmentSummaryV2({ patientName, assessment, pathwayTitle, professional, logoSrc = "/branding/logo-mark.svg", goals = [] }: Props) {
  const all = toClinicalAssessmentV2PrintSections(assessment.data);
  const common = (code: string) => all.find((section) => section.code === code)?.fields || [];
  const moduleSections = assessment.data.modules.map((module) => { const definition = getClinicalModuleDefinition(module.code, module.version); return definition && definition.validate(module.data) ? { label: definition.label, sections: definition.toPrintSections(module.data as never) } : undefined; }).filter(Boolean) as { label: string; sections: { code: string; title: string; fields: ClinicalPrintField[] }[] }[];
  const areaHasContent = moduleSections.some((module) => module.sections.length);
  const planningFields = [...common("planning"), ...(goals.length ? [{ label: "Obiettivi del percorso", value: goals.map((goal) => `${goal.title} · ${goal.progress}%`) }] : [])];
  const professionalName = [professional?.firstName, professional?.lastName].filter(Boolean).join(" ");
  const generatedOn = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  return <article className="assessment-print-summary" aria-label="Riepilogo stampabile della valutazione">
    <header className="assessment-print-header"><div className="assessment-print-identity"><div className="assessment-print-logo">{logoSrc ? <Image src={logoSrc} alt="" width={190} height={68} priority unoptimized /> : <span aria-hidden="true">A</span>}</div><div><p className="assessment-print-professional">{professionalName || "Armonia"}</p>{professional?.profession?.trim() && <p>{professional.profession}</p>}{professional?.studio?.trim() && <p>{professional.studio}</p>}</div><p className="assessment-print-brand">ARMONIA</p></div><div className="assessment-print-title-block"><p className="assessment-print-kicker">{pathwayTitle?.trim() || "Percorso clinico"}</p><h1>{clinicalAssessmentTypeLabel(assessment.assessmentType)}</h1><p>Valutazione clinica</p></div><div className="assessment-print-patient-card"><div><span>Paziente</span><strong>{patientName}</strong></div><div><span>Data clinica</span><strong>{formatDate(assessment.clinicalDate)}</strong></div></div></header>
    <Section number="01" title="Motivo dell’accesso" fields={common("access_reason")} />
    <Section number="02" title="Anamnesi" fields={common("anamnesis")} />
    {areaHasContent && <section className="assessment-print-section"><div className="assessment-print-section-title"><span>03</span><h2>Aree cliniche</h2></div>{moduleSections.map((module, moduleIndex) => module.sections.length ? <div className="assessment-print-test" key={module.label}><div className="assessment-print-test-heading"><span>{`3.${moduleIndex + 1}`}</span><h3>{module.label}</h3></div>{module.sections.map((section) => <div key={section.code}><h3>{section.title}</h3><dl>{section.fields.map((field, index) => <Field key={`${field.label}-${index}`} field={field} />)}</dl></div>)}</div> : null)}</section>}
    <Section number="04" title="Test / strumenti" fields={common("tests")} />
    <Section number="05" title="Sintesi" fields={common("summary")} />
    <Section number="06" title="Obiettivi / pianificazione" fields={planningFields} />
    <footer className="assessment-print-footer"><p>Documento generato con Armonia il {generatedOn}</p><p>{clinicalAssessmentTypeLabel(assessment.assessmentType)} · {patientName}</p></footer>
  </article>;
}
