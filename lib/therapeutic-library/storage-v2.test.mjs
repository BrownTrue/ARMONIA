import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import { MAX_MATERIAL_FILE_BYTES, MATERIAL_FILE_TYPES, STORAGE_QUOTA_BYTES, formatStorageBytes, materialUploadErrorMessage, validateMaterialFileContent, validateMaterialFileDeclaration } from "./files.ts";
import { resolveAmbiguousCommit } from "./finalize.ts";
import { buildStorageReconciliationReport, collectAllPages, walkStorageNamespace } from "./reconciliation.ts";
import { deleteTherapeuticMaterialRecord } from "./delete.ts";
import { deleteTherapeuticMaterial, materialDeleteErrorMessage } from "./material-api.ts";
import { acquireSingleFlight, releaseSingleFlight } from "./single-flight.ts";

const migration014 = await readFile(new URL("../../supabase/migrations/014_therapeutic_library_storage_foundation.sql", import.meta.url), "utf8");
const migration015 = await readFile(new URL("../../supabase/migrations/015_therapeutic_library_storage_enforcement.sql", import.meta.url), "utf8");
const prepareRoute = await readFile(new URL("../../app/api/materials/upload/prepare/route.ts", import.meta.url), "utf8");
const finalizeRoute = await readFile(new URL("../../app/api/materials/upload/finalize/route.ts", import.meta.url), "utf8");
const deleteRoute = await readFile(new URL("../../app/api/materials/[id]/route.ts", import.meta.url), "utf8");
const deleteHelper = await readFile(new URL("./delete.ts", import.meta.url), "utf8");
const saveRoute = await readFile(new URL("../../app/api/materials/route.ts", import.meta.url), "utf8");
const serverHelpers = await readFile(new URL("./server.ts", import.meta.url), "utf8");
const materialsPage = await readFile(new URL("../../app/materiali/page.tsx", import.meta.url), "utf8");
const dataProvider = await readFile(new URL("../../components/data-provider.tsx", import.meta.url), "utf8");
const declaration = (fileName, mimeType, size = MAX_MATERIAL_FILE_BYTES) => validateMaterialFileDeclaration({ fileName, mimeType, size });

test("quota e limite singolo hanno i valori prodotto", () => {
  assert.equal(STORAGE_QUOTA_BYTES, 1_073_741_824); assert.equal(MAX_MATERIAL_FILE_BYTES, 20_971_520);
  assert.equal(declaration("ok.pdf", "application/pdf").size, MAX_MATERIAL_FILE_BYTES);
  assert.throws(() => declaration("too-big.pdf", "application/pdf", MAX_MATERIAL_FILE_BYTES + 1), /20 MB/);
});

test("whitelist accetta solo le combinazioni estensione MIME previste", () => {
  [["a.pdf","application/pdf"],["a.png","image/png"],["a.jpg","image/jpeg"],["a.jpeg","image/jpeg"],["a.mp3","audio/mpeg"],["a.m4a","audio/mp4"],["a.wav","audio/x-wav"],["a.docx",MATERIAL_FILE_TYPES.docx[0]]].forEach(([name,mime]) => assert.doesNotThrow(() => declaration(name,mime,100)));
  [["a.doc","application/msword"],["a.docm","application/vnd.ms-word.document.macroEnabled.12"],["a.mp4","audio/mp4"],["a.mov","video/quicktime"],["a.avi","video/x-msvideo"],["a.exe","application/vnd.microsoft.portable-executable"],["a.zip","application/zip"],["a.pdf","image/png"]].forEach(([name,mime]) => assert.throws(() => declaration(name,mime,100)));
});

