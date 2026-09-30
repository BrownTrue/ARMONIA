import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import { EconomicDocumentServerError, issueEconomicDocument, sha256 } from "./issuance.ts";
import { renderProformaPdf } from "./proforma-pdf.ts";

const attempt = (status = "reserved") => ({ id:"attempt-1", document_id:"document-1", status, document_number:"PF-2026-0001", issue_date:"2026-09-30", lease_token:"lease-1", pdf_storage_path:"user/document/attempt/document.pdf", logo_snapshot_path:null });
const document = (status = "draft") => ({ id:"document-1", status, professional_snapshot:{ professionalName:"Anna Bianchi", profession:"Logopedista", taxCode:"ABC123", address:"Via Roma 1", postalCode:"00100", city:"Roma", country:"Italia" }, recipient_snapshot:{ firstName:"Mario", lastName:"Rossi", taxCode:"RSSMRA", address:"Via Milano 2", postalCode:"20100", city:"Milano", country:"Italia" }, currency_code:"EUR", notes:"Documento di cortesia.", logo_included:false });
const lines = [{ description_snapshot:"Trattamento logopedico", service_date_snapshot:"2026-09-29", quantity:1, unit_amount_cents:4500, line_total_cents:4500, position:1 }];
const reservation = (status = "reserved") => ({ attempt:attempt(status), document:document(), lines });

const dependencies = (overrides = {}) => {
  const calls = [];
  return { calls, deps:{
    findFinalized:async()=>null,
    reserve:async()=>reservation(),
    loadLogo:async()=>({ original:new Uint8Array([1,2]), renderable:new Uint8Array([3,4]) }),
    renderPdf:async()=>new Uint8Array([37,80,68,70,45]),
    putImmutable:async(path)=>{calls.push(`put:${path}`)},
    markUploaded:async()=>{calls.push("uploaded")},
    finalize:async()=>{calls.push("finalized");return document("issued")},
    recordError:async(_attempt,code)=>{calls.push(`error:${code}`)},
    ...overrides,
  }};
};

test("reserved issuance uploads immutable PDF, marks uploaded and finalizes", async()=>{
  const {calls,deps}=dependencies();
  const result=await issueEconomicDocument(deps);
  assert.equal(result.status,"issued");
  assert.deepEqual(calls,["put:user/document/attempt/document.pdf","uploaded","finalized"]);
});

test("uploaded issuance skips rendering and resumes finalization", async()=>{
  const {calls,deps}=dependencies({reserve:async()=>reservation("uploaded"),renderPdf:async()=>{throw new Error("must not render")}});
  await issueEconomicDocument(deps);
  assert.deepEqual(calls,["finalized"]);
});

test("finalized issuance is idempotent and does not reserve a new number", async()=>{
  let reserved=false;
  const {calls,deps}=dependencies({findFinalized:async()=>document("issued"),reserve:async()=>{reserved=true;return reservation()}});
  const result=await issueEconomicDocument(deps);
  assert.equal(result.status,"issued");
  assert.equal(reserved,false);
  assert.deepEqual(calls,[]);
});

test("logo request copies original bytes before PDF and reports matching metadata", async()=>{
  let metadata;
  const withLogo=reservation(); withLogo.attempt.logo_snapshot_path="user/document/attempt/logo.webp";
  const original=new Uint8Array([1,2,3]);
  const {calls,deps}=dependencies({reserve:async()=>withLogo,loadLogo:async()=>({original,renderable:new Uint8Array([9])}),markUploaded:async(input)=>{metadata=input;calls.push("uploaded")}});
  await issueEconomicDocument(deps);
  assert.deepEqual(calls.slice(0,2),["put:user/document/attempt/logo.webp","put:user/document/attempt/document.pdf"]);
  assert.equal(metadata.logoSha256,sha256(original));
  assert.equal(metadata.logoSize,3);
});

test("safe workflow error is persisted without losing the primary code", async()=>{
  const {calls,deps}=dependencies({renderPdf:async()=>{throw new EconomicDocumentServerError("pdf_render_failed",500,true)}});
  await assert.rejects(()=>issueEconomicDocument(deps),error=>error.code==="pdf_render_failed"&&error.retryable===true);
  assert.deepEqual(calls,["error:pdf_render_failed"]);
});

test("missing requested logo stops before finalization and remains retryable on the same attempt", async()=>{
  const withLogo=reservation(); withLogo.attempt.logo_snapshot_path="user/document/attempt/logo.webp";
  const {calls,deps}=dependencies({reserve:async()=>withLogo,loadLogo:async()=>{throw new EconomicDocumentServerError("logo_missing",422,false)}});
  await assert.rejects(()=>issueEconomicDocument(deps),error=>error.code==="logo_missing");
  assert.deepEqual(calls,["error:logo_missing"]);
});

