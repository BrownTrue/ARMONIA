import type { AppData, Goal } from "../types.ts";

const replaceGoal = (goals: Goal[], updated: Goal) =>
  goals.map((goal) => goal.id === updated.id ? updated : goal);

export function linkGoalToClinicalPathway(data: AppData, goalId: string, clinicalPathwayId: string): AppData {
  const goal = data.goals.find((item) => item.id === goalId);
  if (!goal) throw new Error("Obiettivo non trovato.");
  const pathway = data.clinicalPathways.find((item) => item.id === clinicalPathwayId);
  if (!pathway) throw new Error("Percorso clinico non trovato.");
  if (goal.patientId !== pathway.patientId) throw new Error("Obiettivo e percorso clinico devono appartenere allo stesso paziente.");
  if (pathway.status !== "active") throw new Error("È possibile collegare nuovi obiettivi soltanto a un percorso attivo.");
  return { ...data, goals: replaceGoal(data.goals, { ...goal, clinicalPathwayId: pathway.id }) };
}

export function unlinkGoalFromClinicalPathway(data: AppData, goalId: string): AppData {
  const goal = data.goals.find((item) => item.id === goalId);
  if (!goal) throw new Error("Obiettivo non trovato.");
  if (!goal.clinicalPathwayId) return data;
  const pathway = data.clinicalPathways.find((item) => item.id === goal.clinicalPathwayId);
  if (pathway?.status === "closed") throw new Error("Gli obiettivi di un percorso chiuso conservano il collegamento storico.");
  const { clinicalPathwayId: _removed, ...unlinked } = goal;
  return { ...data, goals: replaceGoal(data.goals, unlinked) };
}
