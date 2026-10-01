import { armoniaContentCandidates, candidateNonwords, candidatePairs, candidatePassages, candidateSentences, candidateWords } from "../../data/armonia-content/candidates/catalog.ts";
import { getContents } from "./catalog.ts";
import { validateContentCatalog } from "./validation.ts";

export { candidateWords, candidatePairs, candidateNonwords, candidateSentences, candidatePassages };
export function getContentCandidates() { return armoniaContentCandidates; }
export function validateContentCandidates() {
  const combined = [...getContents(), ...armoniaContentCandidates];
  const validation = validateContentCatalog(combined);
  const candidateIds = new Set(armoniaContentCandidates.map((entry) => entry.id));
  const errors = validation.errors.filter((issue) => !issue.contentId || candidateIds.has(issue.contentId));
  return { ...validation, errors, valid: errors.length === 0 };
}