test("PDF renderer creates a real A4 PDF with snapshot data and many rows", async()=>{
  const many={...reservation(),lines:Array.from({length:60},(_,index)=>({...lines[0],description_snapshot:`Prestazione ${index+1}`,position:index+1}))};
  const bytes=await renderProformaPdf(many);
  const repeated=await renderProformaPdf(many);
  assert.equal(Buffer.from(bytes.subarray(0,5)).toString(),"%PDF-");
  assert.ok(bytes.byteLength>5000);
  assert.equal(sha256(bytes),sha256(repeated));
});

test("PDF renderer risolve i font e produce un PDF valido con logo", async()=>{
  for(const name of ["Inter-Regular.woff","Inter-Bold.woff"]) assert.equal(existsSync(new URL(`./fonts/${name}`,import.meta.url)),true);
  const logo=new Uint8Array(await sharp({create:{width:24,height:24,channels:4,background:{r:91,g:130,b:105,alpha:1}}}).png().toBuffer());
  const bytes=await renderProformaPdf(reservation(),logo);
  assert.equal(Buffer.from(bytes.subarray(0,5)).toString(),"%PDF-");
  assert.ok(bytes.byteLength>3000);
});

test("route emissione include gli asset runtime standard di pdfkit nel tracing Next",()=>{
  const nextConfig=readFileSync(new URL("../../next.config.ts",import.meta.url),"utf8");
  const pdfkitRoot=new URL("../../node_modules/pdfkit/js/standard-fonts/",import.meta.url);
  assert.equal(existsSync(new URL("Helvetica.cjs",pdfkitRoot)),true);
  assert.equal(existsSync(new URL("chunks/standardGlyphNames-DNHAb7rp.cjs",pdfkitRoot)),true);
  assert.match(nextConfig,/"\/api\/economic-documents\/\[id\]\/issue"\s*:\s*\[[\s\S]*"\.\/node_modules\/pdfkit\/js\/standard-fonts\/\*\*\/\*"/);
});

test("server routes are authenticated, Node-only and never expose service credentials",()=>{
  for(const action of ["issue","download","void"]){
    const source=readFileSync(new URL(`../../app/api/economic-documents/[id]/${action}/route.ts`,import.meta.url),"utf8");
    assert.match(source,/runtime = "nodejs"/);
    assert.match(source,/authenticatedUserId/);
    assert.match(source,/private, no-store/);
    assert.doesNotMatch(source,/SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  }
});

test("issuance does not mutate payments or allocations",()=>{
  const server=readFileSync(new URL("./server.ts",import.meta.url),"utf8");
  assert.doesNotMatch(server,/payment_allocations|\.from\("payments"\)/);
});

test("server adapter verifies immutable upload and maps issue conflicts safely",()=>{
  const server=readFileSync(new URL("./server.ts",import.meta.url),"utf8");
  assert.match(server,/upsert: false/);
  assert.match(server,/cacheControl: "0"/);
  assert.doesNotMatch(server,/cacheControl: "private, max-age=0"/);
  assert.match(server,/download\(path\)/);
  assert.match(server,/sha256\(stored\) !== sha256\(bytes\)/);
  assert.match(server,/session_already_documented/);
  assert.match(server,/pdf_generation_failed/);
  assert.match(server,/upload_failed/);
  assert.match(server,/upload_verification_failed/);
  assert.match(server,/logo_processing_failed/);
  assert.match(server,/finalize_failed/);
});

test("route emissione registra stage diagnostici sanitizzati",()=>{
  const route=readFileSync(new URL("../../app/api/economic-documents/[id]/issue/route.ts",import.meta.url),"utf8");
  for(const stage of ["reserve","pdf_generation","logo_processing","upload","upload_verification","mark_uploaded","finalize","server_configuration"]) assert.match(route,new RegExp(`"${stage}"`));
  assert.match(route,/logServerDiagnostic/);
  assert.doesNotMatch(route,/service role key|cookie|storage_path/i);
});

test("signed download enforces owner and status while void delegates to the protected RPC",()=>{
  const server=readFileSync(new URL("./server.ts",import.meta.url),"utf8");
  assert.match(server,/eq\("user_id", userId\).*eq\("id", documentId\).*in\("status", \["issued", "voided"\]\)/s);
  assert.match(server,/createSignedUrl\([^,]+, 60/);
  assert.match(server,/rpc\("void_economic_document"/);
});

test("PDF template consumes canonical snapshots, number, date and optional logo",()=>{
  const source=readFileSync(new URL("./proforma-pdf.ts",import.meta.url),"utf8");
  assert.match(source,/professional_snapshot/);
  assert.match(source,/recipient_snapshot/);
  assert.match(source,/document_number/);
  assert.match(source,/issue_date/);
  assert.match(source,/image \? el\(View/);
});
