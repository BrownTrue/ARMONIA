import { AssessmentPrintDocument } from "./assessment-print-document";
import { buildAssessmentPrintModel } from "@/lib/clinical/assessment-print-model";
import type { ClinicalAssessmentV1 } from "@/lib/clinical/types";
import type { Profile } from "@/lib/types";

type SummaryProps = { patientName: string; assessment: ClinicalAssessmentV1; pathwayTitle?: string; professional?: Profile; logoSrc?: string };

export function AssessmentSummary({ patientName, assessment, pathwayTitle, professional, logoSrc = "/branding/logo-mark.svg" }: SummaryProps) {
  return <AssessmentPrintDocument model={buildAssessmentPrintModel({ patientName, assessment, pathwayTitle, professional, logoSrc })} />;
}
