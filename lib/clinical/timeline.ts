import type { ClinicalAssessment } from "./types.ts";
import type { Session } from "../types.ts";

type TimelineBase = {
  id: string;
  entityId: string;
  occurredOn: string;
  createdAt: string;
  title: string;
  subtitle?: string;
};

export type PatientTimelineItem =
  | (TimelineBase & { type: "session"; session: Session })
  | (TimelineBase & { type: "clinical_assessment"; assessment: ClinicalAssessment });

const dateFromCreatedAt = (createdAt: string) => createdAt.slice(0, 10);

export function buildPatientTimeline(patientId: string, sessions: Session[], assessments: ClinicalAssessment[]): PatientTimelineItem[] {
  const sessionItems: PatientTimelineItem[] = sessions
    .filter((session) => session.patientId === patientId)
    .map((session) => ({
      id: `session:${session.id}`,
      type: "session",
      entityId: session.id,
      occurredOn: session.date,
      createdAt: session.createdAt,
      title: "Seduta",
      subtitle: session.result || session.activities || "Seduta registrata",
      session,
    }));
  const assessmentItems: PatientTimelineItem[] = assessments
    .filter((assessment) => assessment.patientId === patientId)
    .map((assessment) => ({
      id: `clinical_assessment:${assessment.id}`,
      type: "clinical_assessment",
      entityId: assessment.id,
      occurredOn: assessment.clinicalDate || dateFromCreatedAt(assessment.createdAt),
      createdAt: assessment.createdAt,
      title: "Prima valutazione",
      subtitle: `Linguaggio e comunicazione · ${assessment.status === "completed" ? "Completata" : "Bozza"}`,
      assessment,
    }));
  return [...sessionItems, ...assessmentItems].sort((a, b) =>
    b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
}
