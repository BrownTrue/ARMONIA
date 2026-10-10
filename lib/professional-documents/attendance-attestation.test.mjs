import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { resolveAttendancePdfLogo } from "./attendance-pdf-logo.ts";
import { attendanceAttestationPdfDocument } from "../../components/resources/attendance-attestation-pdf.ts";
import {
  addMinutes,
  attendanceFileName,
  attendancePrefill,
  buildAttendanceModel,
  sessionsForAttendance,
  todayInRome,
  validateAttendanceDraft,
} from "./attendance-attestation.ts";

const patient = { id:"patient-1", firstName:"Lia", lastName:"D'Àngelo Rossi", birthDate:"", contact:"", guardian:"", school:"", schoolClass:"", referralReason:"", notes:"", status:"active", createdAt:"2026-01-01T10:00:00Z" };
const otherPatient = { ...patient, id:"patient-2", firstName:"Nora", lastName:"Verdi" };
const session = { id:"session-1", patientId:patient.id, appointmentId:"appointment-1", serviceNameSnapshot:"Seduta logopedica", date:"2026-10-03", duration:45, goalIds:[], activities:"dato clinico da non esportare", response:"risposta", helpLevel:"", result:"esito", nextPlan:"", homework:"", notes:"nota riservata", materialIds:[], createdAt:"2026-10-03T10:00:00Z" };
const manualSession = { ...session, id:"session-2", appointmentId:undefined, date:"2026-10-04", createdAt:"2026-10-04T10:00:00Z" };
const appointment = { id:"appointment-1", patientId:patient.id, date:"2026-10-03", time:"09:30", duration:60, type:"regular", notes:"", locationId:"location-1", locationNameSnapshot:"Studio Centro", createdAt:"2026-09-01T10:00:00Z" };
const profile = { firstName:"Anna", lastName:"Bianchi", profession:"Logopedista", email:"anna@example.test", studio:"Studio Bianchi", calendarColorMode:"location" };
const professionalDetails = { userId:"user-1", city:"Roma", address:"Via Verde 1", postalCode:"00100", country:"Italia", createdAt:"2026-01-01", updatedAt:"2026-01-01" };
const validDraft = { patientId:patient.id, sessionId:session.id, sessionDate:session.date, startTime:"09:30", endTime:"10:15", location:"Studio Centro", issuePlace:"Roma", issueDate:"2026-10-05", includeLogo:true };

test("seleziona soltanto Session registrate del paziente e le ordina dalla più recente", () => {
  assert.deepEqual(sessionsForAttendance([session, { ...session, id:"other", patientId:otherPatient.id }, manualSession], patient.id).map((item) => item.id), ["session-2", "session-1"]);
});

test("una Session collegata usa ora Appointment, durata Session e sede snapshot", () => {
  const result = attendancePrefill(session, [appointment], [{ id:"location-1", name:"Sede corrente", color:"#ffffff", address:"", city:"", isActive:true, displayOrder:0, createdAt:"", updatedAt:"" }]);
  assert.deepEqual(result, { sessionDate:"2026-10-03", startTime:"09:30", endTime:"10:15", location:"Studio Centro", hasRecordedSchedule:true });
  assert.equal(addMinutes("23:45", 30), "", "la V1 non inventa un giorno successivo");
});

test("Session manuale non inventa orario o sede e richiede compilazione", () => {
  const result = attendancePrefill(manualSession, [appointment], []);
  assert.deepEqual(result, { sessionDate:"2026-10-04", startTime:"", endTime:"", location:"", hasRecordedSchedule:false });
  const issues = validateAttendanceDraft({ ...validDraft, sessionId:manualSession.id, sessionDate:manualSession.date, startTime:"", endTime:"", location:"" });
  assert.equal(issues.startTime, "Inserisci l’orario di inizio.");
  assert.equal(issues.endTime, "Inserisci l’orario di fine.");
  assert.equal(issues.location, "Inserisci la sede.");
});

test("validazione richiede paziente, Session e data documento valida", () => {
  const issues = validateAttendanceDraft({ ...validDraft, patientId:"", sessionId:"", issueDate:"", endTime:"09:00" });
  assert.equal(issues.patientId, "Seleziona un paziente.");
  assert.equal(issues.sessionId, "Seleziona una seduta.");
  assert.equal(issues.endTime, "L’orario di fine deve essere successivo a quello di inizio.");
  assert.equal(issues.issueDate, "Inserisci una data valida.");
  assert.match(todayInRome(new Date("2026-10-04T22:30:00Z")), /^2026-10-0[45]$/);
});

