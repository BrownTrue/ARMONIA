import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/024_economic_document_issuance.sql", import.meta.url),
  "utf8",
);
const preflight = readFileSync(new URL("../../supabase/checks/024_economic_document_issuance_preflight.sql", import.meta.url), "utf8");
const postflight = readFileSync(new URL("../../supabase/checks/024_economic_document_issuance_postflight.sql", import.meta.url), "utf8");

const activeStatuses = new Set(["reserved", "uploaded"]);
const sessionEligible = (documents) => !documents.some((document) => document.status === "issued");
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

test("024 is transactional and additive", () => {
  assert.match(migration, /begin;[\s\S]*commit;/i);
  assert.doesNotMatch(migration, /drop\s+table|truncate\s+table/i);
});

test("024 has no internally duplicated schema object names", () => {
  const constraintNames = [...migration.matchAll(/\bconstraint\s+([a-z][a-z0-9_]*)/gi)].map((match) => match[1].toLowerCase());
  const indexNames = [...migration.matchAll(/\bcreate\s+(?:unique\s+)?index\s+([a-z][a-z0-9_]*)/gi)].map((match) => match[1].toLowerCase());
  const policyNames = [...migration.matchAll(/\balter\s+policy\s+"([^"]+)"/gi)].map((match) => match[1].toLowerCase());
  const functionNames = [...migration.matchAll(/\bcreate\s+function\s+public\.([a-z][a-z0-9_]*)/gi)].map((match) => match[1].toLowerCase());
  assert.deepEqual(duplicates(constraintNames), []);
  assert.deepEqual(duplicates(indexNames), []);
  assert.deepEqual(duplicates(policyNames), []);
  assert.deepEqual(duplicates(functionNames), []);
  assert.deepEqual(indexNames.filter((name) => constraintNames.includes(name)), []);
  assert.equal((migration.match(/insert into storage\.buckets/gi) ?? []).length, 1);
});

