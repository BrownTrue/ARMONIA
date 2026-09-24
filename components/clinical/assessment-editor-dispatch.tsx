"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { AssessmentWizard } from "./assessment-wizard";
import { AssessmentV2Editor } from "./assessment-v2-editor";

export function ClinicalAssessmentEditorDispatch() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { data, ready } = useData();
  if (!ready) return <AppShell><p>Caricamento…</p></AppShell>;
  const assessment = data.clinicalAssessments.find((item) => item.id === assessmentId);
  if (!assessment) return <AppShell><p>Valutazione non trovata.</p></AppShell>;
  return assessment.schemaVersion === 1 ? <AssessmentWizard /> : <AssessmentV2Editor source={assessment} />;
}