test("modello contiene solo dati autorizzati e usa il logo solo quando richiesto", () => {
  const model = buildAttendanceModel({ draft:validDraft, patient, session, profile, professionalDetails, logoSrc:"blob:logo" });
  assert.equal(model.logoSrc, "blob:logo");
  assert.equal(model.patientName, "Lia D'Àngelo Rossi");
  const serialized = JSON.stringify(model);
  for (const forbidden of [session.activities, session.response, session.result, session.notes, "goalIds", "appointmentId"]) assert.doesNotMatch(serialized, new RegExp(forbidden));
  assert.equal(buildAttendanceModel({ draft:{ ...validDraft, includeLogo:false }, patient, session, profile, professionalDetails, logoSrc:"blob:logo" }).logoSrc, undefined);
});

test("filename è sanitizzato e usa cognome e data Session", () => {
  assert.equal(attendanceFileName(patient, session.date), "Attestazione_presenza_D_Angelo_Rossi_2026-10-03.pdf");
});

test("renderer produce un PDF A4 reale senza branding ARMONIA", async () => {
  const model = buildAttendanceModel({ draft:{ ...validDraft, includeLogo:false }, patient, session, profile, professionalDetails });
  const buffer = await renderToBuffer(attendanceAttestationPdfDocument(model));
  assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  assert.ok(buffer.length > 5000);
  for (const font of ["Inter-Regular.woff", "Inter-Bold.woff"]) assert.ok(readFileSync(new URL(`../../public/resources/fonts/${font}`, import.meta.url)).length > 1000);
});

test("UI usa Session, data read-only, PDF browser-side e nessuna persistenza", () => {
  const ui = readFileSync(new URL("../../components/resources/attendance-attestation-generator.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../../components/documents/generated-pdf-actions.tsx", import.meta.url), "utf8");
  const pdf = readFileSync(new URL("../../components/resources/attendance-attestation-pdf.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../app/risorse/documenti/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\/risorse\/documenti\/presenza[\s\S]*Compila/);
  assert.match(ui, /readOnly aria-readonly="true"/);
  assert.match(ui, /const pdfLogo = await resolveAttendancePdfLogo\(model.logoSrc\)/);
  assert.match(ui, /pdf\(attendanceAttestationPdfDocument\(\{ \.\.\.model, logoSrc: pdfLogo \}\)\)\.toBlob\(\)/);
  assert.match(ui, /GeneratedPdfActions/);
  assert.match(actions, /DocumentActions/);
  assert.match(ui, /hasCustomLogo[\s\S]*includeLogo: true/);
  assert.doesNotMatch(`${ui}\n${pdf}\n${actions}`, /saveSession|savePatient|saveMaterial|supabase|storage\.from|fetch\(|Assessment|Goal/);
  assert.doesNotMatch(pdf, /ARMONIA|branding\/logo-mark|Generato con/);
});

test("logo WebP convertito in PNG e realmente incorporato nel PDF; assenza/errori restano sicuri", async (t) => {
  const webp = await sharp({ create: { width: 120, height: 60, channels: 4, background: "#72976e" } }).webp().toBuffer();
  const png = await sharp(webp).png().toBuffer();
  let canvas;
  // Browser APIs are simulated; the raster conversion and PDF renderer are real.
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  t.after(() => {
    if (originalImage === undefined) delete globalThis.Image; else globalThis.Image = originalImage;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  });
  globalThis.Image = class {
    naturalWidth = 120;
    naturalHeight = 60;
    set src(value) { queueMicrotask(() => value === "invalid" ? this.onerror() : this.onload()); }
  };
  globalThis.document = { createElement(tag) {
    assert.equal(tag, "canvas");
    canvas = { getContext: () => ({ drawImage(_image, x, y, width, height) {
      assert.deepEqual([x, y, width, height], [0, 0, 120, 60]);
    } }), toDataURL(type) {
      assert.equal(type, "image/png");
      return `data:image/png;base64,${png.toString("base64")}`;
    } };
    return canvas;
  } };
  const source = `data:image/webp;base64,${webp.toString("base64")}`;
  const logoSrc = await resolveAttendancePdfLogo(source);
  assert.deepEqual([canvas.width, canvas.height], [120, 60]);
  const model = buildAttendanceModel({ draft: validDraft, patient, session, profile, professionalDetails, logoSrc: source });
  assert.equal(model.logoSrc, source); // HTML preview retains the original logo.
  const buffer = await renderToBuffer(attendanceAttestationPdfDocument({ ...model, logoSrc }));
  assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  assert.match(buffer.toString("latin1"), /\/Subtype \/Image/);
  assert.match(buffer.toString("latin1"), /\/Width 120[\s\S]*\/Height 60/);
  const noLogo = await renderToBuffer(attendanceAttestationPdfDocument({ ...model, logoSrc: undefined }));
  assert.doesNotMatch(noLogo.toString("latin1"), /\/Subtype \/Image/);
  assert.equal(await resolveAttendancePdfLogo(), undefined);
  assert.equal(await resolveAttendancePdfLogo("invalid"), undefined);
});
