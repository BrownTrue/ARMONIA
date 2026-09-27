import type { ClinicalAssessment } from "./types.ts";
import type { Appointment, Goal, Material, Session } from "../types.ts";
import { clinicalModuleRegistry } from "./module-registry.ts";

type TimelineBase = {
  id: string;
  entityId: string;
  occurredOn: string;
  createdAt: string;
  title: string;
  subtitle?: string;
};

export type PatientTimelineItem =
  | (TimelineBase & {
      type: "session";
      session: Session;
      goals: { id: string; title: string; available: boolean }[];
      materials: { id: string; title: string; mimeType?: string; available: boolean; material?: Material }[];
      appointment?: Appointment;
    })
  | (TimelineBase & { type: "clinical_assessment"; assessment: ClinicalAssessment; moduleLabels: string[] });

export type PatientTimelineFilter = "all" | "sessions" | "assessments";

const dateFromCreatedAt = (createdAt: string) => createdAt.slice(0, 10);

const compactText = (value: string) => {
  const trimmed = value.trim();
  return trimmed && !/^(?:-{1,3}|n\/?a|non indicato)$/i.test(trimmed) ? trimmed : undefined;
};

const assessmentTitle = (assessment: ClinicalAssessment) => {
  if (assessment.schemaVersion === 1) return "Prima valutazione";
  if (assessment.assessmentType === "initial") return "Valutazione iniziale";
  if (assessment.assessmentType === "reassessment") return "Rivalutazione";
  if (assessment.assessmentType === "interim") return "Valutazione intermedia";
  return "Altro";
};

const assessmentModules = (assessment: ClinicalAssessment) => assessment.schemaVersion === 1
  ? ["Linguaggio e comunicazione"]
  : assessment.data.modules.map((module) => clinicalModuleRegistry.find((definition) => definition.code === module.code && definition.version === module.version)?.label).filter((label): label is string => Boolean(label));

export function buildPatientTimeline(
  patientId: string,
  sessions: Session[],
  assessments: ClinicalAssessment[],
  goals: Goal[] = [],
  materials: Material[] = [],
  appointments: Appointment[] = [],
): PatientTimelineItem[] {
  const sessionItems: PatientTimelineItem[] = sessions
    .filter((session) => session.patientId === patientId)
    .map((session) => {
      const linkedGoals = session.goalIds.map((id) => {
        const goal = goals.find((item) => item.id === id);
        return { id, title: goal?.title || "Obiettivo non più disponibile", available: Boolean(goal) };
      });
      const linkedMaterials = session.materialIds.map((id) => {
        const material = materials.find((item) => item.id === id);
        return { id, title: material?.title || "Materiale non più disponibile", mimeType: material?.mimeType, available: Boolean(material), material };
      });
      return {
        id: `session:${session.id}`,
        type: "session" as const,
        entityId: session.id,
        occurredOn: session.date,
        createdAt: session.createdAt,
        title: "Seduta",
        subtitle: compactText(session.result) || compactText(session.activities),
        session,
        goals: linkedGoals,
        materials: linkedMaterials,
        appointment: session.appointmentId ? appointments.find((appointment) => appointment.id === session.appointmentId) : undefined,
      };
    });
  const assessmentItems: PatientTimelineItem[] = assessments
    .filter((assessment) => assessment.patientId === patientId)
    .map((assessment) => {
      const moduleLabels = assessmentModules(assessment);
      return {
        id: `clinical_assessment:${assessment.id}`,
        type: "clinical_assessment" as const,
        entityId: assessment.id,
        occurredOn: assessment.clinicalDate || dateFromCreatedAt(assessment.createdAt),
        createdAt: assessment.createdAt,
        title: assessmentTitle(assessment),
        subtitle: moduleLabels.join(" · "),
        assessment,
        moduleLabels,
      };
    });
  return [...sessionItems, ...assessmentItems].sort((a, b) =>
    b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
}

export function filterPatientTimeline(items: PatientTimelineItem[], filter: PatientTimelineFilter) {
  if (filter === "sessions") return items.filter((item) => item.type === "session");
  if (filter === "assessments") return items.filter((item) => item.type === "clinical_assessment");
  return items.slice();
}
