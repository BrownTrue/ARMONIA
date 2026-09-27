import type { Goal, Session } from "../types.ts";
import type { ClinicalAssessment, ClinicalPathway } from "./types.ts";

export type PathwayOperationalNotice =
  | { kind: "assessment_draft"; assessment: ClinicalAssessment }
  | { kind: "pathway_without_goals" }
  | { kind: "pathway_without_assessment" };

export type ClinicalPathwayOverview = {
  pathway: ClinicalPathway;
  assessments: ClinicalAssessment[];
  initialAssessment?: ClinicalAssessment;
  activeGoals: Goal[];
  visibleActiveGoals: Goal[];
  hiddenActiveGoalCount: number;
  historicalGoals: Goal[];
  relevantSessions: Session[];
  latestRelevantSession?: Session;
  reassessments: ClinicalAssessment[];
  operationalNotice?: PathwayOperationalNotice;
};

const assessmentDate = (assessment: ClinicalAssessment) => assessment.clinicalDate || assessment.createdAt.slice(0, 10);
const isActiveGoal = (goal: Goal) => goal.status !== "achieved" && goal.status !== "suspended";

export function buildClinicalPathwayOverview(
  pathway: ClinicalPathway,
  goals: Goal[],
  sessions: Session[],
  assessments: ClinicalAssessment[],
): ClinicalPathwayOverview {
  const pathwayGoals = goals.filter((goal) => goal.patientId === pathway.patientId && goal.clinicalPathwayId === pathway.id);
  const activeGoals = pathwayGoals.filter(isActiveGoal).slice().sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
  const historicalGoals = pathwayGoals.filter((goal) => !isActiveGoal(goal)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const goalIds = new Set(pathwayGoals.map((goal) => goal.id));
  const relevantSessions = sessions
    .filter((session) => session.patientId === pathway.patientId && session.goalIds.some((goalId) => goalIds.has(goalId)))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const pathwayAssessments = assessments.filter((assessment) => assessment.patientId === pathway.patientId && assessment.clinicalPathwayId === pathway.id);
  const sortedAssessments = pathwayAssessments.slice().sort((a, b) => assessmentDate(b).localeCompare(assessmentDate(a)) || b.updatedAt.localeCompare(a.updatedAt));
  const initialAssessment = pathwayAssessments
    .filter((assessment) => assessment.assessmentType === "initial")
    .slice()
    .sort((a, b) => assessmentDate(a).localeCompare(assessmentDate(b)) || a.createdAt.localeCompare(b.createdAt))[0];
  const reassessments = pathwayAssessments
    .filter((assessment) => assessment.assessmentType !== "initial")
    .slice()
    .sort((a, b) => assessmentDate(b).localeCompare(assessmentDate(a)) || b.updatedAt.localeCompare(a.updatedAt));
  const latestDraft = pathwayAssessments
    .filter((assessment) => assessment.status === "draft")
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const operationalNotice: PathwayOperationalNotice | undefined = pathway.status !== "active"
    ? undefined
    : latestDraft
      ? { kind: "assessment_draft", assessment: latestDraft }
      : activeGoals.length === 0
        ? { kind: "pathway_without_goals" }
        : !initialAssessment
          ? { kind: "pathway_without_assessment" }
          : undefined;

  return {
    pathway,
    assessments: sortedAssessments,
    initialAssessment,
    activeGoals,
    visibleActiveGoals: activeGoals.slice(0, 3),
    hiddenActiveGoalCount: Math.max(0, activeGoals.length - 3),
    historicalGoals,
    relevantSessions,
    latestRelevantSession: relevantSessions[0],
    reassessments,
    operationalNotice,
  };
}
