import assert from "node:assert/strict";
import test from "node:test";
import { removeLinkedGoogleEvent } from "./event-link-cleanup.ts";
import { isGoogleDeleteAlreadyAbsent, processQueueSnapshot, reconcileStaleUpserts } from "./sync-queue.ts";
import { googleOAuthResponseError } from "./oauth-error.ts";

test("espone invalid_grant senza includere la descrizione", async () => {
  const error = await googleOAuthResponseError(new Response(JSON.stringify({ error: "invalid_grant", error_description: "refresh_token=segreto" }), { status: 400 }), "Rinnovo autorizzazione Google non riuscito");
  assert.equal(error.message, "Rinnovo autorizzazione Google non riuscito: invalid_grant");
  assert.equal(error.message.includes("segreto"), false);
  assert.equal(error.oauthCode, "invalid_grant");
});

test("espone invalid_client senza includere credenziali", async () => {
  const error = await googleOAuthResponseError(new Response(JSON.stringify({ error: "invalid_client", error_description: "client_secret=molto-segreto" }), { status: 400 }), "Rinnovo autorizzazione Google non riuscito");
  assert.equal(error.message, "Rinnovo autorizzazione Google non riuscito: invalid_client");
  assert.equal(error.message.includes("molto-segreto"), false);
});

test("usa lo status HTTP per una risposta OAuth non JSON", async () => {
  const error = await googleOAuthResponseError(new Response("gateway response con token-non-esporre", { status: 502 }), "Scambio OAuth non riuscito");
  assert.equal(error.message, "Scambio OAuth non riuscito: HTTP 502");
  assert.equal(error.message.includes("token-non-esporre"), false);
});

test("un errore temporaneo non impedisce di processare la voce successiva", async () => {
  const queue = [{ id: "first" }, { id: "second" }];
  const processed = [];
  const errors = await processQueueSnapshot(queue, id => queue.find(item => item.id === id), async item => {
    processed.push(item.id);
    if (item.id === "first") throw new Error("temporaneo");
  });
  assert.deepEqual(processed, ["first", "second"]);
  assert.equal(errors.length, 1);
});

test("ogni elemento iniziale viene tentato al massimo una volta per flush", async () => {
  const queue = [{ id: "same" }];
  let attempts = 0;
  await processQueueSnapshot(queue, id => queue.find(item => item.id === id), async () => {
    attempts += 1;
    throw new Error("ancora pendente");
  });
  assert.equal(attempts, 1);
});

test("un errore OAuth interrompe i tentativi successivi e lascia la coda invariata", async () => {
  const queue = [{ id: "first" }, { id: "second" }, { id: "third" }];
  const snapshot = structuredClone(queue);
  let attempts = 0;
  const errors = await processQueueSnapshot(queue, id => queue.find(item => item.id === id), async () => {
    attempts += 1;
    const error = new Error("Rinnovo autorizzazione Google non riuscito: invalid_grant");
    Object.assign(error, { errorType: "google_oauth" });
    throw error;
  }, error => error.errorType === "google_oauth");
  assert.equal(attempts, 1);
  assert.equal(errors.length, 1);
  assert.deepEqual(queue, snapshot);
});

test("appointment inesistente senza mapping termina con successo", async () => {
  let deleted = false;
  const result = await removeLinkedGoogleEvent({
    find: async () => null,
    markSyncing: async () => {},
    deleteGoogleEvent: async () => { deleted = true; },
    remove: async () => {},
    markError: async () => {},
  });
  assert.deepEqual(result, { ok: true, hadMapping: false });
  assert.equal(deleted, false);
});

test("appointment inesistente con mapping elimina evento e mapping", async () => {
  const calls = [];
  const result = await removeLinkedGoogleEvent({
    find: async () => ({ googleEventId: "google-1", attemptCount: 2 }),
    markSyncing: async count => calls.push(["syncing", count]),
    deleteGoogleEvent: async id => calls.push(["google", id]),
    remove: async () => calls.push(["mapping"]),
    markError: async () => {},
  });
  assert.deepEqual(result, { ok: true, hadMapping: true });
  assert.deepEqual(calls, [["syncing", 3], ["google", "google-1"], ["mapping"]]);
});

test("delete Google 404 è idempotente", () => {
  assert.equal(isGoogleDeleteAlreadyAbsent({ status: 404 }), true);
});

test("delete Google 410 è idempotente", () => {
  assert.equal(isGoogleDeleteAlreadyAbsent({ status: 410 }), true);
});

test("Sincronizza ora trasforma gli upsert obsoleti in delete", () => {
  const queue = [{ id: "q1", key: "old", action: "upsert", appointmentId: "old" }];
  const result = reconcileStaleUpserts(queue, new Set(["current"]), item => item.appointmentId, (item, appointmentId) => ({ ...item, action: "delete", appointmentId }));
  assert.equal(result[0].action, "delete");
  assert.equal(result[0].appointmentId, "old");
});

test("Sincronizza ora preserva i delete già presenti", () => {
  const queuedDelete = { id: "q1", key: "old", action: "delete", appointmentId: "old" };
  const result = reconcileStaleUpserts([queuedDelete], new Set(), item => item.appointmentId, item => item);
  assert.strictEqual(result[0], queuedDelete);
});

test("gli appointment validi restano normali upsert e vengono processati", async () => {
  const valid = { id: "q1", action: "upsert", appointmentId: "appointment-1" };
  const reconciled = reconcileStaleUpserts([valid], new Set(["appointment-1"]), item => item.appointmentId, item => item);
  const processed = [];
  const errors = await processQueueSnapshot(reconciled, id => reconciled.find(item => item.id === id), async item => { processed.push(item.appointmentId); });
  assert.strictEqual(reconciled[0], valid);
  assert.deepEqual(processed, ["appointment-1"]);
  assert.deepEqual(errors, []);
});
