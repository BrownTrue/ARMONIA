import { writeFileSync } from "node:fs";
import { buildContentCoverageReport } from "../lib/content-bank/coverage.ts";
const output = new URL("../data/armonia-content/coverage-report.md", import.meta.url);
writeFileSync(output, buildContentCoverageReport(), "utf8");
console.log("Coverage Banca Contenuti aggiornata.");
