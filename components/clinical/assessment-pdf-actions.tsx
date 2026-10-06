"use client";

import { useMemo } from "react";
import { GeneratedPdfActions } from "@/components/documents/generated-pdf-actions";
import { assessmentPdfFileName, resolveAssessmentPdfLogo } from "@/lib/clinical/assessment-pdf";
import { buildAssessmentPrintModel } from "@/lib/clinical/assessment-print-model";
import type { ClinicalAssessment } from "@/lib/clinical/types";
import type { Goal, Profile } from "@/lib/types";

type AssessmentPdfActionsProps = {
  patientName: string;
  assessment: ClinicalAssessment;
  pathwayTitle?: string;
  professional?: Profile;
  logoSrc?: string;
  goals?: Goal[];
};

export function AssessmentPdfActions(props: AssessmentPdfActionsProps) {
  const model = useMemo(() => buildAssessmentPrintModel(props), [props.assessment, props.goals, props.logoSrc, props.pathwayTitle, props.patientName, props.professional]);
  const fileName = useMemo(() => assessmentPdfFileName(), []);
  const revisionKey = useMemo(() => JSON.stringify({ assessment: props.assessment, goals: props.goals, logoSrc: props.logoSrc, pathwayTitle: props.pathwayTitle, patientName: props.patientName, professional: props.professional }), [props.assessment, props.goals, props.logoSrc, props.pathwayTitle, props.patientName, props.professional]);
  const generatePdf = async () => {
    const logoData = await resolveAssessmentPdfLogo(props.logoSrc);
    const [{ pdf }, { assessmentPdfDocument }] = await Promise.all([import("@react-pdf/renderer"), import("@/lib/clinical/assessment-pdf-document")]);
    return pdf(assessmentPdfDocument(model, logoData)).toBlob();
  };

  return <section className="mt-5 rounded-2xl border border-sage-200 bg-sage-50/60 p-4" aria-labelledby="assessment-pdf-title">
    <h2 id="assessment-pdf-title" className="font-bold text-sage-900">PDF della valutazione</h2>
    <p className="mt-1 text-sm leading-6 text-slate-600">Crea un PDF reale da aprire, condividere o scaricare. Il file usa i dati della valutazione visualizzata.</p>
    <GeneratedPdfActions title={model.title} fileName={fileName} revisionKey={revisionKey} generate={generatePdf} />
  </section>;
}
