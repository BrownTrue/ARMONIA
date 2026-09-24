import assert from "node:assert/strict";
import test from "node:test";
import { CLINICAL_ASSESSMENT_V2_STEPS, getClinicalAssessmentWizardActions, getClinicalModuleActionLabel, searchClinicalModules } from "./assessment-v2-ui.ts";

test("gli step 1-5 espongono Avanti come azione primaria e non il completamento", () => {
  for (let step = 0; step < 5; step += 1) {
    const actions = getClinicalAssessmentWizardActions(step);
    assert.equal(actions.showNext, true);
    assert.equal(actions.showComplete, false);
    assert.equal(actions.primaryAction, "next");
  }
});

test("lo step 6 espone il completamento e non Avanti", () => {
  const actions = getClinicalAssessmentWizardActions(CLINICAL_ASSESSMENT_V2_STEPS.length - 1);
  assert.equal(actions.showNext, false);
  assert.equal(actions.showComplete, true);
  assert.equal(actions.primaryAction, "complete");
});

test("la ricerca trova i moduli per label senza distinguere maiuscole o accenti", () => {
  assert.deepEqual(searchClinicalModules("VOCE").map(({ module }) => module.label), ["Voce"]);
  assert.deepEqual(searchClinicalModules("prag").map(({ module }) => module.label), ["Comunicazione sociale e pragmatica"]);
  assert.deepEqual(searchClinicalModules("deglutizióne").map(({ module }) => module.label), ["Alimentazione e deglutizione"]);
});

test("la ricerca vuota lascia la UI alla vista per gruppi e una ricerca assente non produce risultati", () => {
  assert.deepEqual(searchClinicalModules("  "), []);
  assert.deepEqual(searchClinicalModules("nessuna-corrispondenza"), []);
});

test("un modulo già presente è rappresentato come aggiunto e rimovibile", () => {
  assert.equal(getClinicalModuleActionLabel(true), "✓ Aggiunta · Rimuovi");
  assert.equal(getClinicalModuleActionLabel(false), "+ Aggiungi");
});
