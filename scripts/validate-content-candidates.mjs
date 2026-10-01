import { getContentCandidates, validateContentCandidates } from "../lib/content-bank/candidates.ts";
const result = validateContentCandidates(), candidates = getContentCandidates();
for (const issue of result.errors) console.error(`ERROR ${issue.contentId || "catalogo"}:${issue.field || "item"} ${issue.message}`);
if (!result.valid) process.exitCode = 1;
else console.log(`Candidati validi: ${candidates.length} contenuti editoriali isolati.`);
