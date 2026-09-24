import { AssessmentSummary } from "./assessment-summary";
import { AssessmentSummaryV2 } from "./assessment-summary-v2";
import type { ClinicalAssessment } from "@/lib/clinical/types";
import type { Goal, Profile } from "@/lib/types";

type Props = {
  patientName: string;
  assessment: ClinicalAssessment;
  pathwayTitle?: string;
  professional?: Profile;
  logoSrc?: string;
  goals?: Goal[];
};

export function ClinicalAssessmentPrint(props: Props) {
  if (props.assessment.schemaVersion === 1) {
    return <AssessmentSummary {...props} assessment={props.assessment} />;
  }

  return <AssessmentSummaryV2 {...props} assessment={props.assessment} />;
}
