import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { STATISTICS_CLOUD_FIELDS } from "./statistics-repository.ts";

test("reader statistico usa soltanto domini e campi minimali", async () => {
  assert.deepEqual(Object.keys(STATISTICS_CLOUD_FIELDS).sort(), ["appointment_services", "appointments", "patients", "payments", "sessions"]);
  const allFields = Object.values(STATISTICS_CLOUD_FIELDS).join(",");
  for (const forbidden of ["notes", "activities", "patient_response", "homework", "assessment", "material", "worksheet", "qab"]) assert.equal(allFields.includes(forbidden), false);
});

test("reader cloud è paginato e applica sempre owner filter", async () => {
  const source = await readFile(new URL("./statistics-repository.ts", import.meta.url), "utf8");
  assert.match(source, /\.eq\("user_id", userId\)\.order\("id"\)\.range\(/);
  assert.match(source, /PAGE_SIZE = 500/);
  assert.doesNotMatch(source, /from\("(clinical_assessments|materials|patient_worksheets|economic_documents)"\)/);
});

test("pagina non espone il KPI clinico Obiettivi raggiunti", async () => {
  const source = await readFile(new URL("../../app/statistiche/page.tsx", import.meta.url), "utf8");
  assert.equal(source.includes("Obiettivi raggiunti"), false);
  assert.match(source, /LoadingStatistics/);
  assert.match(source, /Statistiche non disponibili/);
});