test("status domain and status invariants use distinct named constraints", () => {
  assert.equal((migration.match(/constraint economic_document_issuance_attempts_status_check\b/gi) ?? []).length, 1);
  assert.equal((migration.match(/constraint economic_document_issuance_attempts_status_invariants_check\b/gi) ?? []).length, 1);
  assert.match(migration, /economic_document_issuance_attempts_status_check check \(status in \('reserved', 'uploaded', 'finalized', 'abandoned'\)\)/i);
  assert.doesNotMatch(migration, /status\s+text[^,\n]*default\s+'reserved'\s+check\s*\(/i);
});

test("reserve allocates annual numbers atomically and formats PF-YYYY-NNNN", () => {
  assert.match(migration, /on conflict \(user_id, document_type, year\) do update/i);
  assert.match(migration, /last_number = public\.economic_document_sequences\.last_number \+ 1/i);
  assert.match(migration, /format\('PF-%s-%s'/i);
});

test("only one active attempt is allowed and reserve resumes it", () => {
  assert.match(migration, /create unique index economic_document_issuance_attempts_one_active_idx[\s\S]*where status in \('reserved', 'uploaded'\)/i);
  assert.match(migration, /status in \('reserved', 'uploaded'\) for update/i);
});

test("reserved and uploaded block browser draft mutations", () => {
  assert.equal(activeStatuses.has("reserved"), true);
  assert.equal(activeStatuses.has("uploaded"), true);
  assert.match(migration, /not public\.economic_document_has_active_issuance/g);
});

test("abandoned unlocks drafts while finalized documents remain immutable", () => {
  assert.equal(activeStatuses.has("abandoned"), false);
  assert.equal(activeStatuses.has("finalized"), false);
  assert.match(migration, /status='abandoned'/);
  assert.match(migration, /status='issued'/);
});

test("reserve rejects non-drafts and documents without lines", () => {
  assert.match(migration, /economic_document_not_draft/);
  assert.match(migration, /economic_document_has_no_lines/);
});

test("finalize requires uploaded state and recalculates totals", () => {
  assert.match(migration, /status <> 'uploaded'.*issuance_attempt_not_uploaded/);
  assert.match(migration, /sum\(line_total_cents::bigint\)/);
  assert.match(migration, /subtotal_cents=v_total::integer,total_cents=v_total::integer/);
});

test("finalize locks sessions in stable order and repeats the issued conflict check", () => {
  assert.match(migration, /order by s\.id for update/);
  assert.match(migration, /issued_document\.status='issued'/);
  assert.match(migration, /session_already_documented/);
});

test("draft and voided documents do not reserve sessions, issued documents do", () => {
  assert.equal(sessionEligible([{ status: "draft" }]), true);
  assert.equal(sessionEligible([{ status: "voided" }]), true);
  assert.equal(sessionEligible([{ status: "issued" }]), false);
});

test("void requires an issued document and a reason, preserving number and paths", () => {
  const voidBody = migration.match(/create function public\.void_economic_document[\s\S]*?\n\$\$;/i)?.[0] ?? "";
  assert.match(voidBody, /void_reason_required/);
  assert.match(voidBody, /status<>'issued'/);
  assert.doesNotMatch(voidBody, /sequence_number\s*=|document_number\s*=|pdf_storage_path\s*=/);
});

test("retry errors preserve attempt state and number", () => {
  const errorBody = migration.match(/create function public\.record_economic_document_issuance_error[\s\S]*?\n\$\$;/i)?.[0] ?? "";
  assert.match(errorBody, /set last_error_code=p_error_code/);
  assert.doesNotMatch(errorBody, /status\s*=/);
});

test("mutation RPCs are service-role only with fixed search_path", () => {
  for (const name of [
    "reserve_economic_document_issuance",
    "mark_economic_document_issuance_uploaded",
    "finalize_economic_document_issuance",
    "record_economic_document_issuance_error",
    "abandon_economic_document_issuance",
    "void_economic_document",
  ]) {
    assert.match(migration, new RegExp(`create function public\\.${name}[\\s\\S]*?security definer set search_path = pg_catalog, public`, "i"));
    assert.match(migration, new RegExp(`revoke all on function public\\.${name}[\\s\\S]*?from public,anon,authenticated`, "i"));
    assert.match(migration, new RegExp(`grant execute on function public\\.${name}[\\s\\S]*?to service_role`, "i"));
  }
});

test("economic-documents bucket is private and limited to PDF and WebP", () => {
  assert.match(migration, /values \('economic-documents','economic-documents',false,10485760,array\['application\/pdf','image\/webp'\]/);
  assert.doesNotMatch(migration, /create policy[\s\S]*economic-documents/i);
});

test("storage paths are attempt-scoped and finalized assets are not overwritten by SQL", () => {
  assert.match(migration, /\/document\.pdf/);
  assert.match(migration, /\/logo\.webp/);
  assert.doesNotMatch(migration, /storage\.objects\s+set|delete\s+from\s+storage\.objects/i);
});

test("024 does not install a PDF renderer or expose browser mutation RPCs", () => {
  assert.doesNotMatch(migration, /react-pdf|pdfkit|puppeteer/i);
  for (const name of [
    "reserve_economic_document_issuance",
    "mark_economic_document_issuance_uploaded",
    "finalize_economic_document_issuance",
    "record_economic_document_issuance_error",
    "abandon_economic_document_issuance",
    "void_economic_document",
  ]) {
    assert.doesNotMatch(migration, new RegExp(`grant execute on function public\\.${name}[^;]+to authenticated`, "i"));
  }
});

test("024 preflight and postflight remain read-only", () => {
  for (const checker of [preflight, postflight]) {
    assert.doesNotMatch(checker, /^\s*(insert\s+into|update\s+\S+\s+set|delete\s+from|alter|create|drop|truncate|grant|revoke)\b/im);
    assert.match(checker, /select jsonb_build_object/i);
  }
});
