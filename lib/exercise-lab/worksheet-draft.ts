import { resetExerciseDraft, type ExerciseDraft } from "./exercise-draft.ts";

export type ExerciseBlockDraft = {
  id: string;
  exercise: ExerciseDraft;
  initialExercise: ExerciseDraft;
};

export type WorksheetDraft = {
  title: string;
  instructions: string;
  blocks: ExerciseBlockDraft[];
};

export function createWorksheetDraft(): WorksheetDraft {
  return { title: "Scheda di attività", instructions: "", blocks: [] };
}

export function addWorksheetBlock(worksheet: WorksheetDraft, exercise: ExerciseDraft): WorksheetDraft {
  const initialExercise = resetExerciseDraft(exercise);
  const nextNumber = worksheet.blocks.reduce((highest, block) => {
    const value = Number(block.id.match(/^block-(\d+)$/)?.[1] || 0);
    return Math.max(highest, value);
  }, 0) + 1;
  return { ...worksheet, blocks: [...worksheet.blocks, { id: `block-${nextNumber}`, exercise: resetExerciseDraft(initialExercise), initialExercise }] };
}

export function editWorksheetDraft(worksheet: WorksheetDraft, changes: Partial<Pick<WorksheetDraft, "title" | "instructions">>): WorksheetDraft {
  return { ...worksheet, ...changes };
}

export function updateWorksheetBlock(worksheet: WorksheetDraft, blockId: string, exercise: ExerciseDraft): WorksheetDraft {
  return { ...worksheet, blocks: worksheet.blocks.map((block) => block.id === blockId ? { ...block, exercise } : block) };
}

export function resetWorksheetBlock(worksheet: WorksheetDraft, blockId: string): WorksheetDraft {
  return { ...worksheet, blocks: worksheet.blocks.map((block) => block.id === blockId ? { ...block, exercise: resetExerciseDraft(block.initialExercise) } : block) };
}

export function removeWorksheetBlock(worksheet: WorksheetDraft, blockId: string): WorksheetDraft {
  return { ...worksheet, blocks: worksheet.blocks.filter((block) => block.id !== blockId) };
}

export function duplicateWorksheetBlock(worksheet: WorksheetDraft, blockId: string): WorksheetDraft {
  const source = worksheet.blocks.find((block) => block.id === blockId);
  return source ? addWorksheetBlock(worksheet, source.exercise) : worksheet;
}

export function moveWorksheetBlock(worksheet: WorksheetDraft, blockId: string, direction: -1 | 1): WorksheetDraft {
  const index = worksheet.blocks.findIndex((block) => block.id === blockId), target = index + direction;
  if (index < 0 || target < 0 || target >= worksheet.blocks.length) return worksheet;
  const blocks = [...worksheet.blocks];
  [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
  return { ...worksheet, blocks };
}
