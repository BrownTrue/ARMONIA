import { strToU8, zipSync } from "fflate";
import type { AppData } from "../types.ts";
import { toCsv } from "./csv.ts";
import { DATA_EXPORT_SCHEMA_VERSION, type DataExportKind, type DataExportSnapshot, type ExportFile } from "./types.ts";

const json=(value:unknown)=>JSON.stringify(value,null,2)+"\n";
const patientName=(data:AppData,id:string)=>{const p=data.patients.find(x=>x.id===id);return p?`${p.firstName} ${p.lastName}`.trim():""};
const dateStamp=(date:Date)=>date.toISOString().slice(0,10);
export const exportArchiveName=(date=new Date())=>`armonia-export-${dateStamp(date)}.zip`;

export function exportFiles(snapshot:DataExportSnapshot,kind:DataExportKind):ExportFile[]{
  const d=snapshot.data, include=(wanted:DataExportKind)=>kind===wanted||kind==="all", files:ExportFile[]=[];
  if(include("patients")){
    files.push({name:"dati/pazienti.csv",content:toCsv(["patient_id","nome","cognome","data_nascita","telefono_contatto","referente","scuola","classe","motivo_invio","note","stato","data_creazione"],d.patients.map(p=>[p.id,p.firstName,p.lastName,p.birthDate,p.contact,p.guardian,p.school,p.schoolClass,p.referralReason,p.notes,p.status,p.createdAt]))});
    files.push({name:"dati/dati_amministrativi_pazienti.csv",content:toCsv(["patient_id","codice_fiscale_paziente","indirizzo_paziente","cap_paziente","citta_paziente","provincia_paziente","paese_paziente","tipo_intestatario","nome_intestatario","cognome_intestatario","codice_fiscale_intestatario","relazione","indirizzo_intestatario","cap_intestatario","citta_intestatario","provincia_intestatario","paese_intestatario","email_amministrativa","data_creazione","data_aggiornamento"],d.patientAdministrativeDetails.map(x=>[x.patientId,x.patientTaxCode,x.patientAddress,x.patientPostalCode,x.patientCity,x.patientProvince,x.patientCountry,x.billingSubjectType,x.recipientFirstName,x.recipientLastName,x.recipientTaxCode,x.recipientRelationship,x.recipientAddress,x.recipientPostalCode,x.recipientCity,x.recipientProvince,x.recipientCountry,x.administrativeEmail,x.createdAt,x.updatedAt]))});
  }
  if(include("appointments"))files.push({name:"dati/appuntamenti.csv",content:toCsv(["appointment_id","patient_id","paziente","data","ora","durata_minuti","tipo_stato","location_id","sede","service_id","prestazione","prezzo_effettivo_centesimi","note","serie_ricorrente","data_creazione"],d.appointments.map(a=>[a.id,a.patientId,patientName(d,a.patientId),a.date,a.time,a.duration,a.type,a.locationId,a.locationNameSnapshot||d.locations.find(x=>x.id===a.locationId)?.name,a.serviceId,a.serviceNameSnapshot||d.services.find(x=>x.id===a.serviceId)?.name,a.effectivePriceCents,a.notes,a.recurrenceSeriesId,a.createdAt]))});
  if(include("sessions"))files.push({name:"dati/sedute.csv",content:toCsv(["session_id","patient_id","paziente","appointment_id","data","durata_minuti","service_id","prestazione_snapshot","prezzo_effettivo_centesimi","attivita","risposta","aiuto","risultato","piano_successivo","compiti","note","goal_ids","material_ids","data_creazione"],d.sessions.map(s=>[s.id,s.patientId,patientName(d,s.patientId),s.appointmentId,s.date,s.duration,s.serviceId,s.serviceNameSnapshot,s.effectivePriceCents,s.activities,s.response,s.helpLevel,s.result,s.nextPlan,s.homework,s.notes,s.goalIds.join(";"),s.materialIds.join(";"),s.createdAt]))});
  if(include("materials")){
    files.push({name:"dati/materiali.csv",content:toCsv(["material_id","nome","descrizione","categoria","tag","file_name","mime_type","dimensione_byte","preferito","url_esterno","patient_ids","data_creazione"],d.materials.map(m=>[m.id,m.title,m.description,m.category,m.tags.join(";"),m.fileName,m.mimeType,m.size,m.favorite,m.externalUrl,m.patientIds.join(";"),m.createdAt]))});
    files.push({name:"dati/patient_materials.csv",content:toCsv(["patient_id","material_id"],snapshot.patientMaterials.map(x=>[x.patientId,x.materialId]))},{name:"dati/session_materials.csv",content:toCsv(["session_id","material_id"],snapshot.sessionMaterials.map(x=>[x.sessionId,x.materialId]))});
  }
  if(include("clinical"))files.push({name:"clinica/dati-clinici.json",content:json({exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,clinicalPathways:d.clinicalPathways,clinicalAssessments:d.clinicalAssessments,goals:d.goals})});
  if(include("worksheets"))files.push({name:"clinica/schede-paziente.json",content:json({exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,patientWorksheets:d.patientWorksheets})},{name:"clinica/attivita-e-modelli.json",content:json({exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,exerciseRecipes:d.exerciseRecipes,worksheetTemplates:d.worksheetTemplates})});
  if(include("economy")){
    files.push({name:"economia/pagamenti.csv",content:toCsv(["payment_id","patient_id","paziente","importo_centesimi","data_pagamento","metodo","nota","stato","annullato_il","data_creazione","data_aggiornamento"],d.payments.map(p=>[p.id,p.patientId,patientName(d,p.patientId),p.amountCents,p.paidAt,p.method,p.note,p.status,p.voidedAt,p.createdAt,p.updatedAt]))});
    files.push({name:"economia/allocazioni_pagamenti.csv",content:toCsv(["payment_id","session_id","patient_id","importo_centesimi","data_creazione"],d.paymentAllocations.map(x=>[x.paymentId,x.sessionId,x.patientId,x.amountCents,x.createdAt]))});
    files.push({name:"economia/proforma.csv",content:toCsv(["document_id","patient_id","tipo","stato","numero","data_emissione","subtotale_centesimi","totale_centesimi","valuta","note","logo_incluso","versione_template","emesso_il","annullato_il","motivo_annullamento","data_creazione","data_aggiornamento"],d.economicDocuments.map(x=>[x.id,x.patientId,x.documentType,x.status,x.documentNumber,x.issueDate,x.subtotalCents,x.totalCents,x.currencyCode,x.notes,x.logoIncluded,x.renderTemplateVersion,x.issuedAt,x.voidedAt,x.voidReason,x.createdAt,x.updatedAt]))});
    files.push({name:"economia/righe_proforma.csv",content:toCsv(["line_id","document_id","patient_id","session_id","service_id","prestazione_snapshot","data_prestazione_snapshot","descrizione_snapshot","quantita","importo_unitario_centesimi","totale_riga_centesimi","posizione","data_creazione","data_aggiornamento"],d.economicDocumentLines.map(x=>[x.id,x.documentId,x.patientId,x.sessionId,x.serviceId,x.serviceNameSnapshot,x.serviceDateSnapshot,x.descriptionSnapshot,x.quantity,x.unitAmountCents,x.lineTotalCents,x.position,x.createdAt,x.updatedAt]))});
    files.push({name:"economia/proforma-snapshot.json",content:json({exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,documents:d.economicDocuments.map(({logoSnapshotPath:_,pdfStoragePath:__,...document})=>document),lines:d.economicDocumentLines})});
  }
  if(kind==="all")files.push({name:"dati/profilo.json",content:json({exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,profile:d.profile,professionalDocumentDetails:d.professionalDocumentDetails,locations:d.locations,services:d.services})});
  return files;
}

