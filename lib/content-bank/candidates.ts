import { armoniaContentCandidates, candidateNonwords, candidatePairs, candidatePassages, candidateSentences, candidateWords } from "../../data/armonia-content/candidates/catalog.ts";
import { getContents } from "./catalog.ts";
import { validateContentCatalog } from "./validation.ts";

export { candidateWords, candidatePairs, candidateNonwords, candidateSentences, candidatePassages };
export function getContentCandidates() { return armoniaContentCandidates; }
export function validateContentCandidates() {
  const combined = [...getContents(), ...armoniaContentCandidates];
  const validation = validateContentCatalog(combined);
  const candidateIds = new Set(armoniaContentCandidates.map((entry) => entry.id));
  const candidatePairKeys = new Set<string>();
  const duplicateCandidatePairIds = new Set<string>();
  for (const entry of candidatePairs) {
    const key = [entry.wordAId, entry.wordBId].sort().join("::");
    if (candidatePairKeys.has(key)) duplicateCandidatePairIds.add(entry.id);
    candidatePairKeys.add(key);
  }
  const errors = validation.errors.filter((issue) => {
    if (!issue.contentId || !candidateIds.has(issue.contentId)) return false;
    if (issue.message.includes("Coppia semanticamente duplicata") && !duplicateCandidatePairIds.has(issue.contentId)) return false;
    return true;
  });
  return { ...validation, errors, valid: errors.length === 0 };
}
