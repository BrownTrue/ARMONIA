import Image from "next/image";
import type { AssessmentPrintField, AssessmentPrintModel } from "@/lib/clinical/assessment-print-model";
import { printableLines } from "@/lib/clinical/print-format";

export function AssessmentPrintDocument({ model }: { model: AssessmentPrintModel }) {
  return <article className="assessment-print-summary" aria-label="Riepilogo stampabile della valutazione">
    <header className="assessment-print-header">
      <div className="assessment-print-identity"><div className="assessment-print-logo">{model.logoSrc ? <Image src={model.logoSrc} alt="" width={190} height={68} priority unoptimized /> : <span aria-hidden="true">A</span>}</div><div><p className="assessment-print-professional">{model.professionalName}</p>{model.profession && <p>{model.profession}</p>}{model.studio && <p>{model.studio}</p>}</div><p className="assessment-print-brand">ARMONIA</p></div>
      <div className="assessment-print-title-block"><p className="assessment-print-kicker">{model.pathwayTitle}</p><h1>{model.title}</h1><p>{model.subtitle}</p></div>
      <div className="assessment-print-patient-card"><div><span>Paziente</span><strong>{model.patientName}</strong></div><div><span>Data clinica</span><strong>{model.clinicalDate}</strong></div></div>
    </header>
    {model.sections.map((section) => <section className="assessment-print-section" key={section.code}>
      <div className="assessment-print-section-title"><span>{section.number}</span><h2>{section.title}</h2></div>
      {section.fields.length > 0 && <dl>{section.fields.map((field, index) => <Field key={`${field.label}-${index}`} field={field} />)}</dl>}
      {section.groups.map((group) => <div className="assessment-print-test" key={group.code}>
        <div className="assessment-print-test-heading">{group.number && <span>{group.number}</span>}<h3>{group.title}</h3></div>
        {group.sections.map((subsection) => <div key={subsection.code}>{subsection.title && <h3>{subsection.title}</h3>}<dl>{subsection.fields.map((field, index) => <Field key={`${field.label}-${index}`} field={field} />)}</dl></div>)}
      </div>)}
    </section>)}
    <footer className="assessment-print-footer"><p>Documento generato con Armonia il {model.generatedOn}</p><p>{model.footerLabel}</p></footer>
  </article>;
}

function Field({ field }: { field: AssessmentPrintField }) {
  const values = Array.isArray(field.value) ? field.value : [];
  return <div className={`assessment-print-field${field.emphasis ? " assessment-print-field-emphasis" : ""}`}><dt>{field.label}</dt><dd>{values.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : <TextValue value={field.value as string} />}</dd></div>;
}

function TextValue({ value }: { value: string }) {
  const lines = printableLines(value);
  if (lines.length <= 1) return <>{lines[0] || value}</>;
  return <span className="assessment-print-lines">{lines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</span>;
}
