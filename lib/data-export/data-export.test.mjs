import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { toCsv } from "./csv.ts";
import { exportArchiveName, exportFiles, manifestFor, zipExport } from "./archive.ts";
import { filterOwnedLinks, localExportSnapshot, readPaginatedTable } from "./reader.ts";

const base={patients:[],patientAdministrativeDetails:[],economicDocuments:[],economicDocumentLines:[],exerciseRecipes:[],worksheetTemplates:[],patientWorksheets:[],appointments:[],locations:[],services:[],sessions:[],payments:[],paymentAllocations:[],goals:[],materials:[],clinicalPathways:[],clinicalAssessments:[],profile:{firstName:"",lastName:"",profession:"",email:"",studio:"",calendarColorMode:"location"}};

test("CSV is UTF-8 BOM RFC4180 and neutralizes spreadsheet formulas",()=>{
  const csv=toCsv(["value"],[["a,b"],[`say "hello"`],["line\nnext"],["=1+1"],["+cmd"],["-2+3"],["@SUM(A1)"],[null],[""],[0],["città"]]);
  assert.equal(csv.charCodeAt(0),0xfeff);assert.match(csv,/"a,b"/);assert.match(csv,/"say ""hello"""/);assert.match(csv,/"line\nnext"/);
  for(const unsafe of ["'=1+1","'+cmd","'-2+3","'@SUM(A1)"])assert.ok(csv.includes(unsafe));
  assert.match(csv,/\r\n\r\n\r\n0\r\n/);assert.ok(new TextEncoder().encode(csv).length>csv.length);
});

test("clinical JSON preserves V1, V2 and native QAB payloads",()=>{
  const qab={nativeToolId:"italian-qab-v1",rawInput:{answer:"test"},score:null};
  const data={...base,clinicalAssessments:[{id:"v1",schemaVersion:1,data:{legacy:true}},{id:"v2",schemaVersion:2,assessmentType:"initial",data:{modules:{nativeTools:[qab]}}}]};
  const content=exportFiles(localExportSnapshot(data),"clinical")[0].content, parsed=JSON.parse(content);
  assert.equal(parsed.exportSchemaVersion,1);assert.deepEqual(parsed.clinicalAssessments,data.clinicalAssessments);assert.deepEqual(parsed.clinicalAssessments[1].data.modules.nativeTools[0],qab);
});

test("manifest counts records and archive excludes secrets, signed URLs and binaries",()=>{
  const data={...base,patients:[{id:"p",firstName:"Ada",lastName:"Rossi"}],materials:[{id:"m",title:"PDF",description:"",category:"",tags:[],fileName:"x.pdf",mimeType:"application/pdf",size:12,favorite:false,patientIds:["p"],storagePath:"secret/path.pdf",createdAt:"now"}]};
  const snapshot=localExportSnapshot(data),files=exportFiles(snapshot,"all"),manifest=manifestFor(snapshot,files,"2026-10-03T00:00:00.000Z");
  assert.equal(manifest.exportSchemaVersion,1);assert.equal(manifest.recordCounts.patients,1);assert.equal(manifest.storage.binariesIncluded,false);
  const archive=unzipSync(zipExport(snapshot,"all","2026-10-03T00:00:00.000Z"));const text=Object.values(archive).map(strFromU8).join("\n");
  assert.ok(archive["manifest.json"]);assert.ok(!text.includes("secret/path.pdf"));assert.ok(!text.includes("signedUrl"));assert.ok(!text.includes("refresh_token"));
  assert.equal(exportArchiveName(new Date("2026-10-03T12:00:00Z")),"armonia-export-2026-10-03.zip");
});

test("local legacy data is normalized and relationships are exported",()=>{
  const snapshot=localExportSnapshot({...base,materials:[{id:"m",patientIds:["p"],tags:[]}],sessions:[{id:"s",materialIds:["m"],goalIds:[]}]});
  assert.deepEqual(snapshot.patientMaterials,[{patientId:"p",materialId:"m"}]);assert.deepEqual(snapshot.sessionMaterials,[{sessionId:"s",materialId:"m"}]);
});

test("cloud reader paginates and propagates a read failure",async()=>{
  const pages=[Array.from({length:500},(_,id)=>({id})),[{id:500}]];let calls=0;
  const client={from(){return {select(){return this},range(){const index=calls++;return {eq(){return Promise.resolve({data:pages[index],error:null})},then(resolve){return resolve({data:pages[index],error:null})}}}}}};
  const rows=await readPaginatedTable(client,"patients",undefined);assert.equal(rows.length,501);assert.equal(calls,2);
  const broken={from(){return {select(){return this},range(){return Promise.resolve({data:null,error:new Error("boom")})}}}};
  await assert.rejects(()=>readPaginatedTable(broken,"patients"),/data_export_read_failed/);
});

test("associative rows are retained only when both owners belong to the export",()=>{
  const rows=[{patient_id:"mine",material_id:"owned"},{patient_id:"other",material_id:"owned"},{patient_id:"mine",material_id:"foreign"}];
  assert.deepEqual(filterOwnedLinks(rows,"patient_id",new Set(["mine"]),"material_id",new Set(["owned"])),[rows[0]]);
});
