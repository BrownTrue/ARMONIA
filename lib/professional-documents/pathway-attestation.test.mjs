import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToBuffer } from "@react-pdf/renderer";
import { pathwayAttestationPdfDocument } from "../../components/resources/pathway-attestation-pdf.ts";
import {
  buildPathwayAttestationModel,
  pathwayAttestationFileName,
  pathwayAttestationParagraphs,
  pathwayAttestationPrefill,
  pathwaysForAttestation,
  validatePathwayAttestationDraft,
} from "./pathway-attestation.ts";

const patient = { id:"patient-1", firstName:"Lia", lastName:"D'Àngelo Rossi", birthDate:"", contact:"", guardian:"", school:"", schoolClass:"", referralReason:"dato clinico", notes:"nota riservata", status:"active", createdAt:"2026-01-01T10:00:00Z" };
const otherPatient = { ...patient, id:"patient-2", firstName:"Nora", lastName:"Verdi" };
const activePathway = { id:"pathway-1", patientId:patient.id, title:"Percorso clinico", status:"active", startedOn:"2026-02-03", createdAt:"2026-02-03T10:00:00Z", updatedAt:"2026-02-03T10:00:00Z" };
const closedPathway = { ...activePathway, id:"pathway-2", status:"closed", startedOn:"2025-09-10", closedOn:"2026-06-20", createdAt:"2025-09-10T10:00:00Z" };
const profile = { firstName:"Anna", lastName:"Bianchi", profession:"Logopedista", email:"anna@example.test", studio:"Studio Bianchi", calendarColorMode:"location" };
const details = { userId:"user-1", city:"Roma", address:"Via Verde 1", postalCode:"00100", country:"Italia", createdAt:"2026-01-01", updatedAt:"2026-01-01" };
const validDraft = { patientId:patient.id, pathwayId:activePathway.id, status:"active", startDate:activePathway.startedOn, endDate:"", location:"Studio Bianchi", issuePlace:"Roma", issueDate:"2026-10-05", includeLogo:true };

test("mostra soltanto i percorsi del paziente e li ordina dal più recente", () => {
  const other = { ...activePathway, id:"other", patientId:otherPatient.id };
  assert.deepEqual(pathwaysForAttestation([closedPathway, other, activePathway], patient.id).map((item) => item.id), ["pathway-1", "pathway-2"]);
});

test("prefill conserva stato e date senza mutare il percorso", () => {
  const source = structuredClone(closedPathway);
  assert.deepEqual(pathwayAttestationPrefill(closedPathway), { status:"closed", startDate:"2025-09-10", endDate:"2026-06-20" });
  assert.deepEqual(closedPathway, source);
});

test("percorso attivo usa il testo canonico e non richiede data fine", () => {
  assert.deepEqual(validatePathwayAttestationDraft(validDraft), {});
  const model = buildPathwayAttestationModel({ draft:validDraft, patient, pathway:activePathway, profile, professionalDetails:details });
  assert.match(pathwayAttestationParagraphs(model)[0], /a partire dal 03\/02\/2026 ed è attualmente in corso\./);
  assert.equal(model.endDate, undefined);
});

test("percorso concluso richiede un intervallo cronologico valido", () => {
  const missing = validatePathwayAttestationDraft({ ...validDraft, pathwayId:closedPathway.id, status:"closed", endDate:"" });
  assert.equal(missing.endDate, "Inserisci una data di fine valida.");
  const reversed = validatePathwayAttestationDraft({ ...validDraft, pathwayId:closedPathway.id, status:"closed", startDate:"2026-06-21", endDate:"2026-06-20" });
  assert.equal(reversed.endDate, "La data di fine non può precedere la data di inizio.");
  const draft = { ...validDraft, pathwayId:closedPathway.id, status:"closed", startDate:"2025-09-10", endDate:"2026-06-20" };
  const model = buildPathwayAttestationModel({ draft, patient, pathway:closedPathway, profile, professionalDetails:details });
  assert.match(pathwayAttestationParagraphs(model)[0], /nel periodo compreso tra 10\/09\/2025 e 20\/06\/2026\./);
});

test("modello contiene solo dati amministrativi autorizzati e logo opzionale", () => {
  const model = buildPathwayAttestationModel({ draft:validDraft, patient, pathway:activePathway, profile, professionalDetails:details, logoSrc:"blob:logo" });
  assert.equal(model.logoSrc, "blob:logo");
  const serialized = JSON.stringify(model);
  for (const forbidden of [patient.referralReason, patient.notes, "Assessment", "Goal", "QAB", "clinicalPathwayId"]) assert.doesNotMatch(serialized, new RegExp(forbidden));
  assert.equal(buildPathwayAttestationModel({ draft:{ ...validDraft, includeLogo:false }, patient, pathway:activePathway, profile, professionalDetails:details, logoSrc:"blob:logo" }).logoSrc, undefined);
});

test("filename è sanitizzato e usa la data documento", () => {
  assert.equal(pathwayAttestationFileName(patient, validDraft.issueDate), "Attestazione_percorso_D_Angelo_Rossi_2026-10-05.pdf");
});

test("renderer condiviso produce un PDF A4 reale senza note interne o branding ARMONIA", async () => {
  const model = buildPathwayAttestationModel({ draft:{ ...validDraft, includeLogo:false }, patient, pathway:activePathway, profile, professionalDetails:details });
  const buffer = await renderToBuffer(pathwayAttestationPdfDocument(model));
  assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  assert.ok(buffer.length > 5000);
  const pdfSource = readFileSync(new URL("../../components/resources/pathway-attestation-pdf.ts", import.meta.url), "utf8");
  assert.doesNotMatch(pdfSource, /Nota per noi|Per percorso ancora attivo possiamo prevedere invece|ARMONIA|Generato con/);
});

test("UI usa ClinicalPathway, genera nel browser e non persiste", () => {
  const ui = readFileSync(new URL("../../components/resources/pathway-attestation-generator.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../../components/documents/generated-pdf-actions.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../app/risorse/documenti/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\/risorse\/documenti\/percorso[\s\S]*Compila/);
  assert.match(ui, /data\.clinicalPathways/);
  assert.match(ui, /import\("@react-pdf\/renderer"\)[\s\S]*pdf\(pathwayAttestationPdfDocument\(model\)\)\.toBlob\(\)/);
  assert.match(ui, /GeneratedPdfActions/);
  assert.match(actions, /prepareDocumentUrl/);
  assert.match(ui, /hasCustomLogo[\s\S]*includeLogo: true/);
  assert.doesNotMatch(`${ui}\n${actions}`, /saveClinicalPathway|savePatient|supabase|storage\.from|fetch\(|Assessment|Goal|QAB|Session/);
});
