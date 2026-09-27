import type { ClinicalAssessment, ClinicalPathway } from "./clinical/types.ts";
import type { AppData, Appointment, Goal, Session } from "./types.ts";

export type PatientWorkflowNotice =
  | { kind: "assessment_draft"; label: "Valutazione in bozza" }
  | { kind: "pathway_without_goals"; label: "Percorso attivo senza obiettivi" }
  | { kind: "pathway_missing"; label: "Percorso clinico non ancora creato" };

export type PatientOverview = {
  activePathway?: ClinicalPathway;
  latestAssessment?: ClinicalAssessment;
  openAssessmentDraft?: ClinicalAssessment;
  activeGoals: Goal[];
  focusGoals: Goal[];
  latestSession?: Session;
  latestNextPlan?: string;
  nextAppointment?: Appointment;
  workflowNotice?: PatientWorkflowNotice;
};

const assessmentDate = (assessment: ClinicalAssessment) => assessment.clinicalDate || assessment.createdAt.slice(0, 10);
const appointmentTimestamp = (appointment: Appointment) => new Date(`${appointment.date}T${appointment.time || "00:00"}:00`).getTime();

export function getActiveClinicalPathway(pathways: ClinicalPathway[], patientId: string) {
  return pathways.find((pathway) => pathway.patientId === patientId && pathway.status === "active");
}

export function getLatestAssessment(assessments: ClinicalAssessment[], patientId: string) {
  return assessments
    .filter((assessment) => assessment.patientId === patientId)
    .slice()
    .sort((a, b) => assessmentDate(b).localeCompare(assessmentDate(a)) || b.updatedAt.localeCompare(a.updatedAt))[0];
}

export function getOpenAssessmentDraft(assessments: ClinicalAssessment[], patientId: string) {
  return assessments
    .filter((assessment) => assessment.patientId === patientId && assessment.status === "draft")
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export function getActiveGoals(goals: Goal[], patientId: string) {
  return goals
    .filter((goal) => goal.patientId === patientId && goal.status !== "achieved" && goal.status !== "suspended")
    .slice()
    .sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
}

export function getLatestSession(sessions: Session[], patientId: string) {
  return sessions
    .filter((session) => session.patientId === patientId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
}

export function getNextFutureAppointment(appointments: Appointment[], patientId: string, now: Date = new Date()) {
  const threshold = now.getTime();
  return appointments
    .filter((appointment) => appointment.patientId === patientId && appointment.type !== "cancelled")
    .map((appointment) => ({ appointment, timestamp: appointmentTimestamp(appointment) }))
    .filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= threshold)
    .sort((a, b) => a.timestamp - b.timestamp || a.appointment.createdAt.localeCompare(b.appointment.createdAt))[0]?.appointment;
}

export function getPatientOverview(data: AppData, patientId: string, now: Date = new Date()): PatientOverview {
  const activePathway = getActiveClinicalPathway(data.clinicalPathways, patientId);
  const latestAssessment = getLatestAssessment(data.clinicalAssessments, patientId);
  const openAssessmentDraft = getOpenAssessmentDraft(data.clinicalAssessments, patientId);
  const activeGoals = getActiveGoals(data.goals, patientId);
  const latestSession = getLatestSession(data.sessions, patientId);
  const pathwayGoals = activePathway ? activeGoals.filter((goal) => goal.clinicalPathwayId === activePathway.id) : [];
  const independentGoals = activeGoals.filter((goal) => !activePathway || goal.clinicalPathwayId !== activePathway.id);
  const focusGoals = [...pathwayGoals, ...independentGoals].slice(0, 3);
  const workflowNotice: PatientWorkflowNotice | undefined = openAssessmentDraft
    ? { kind: "assessment_draft", label: "Valutazione in bozza" }
    : activePathway && pathwayGoals.length === 0
      ? { kind: "pathway_without_goals", label: "Percorso attivo senza obiettivi" }
      : !activePathway
        ? { kind: "pathway_missing", label: "Percorso clinico non ancora creato" }
        : undefined;

  return {
    activePathway,
    latestAssessment,
    openAssessmentDraft,
    activeGoals,
    focusGoals,
    latestSession,
    latestNextPlan: latestSession?.nextPlan.trim() || undefined,
    nextAppointment: getNextFutureAppointment(data.appointments, patientId, now),
    workflowNotice,
  };
}

export function clinicalAssessmentTypeLabel(assessment: ClinicalAssessment) {
  if (assessment.schemaVersion === 1 || assessment.assessmentType === "initial") return "Prima valutazione";
  if (assessment.assessmentType === "reassessment") return "Rivalutazione";
  if (assessment.assessmentType === "interim") return "Valutazione intermedia";
  return "Valutazione";
}