test("JPG e JPEG reali sono accettati, il contenuto falso è rifiutato", () => {
  assert.doesNotThrow(() => declaration("foto.jpg", "image/jpeg", 2_700_000));
  assert.doesNotThrow(() => declaration("foto.jpeg", "image/jpeg", 2_700_000));
  assert.doesNotThrow(() => validateMaterialFileContent("jpeg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00])));
  assert.throws(() => validateMaterialFileContent("jpeg", strToU8("not-a-jpeg")), /contenuto/i);
});

test("magic bytes validano PDF PNG JPEG MP3 M4A e WAV", () => {
  validateMaterialFileContent("pdf", strToU8("%PDF-1.7")); validateMaterialFileContent("png", Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  validateMaterialFileContent("jpg", Uint8Array.from([0xff,0xd8,0xff,0xe0])); validateMaterialFileContent("mp3", Uint8Array.from([0xff,0xfb,0x90,0x64]));
  validateMaterialFileContent("m4a", strToU8("0000ftypM4A isom0000hdlr00000000soun")); validateMaterialFileContent("wav", strToU8("RIFF0000WAVEdata"));
  assert.throws(() => validateMaterialFileContent("pdf", strToU8("fake")));
  assert.throws(() => validateMaterialFileContent("mp3", strToU8("ID3audio")));
  assert.throws(() => validateMaterialFileContent("m4a", strToU8("0000ftypisom0000hdlr00000000vide")));
});

test("DOCX anomali, zip bomb e path sospetti sono rifiutati senza estrazione filesystem", () => {
  const contentTypes = '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const oversized = new Uint8Array(26 * 1_048_576);
  assert.throws(() => validateMaterialFileContent("docx", zipSync({ "[Content_Types].xml": strToU8(contentTypes), "word/document.xml": oversized }, { level: 9 })));
  assert.throws(() => validateMaterialFileContent("docx", zipSync({ "[Content_Types].xml": strToU8(contentTypes), "word/document.xml": strToU8("<w:document/>"), "../escape.xml": strToU8("x") })));
});

test("DOCX vero è accettato, ZIP generico e macro sono rifiutati", () => {
  const contentTypes = '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  validateMaterialFileContent("docx", zipSync({ "[Content_Types].xml": strToU8(contentTypes), "word/document.xml": strToU8("<w:document/>") }));
  assert.throws(() => validateMaterialFileContent("docx", zipSync({ "hello.txt": strToU8("hello") })));
  assert.throws(() => validateMaterialFileContent("docx", zipSync({ "[Content_Types].xml": strToU8(contentTypes), "word/document.xml": strToU8("<w:document/>"), "word/vbaProject.bin": strToU8("macro") })));
});

test("reservation quota è atomica, scade e aggiorna used/reserved", () => {
  assert.match(migration014, /from public\.user_storage_accounts where user_id = p_user_id for update/i);
  assert.match(migration014, /used_bytes \+ account\.reserved_bytes \+ p_expected_bytes > account\.quota_bytes/i);
  assert.match(migration014, /status = 'cleanup_required'.*failure_code = 'expired_cleanup_required'/is);
  assert.doesNotMatch(migration014, /status = 'released'.*failure_code = 'expired'/is);
  assert.match(migration014, /reserved_bytes = greatest\(0, reserved_bytes - reservation\.expected_bytes\)/i);
  assert.match(migration014, /used_bytes = used_bytes \+ p_verified_bytes/i);
});

test("reservation scadute restano contabilizzate fino a verifica e cleanup confermato", () => {
  assert.match(migration014, /status in \('pending','cleanup_required'\)/);
  assert.match(serverHelpers, /const exists = .*\.some\(object => object\.name === name\)/);
  assert.match(serverHelpers, /if \(exists\)[\s\S]*\.remove\(\[objectPath\]\)[\s\S]*if \(removal\.error\) continue/);
  assert.match(serverHelpers, /releaseStorageReservation\(userId, String\(reservation\.id\), "expired_cleaned"\)/);
  assert.match(finalizeRoute, /if \(cleanupFailed\) await requireStorageReservationCleanup/);
});

test("initialize non resetta account e reconciliation rifiuta reservation attive", () => {
  assert.doesNotMatch(migration014, /on conflict \(user_id\) do update set quota_bytes=excluded\.quota_bytes/);
  assert.match(migration014, /create or replace function public\.reconcile_user_storage_account/);
  assert.match(migration014, /status in \('pending','cleanup_required'\)[\s\S]*raise exception 'active_storage_reservations'/);
});

test("funzioni quota rispettano lock order account poi reservation/material", () => {
  const functions = ["release_therapeutic_storage_reservation", "commit_therapeutic_storage_upload", "delete_therapeutic_material_record"];
  for (const name of functions) {
    const start = migration014.indexOf(`function public.${name}`), end = migration014.indexOf("$$;", start);
    const sql = migration014.slice(start, end);
    assert.ok(sql.indexOf("from public.user_storage_accounts") < sql.indexOf("from public.storage_upload_reservations") || !sql.includes("from public.storage_upload_reservations"));
    assert.ok(sql.indexOf("from public.user_storage_accounts") < sql.indexOf("from public.materials") || !sql.includes("from public.materials"));
  }
});

test("reservation e delete sono vincolati allo user autenticato", () => {
  assert.match(finalizeRoute, /\.eq\("id", reservationId\)\.eq\("user_id", userId\)/);
  assert.match(migration014, /where id = p_reservation_id and user_id = p_user_id for update/);
  assert.match(deleteRoute, /\.eq\("id", id\)\.eq\("user_id", userId\)/); assert.match(deleteHelper, /startsWith\(`\$\{userId\}\/`\)/);
  assert.match(prepareRoute, /authenticatedUserId\(\)/); assert.doesNotMatch(prepareRoute, /body\.userId|body\.path|body\.materialId/);
});

test("finalize normale e retry committed restituiscono lo stesso materialId senza doppia contabilizzazione", async () => {
  assert.match(migration014, /if reservation\.status = 'committed'[\s\S]*return reservation\.material_id/);
  assert.equal((migration014.match(/used_bytes = used_bytes \+ p_verified_bytes/g) || []).length, 1);
  assert.equal((migration014.match(/reserved_bytes = greatest\(0, reserved_bytes - reservation\.expected_bytes\)/g) || []).length >= 1, true);
  const result = await resolveAmbiguousCommit(async () => ({ status: "committed", materialId: "material-1" }), async id => id === "material-1");
  assert.deepEqual(result, { kind: "committed", materialId: "material-1" });
  assert.match(finalizeRoute, /reservation\.status === "committed"[\s\S]*alreadyCommitted: true/);
});

test("commit ambiguo rilegge lo stato e non autorizza mai cleanup distruttivo", async () => {
  let cleanupCalled = false;
  const committed = await resolveAmbiguousCommit(async () => ({ status: "committed", materialId: "m1" }), async () => true);
  if (committed.kind !== "committed") cleanupCalled = true;
  assert.equal(cleanupCalled, false);
  assert.deepEqual(await resolveAmbiguousCommit(async () => ({ status: "pending", materialId: "m1" }), async () => true), { kind: "retry" });
  assert.deepEqual(await resolveAmbiguousCommit(async () => { throw new Error("network"); }, async () => true), { kind: "unavailable" });
  const afterRpc = finalizeRoute.slice(finalizeRoute.indexOf("let commitResult"));
  assert.doesNotMatch(afterRpc, /\.remove\(|releaseStorageReservation|requireStorageReservationCleanup/);
  assert.match(finalizeRoute.slice(0, finalizeRoute.indexOf("let commitResult")), /validation_failed/);
});

test("015 mantiene lettura privata e rimuove soltanto mutazioni dirette", () => {
  assert.match(migration015, /public = false/); assert.match(migration015, /file_size_limit = 20971520/);
  assert.match(migration015, /drop policy if exists "private material write"/); assert.match(migration015, /drop policy if exists "private material update"/); assert.match(migration015, /drop policy if exists "private material delete"/);
  assert.match(migration015, /revoke all privileges on table public\.materials from authenticated/);
  assert.match(migration015, /grant select on table public\.materials to authenticated/);
  assert.doesNotMatch(migration015, /drop policy if exists "private material read"/);
});

test("client non può scrivere campi storage-authoritative dopo enforcement", () => {
  assert.match(saveRoute, /authenticatedUserId\(\)/);
  assert.match(saveRoute, /const safeMetadata =/);
  assert.doesNotMatch(saveRoute.slice(saveRoute.indexOf("if (existing)"), saveRoute.indexOf("} else {")), /storage_path|file_size|mime_type|external_url/);
  assert.match(saveRoute, /user_id: userId/);
  assert.match(saveRoute, /storage_path: null, mime_type: null, file_size: 0/);
});

test("reconciliation segnala orfani e mismatch senza cancellare", () => {
  const report = buildStorageReconciliationReport([{ materialId:"m1",path:"u/m1/a.pdf",size:10 },{ materialId:"m2",path:"u/m2/b.pdf",size:20 }],[{ path:"u/m1/a.pdf",size:11 },{ path:"u/m3/c.pdf",size:30 }]);
  assert.equal(report.storageOrphans.length,1); assert.equal(report.databaseOrphans.length,1); assert.equal(report.sizeMismatches.length,1); assert.equal(report.totalRealBytes,41); assert.equal(report.totalDatabaseBytes,30);
  assert.equal(String(buildStorageReconciliationReport).includes("delete"), false);
});

test("reconciliation pagina oltre 1000 righe DB senza perdite o duplicati", async () => {
  const rows = Array.from({ length: 1205 }, (_, index) => ({ id: index }));
  const fetched = await collectAllPages(500, async (from, to) => rows.slice(from, to + 1));
  assert.equal(fetched.length, 1205);
  assert.equal(new Set(fetched.map(row => row.id)).size, 1205);
  assert.match(serverHelpers, /\.order\("id", \{ ascending: true \}\)\.range\(from, to\)/);
});

test("reconciliation Storage è ricorsiva, paginata e include path diretti e annidati", async () => {
  const tree = new Map([
    ["u", [{ name: "direct.pdf", metadata: { size: 1 } }, { name: "m1", metadata: null }, ...Array.from({ length: 101 }, (_, i) => ({ name: `root-${i}.pdf`, metadata: { size: 1 } }))]],
    ["u/m1", [{ name: "legacy.pdf", metadata: { size: 2 } }, { name: "deep", metadata: null }]],
    ["u/m1/deep", [{ name: "v2.pdf", metadata: { size: 3 } }]],
  ]);
  const objects = await walkStorageNamespace("u", async (prefix, offset, limit) => (tree.get(prefix) || []).slice(offset, offset + limit), 100);
  const paths = objects.map(object => object.path);
  assert.ok(paths.includes("u/direct.pdf"));
  assert.ok(paths.includes("u/m1/legacy.pdf"));
  assert.ok(paths.includes("u/m1/deep/v2.pdf"));
  assert.equal(paths.length, 104);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(objects.reduce((sum, object) => sum + object.size, 0), 107);
});

test("SECURITY DEFINER usa search_path esplicito ed execute solo service_role", () => {
  const definitions = migration014.match(/language plpgsql security definer set search_path = pg_catalog, public/g) || [];
  assert.equal(definitions.length, 8);
  assert.equal((migration014.match(/revoke all on function .* from public, anon, authenticated;/g) || []).length, 8);
  assert.equal((migration014.match(/grant execute on function .* to service_role;/g) || []).length, 8);
});

test("link è quota-free e UI offre errori, CTA e formatter", () => {
  assert.match(materialsPage, /Non utilizza spazio ARMONIA/); assert.match(materialsPage, /Aggiungi un link/); assert.match(materialsPage, /externalUrl: mode === "link" \? v\.externalUrl : undefined/);
  assert.equal(materialUploadErrorMessage("file_too_large"), "Il file supera il limite di 20 MB."); assert.equal(materialUploadErrorMessage("unsupported_format"), "Questo formato non è supportato."); assert.equal(formatStorageBytes(STORAGE_QUOTA_BYTES), "1 GB");
});

test("il guard single-flight accetta soltanto il primo di submit ravvicinati", () => {
  const gate = { current: false };
  assert.equal(acquireSingleFlight(gate), true);
  assert.equal(acquireSingleFlight(gate), false);
  assert.equal(acquireSingleFlight(gate), false);
  releaseSingleFlight(gate);
  assert.equal(acquireSingleFlight(gate), true);
});

test("la UI blocca submit e delete ripetuti e ripristina i controlli", () => {
  assert.match(materialsPage, /if \(!acquireSingleFlight\(uploadGuard\)\) return/);
  assert.match(materialsPage, /setUploading\(true\)/);
  assert.match(materialsPage, /finally[\s\S]*releaseSingleFlight\(uploadGuard\)[\s\S]*setUploading\(false\)/);
  assert.match(materialsPage, /disabled=\{uploading/);
  assert.match(materialsPage, /Caricamento…/);
  assert.match(materialsPage, /if \(completed\)[\s\S]*setFile\(undefined\)[\s\S]*onDone\(\)/);
  assert.match(materialsPage, /deletingRef\.current\.has\(m\.id\)/);
  assert.match(materialsPage, /await loadStorage\(\)/);
  assert.match(materialsPage, /role="alert"/);
});

test("delete storage-backed V2 e legacy rimuove Storage e record una sola volta", async () => {
  for (const path of ["user-1/material-1/file.pdf", "user-1/material-1/legacy-name.pdf"]) {
    let removed = 0, deleted = 0;
    const result = await deleteTherapeuticMaterialRecord({
      userId: "user-1", material: { id: "material-1", storagePath: path },
      removeStorageObject: async () => { removed += 1; return {}; },
      deleteRecord: async () => { deleted += 1; },
    });
    assert.deepEqual(result, { alreadyDeleted: false });
    assert.equal(removed, 1); assert.equal(deleted, 1);
  }
});

test("delete link esterno non tocca Storage ma elimina il record", async () => {
  let removed = 0, deleted = 0;
  await deleteTherapeuticMaterialRecord({
    userId: "user-1", material: { id: "link-1", storagePath: null },
    removeStorageObject: async () => { removed += 1; return {}; },
    deleteRecord: async () => { deleted += 1; },
  });
  assert.equal(removed, 0); assert.equal(deleted, 1);
});

test("delete è ripetibile e un oggetto Storage già assente non blocca il record", async () => {
  let deleted = 0;
  await deleteTherapeuticMaterialRecord({
    userId: "user-1", material: { id: "material-1", storagePath: "user-1/material-1/file.pdf" },
    removeStorageObject: async () => ({ error: { status: 404, message: "not found" } }),
    deleteRecord: async () => { deleted += 1; },
  });
  const retry = await deleteTherapeuticMaterialRecord({
    userId: "user-1", material: null,
    removeStorageObject: async () => { throw new Error("must not run"); },
    deleteRecord: async () => { deleted += 1; },
  });
  assert.equal(deleted, 1);
  assert.deepEqual(retry, { alreadyDeleted: true });
  assert.equal((migration014.match(/used_bytes = greatest\(0, used_bytes - bytes\)/g) || []).length, 1);
});

test("il client delete distingue sessione, rete e server senza alterare lo stato sync globale", async () => {
  await assert.rejects(() => deleteTherapeuticMaterial("m1", async () => new Response(JSON.stringify({ error: "material_auth_required" }), { status: 401 })), error => materialDeleteErrorMessage(error).includes("sessione è scaduta"));
  await assert.rejects(() => deleteTherapeuticMaterial("m1", async () => { throw new Error("offline"); }), error => materialDeleteErrorMessage(error).includes("raggiungere il server"));
  await assert.rejects(() => deleteTherapeuticMaterial("m1", async () => new Response(JSON.stringify({ error: "material_delete_failed" }), { status: 500 })), error => materialDeleteErrorMessage(error).includes("eliminare il materiale"));
  assert.match(dataProvider, /await deleteTherapeuticMaterial\(id\)/);
  const materialBlock = dataProvider.slice(dataProvider.indexOf("const saveMaterial"), dataProvider.indexOf("const getMaterialFile"));
  assert.doesNotMatch(materialBlock, /fail\(/);
  assert.match(deleteRoute, /status: 401/);
});
