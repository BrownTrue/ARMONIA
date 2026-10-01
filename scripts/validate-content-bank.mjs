import { getContents } from "../lib/content-bank/catalog.ts";
import { validateContentCatalog } from "../lib/content-bank/validation.ts";
const contents = getContents(), result = validateContentCatalog(contents);
for (const issue of result.errors) console.error(`ERROR ${issue.contentId || "catalogo"}:${issue.field || "item"} ${issue.message}`);
for (const issue of result.warnings) console.warn(`WARN ${issue.contentId || "catalogo"}:${issue.field || "item"} ${issue.message}`);
if (!result.valid) process.exitCode = 1; else console.log(`Banca Contenuti valida: ${contents.length} contenuti.`);
