import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mobileAssessmentSearch, parseMobileAssessmentSurface, previousMobileAssessmentSurface } from "./mobile-assessment-navigation.ts";

const v1Editor = fs.readFileSync(new URL("../../components/clinical/assessment-wizard.tsx", import.meta.url), "utf8");
const v2Editor = fs.readFileSync(new URL("../../components/clinical/assessment-v2-editor.tsx", import.meta.url), "utf8");
const mobileLayout = fs.readFileSync(new URL("../../components/clinical/mobile-assessment-layout.tsx", import.meta.url), "utf8");

test("overview è il fallback sicuro per V1 e V2", () => {
  assert.deepEqual(parseMobileAssessmentSurface("", 6), { kind: "overview" });
  assert.deepEqual(parseMobileAssessmentSurface("?assessmentView=section&assessmentStep=8", 6), { kind: "overview" });
});

test("sezioni e moduli hanno deep link tipizzati", () => {
  assert.deepEqual(parseMobileAssessmentSurface("?assessmentView=section&assessmentStep=2", 6), { kind: "section", step: 2 });
  assert.deepEqual(parseMobileAssessmentSurface("?assessmentView=module&assessmentModule=language_oral%401", 6), { kind: "module", moduleKey: "language_oral@1" });
  assert.equal(mobileAssessmentSearch("?print=1", { kind: "modules" }), "?print=1&assessmentView=modules");
});

test("back locale torna dal modulo all'indice e dalle sezioni all'overview", () => {
  assert.deepEqual(previousMobileAssessmentSurface({ kind: "module", moduleKey: "voice@1" }), { kind: "modules" });
  assert.deepEqual(previousMobileAssessmentSurface({ kind: "section", step: 4 }), { kind: "overview" });
});

test("V1 e V2 condividono overview, header contestuale e navigazione mobile senza route parallela", () => {
  for (const source of [v1Editor, v2Editor]) {
    assert.match(source, /useMobileAssessmentLayout/);
    assert.match(source, /MobileAssessmentOverview/);
    assert.match(source, /mobileHeader=\{\{ variant: "detail"/);
    assert.doesNotMatch(source, /\/mobile\/pazienti/);
  }
  assert.match(mobileLayout, /window\.addEventListener\("popstate"/);
  assert.match(mobileLayout, /env\(safe-area-inset-bottom\)/);
});

test("V2 apre un solo modulo dal registry e porta la validazione alla superficie corretta", () => {
  assert.match(v2Editor, /getClinicalModuleEditor\(activeModule\.code, activeModule\.version\)/);
  assert.match(v2Editor, /surface\.kind === "module"/);
  assert.match(v2Editor, /issue\.step === 2 \? \{ kind: "modules" \}/);
  assert.match(v2Editor, /MobileAssessmentFooter/);
});

test("autosave canonico e desktop preesistente restano disponibili", () => {
  for (const source of [v1Editor, v2Editor]) {
    assert.match(source, /ClinicalAutosaveQueue/);
    assert.match(source, /autosaveClinicalAssessmentDraft/);
    assert.match(source, /return <AppShell>/);
  }
  assert.match(v2Editor, /assessmentV2CompletionIssues/);
  assert.match(v2Editor, /scrollIntoView/);
});
