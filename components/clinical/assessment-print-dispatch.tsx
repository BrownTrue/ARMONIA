import { AssessmentSummary } from "./assessment-summary";
import type { ClinicalAssessment } from "@/lib/clinical/types";
import type { Profile } from "@/lib/types";

type Props = {
  patientName: string;
  assessment: ClinicalAssessment;
  pathwayTitle?: string;
  professional?: Profile;
  logoSrc?: string;
};

export function ClinicalAssessmentPrint(props: Props) {
  if (props.assessment.schemaVersion === 1) {
    return <AssessmentSummary {...props} assessment={props.assessment} />;
  }

  // Il documento V2 verrà introdotto quando saranno definiti i contenuti clinici.
  return null;
}
