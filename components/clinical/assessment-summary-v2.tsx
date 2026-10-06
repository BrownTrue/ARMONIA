import { AssessmentPrintDocument } from "./assessment-print-document";
import { buildAssessmentPrintModel } from "@/lib/clinical/assessment-print-model";
import type { ClinicalAssessmentV2 } from "@/lib/clinical/types";
import type { Goal, Profile } from "@/lib/types";

type Props = { patientName: string; assessment: ClinicalAssessmentV2; pathwayTitle?: string; professional?: Profile; logoSrc?: string; goals?: Goal[] };

export function AssessmentSummaryV2({ patientName, assessment, pathwayTitle, professional, logoSrc = "/branding/logo-mark.svg", goals = [] }: Props) {
  return <AssessmentPrintDocument model={buildAssessmentPrintModel({ patientName, assessment, pathwayTitle, professional, logoSrc, goals })} />;
}
