import assert from "node:assert/strict";
import test from "node:test";
import { removeLinkedGoogleEvent } from "./event-link-cleanup.ts";
import { isGoogleDeleteAlreadyAbsent, processQueueSnapshot, reconcileStaleUpserts } from "./sync-queue.ts";

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