export function manifestFor(snapshot:DataExportSnapshot,files:ExportFile[],exportedAt=new Date().toISOString()){
  const d=snapshot.data;return {exportSchemaVersion:DATA_EXPORT_SCHEMA_VERSION,exportedAt,source:"ARMONIA",files:files.map(x=>x.name),recordCounts:{patients:d.patients.length,appointments:d.appointments.length,sessions:d.sessions.length,payments:d.payments.length,paymentAllocations:d.paymentAllocations.length,economicDocuments:d.economicDocuments.length,economicDocumentLines:d.economicDocumentLines.length,clinicalPathways:d.clinicalPathways.length,clinicalAssessments:d.clinicalAssessments.length,patientWorksheets:d.patientWorksheets.length,exerciseRecipes:d.exerciseRecipes.length,worksheetTemplates:d.worksheetTemplates.length,materials:d.materials.length},notice:"Questa esportazione non è un backup ripristinabile di ARMONIA.",storage:{binariesIncluded:false}};
}

export function zipExport(snapshot:DataExportSnapshot,kind:DataExportKind,exportedAt=new Date().toISOString()){
  const files=exportFiles(snapshot,kind);if(kind==="all")files.unshift({name:"manifest.json",content:json(manifestFor(snapshot,files,exportedAt))});
  return zipSync(Object.fromEntries(files.map(file=>[file.name,strToU8(file.content)])),{level:6});
}
