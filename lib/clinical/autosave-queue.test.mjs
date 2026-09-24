import assert from "node:assert/strict";
import test from "node:test";
import { ClinicalAutosaveQueue } from "./autosave-queue.ts";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

test("serializza i salvataggi e lascia vincere l'ultimo draft", async () => {
  const queue = new ClinicalAutosaveQueue();
  const firstGate = deferred();
  const writes = [];

  const first = queue.enqueue(async () => {
    await firstGate.promise;
    writes.push("prima revisione");
  });
  const second = queue.enqueue(async () => {
    writes.push("ultima revisione");
  });

  await Promise.resolve();
  assert.deepEqual(writes, []);
  firstGate.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(writes, ["prima revisione", "ultima revisione"]);
});

test("un errore non impedisce il salvataggio successivo", async () => {
  const queue = new ClinicalAutosaveQueue();
  const writes = [];

  const failed = queue.enqueue(async () => {
    throw new Error("errore temporaneo");
  });
  const recovered = queue.enqueue(async () => {
    writes.push("draft recuperato");
  });

  await assert.rejects(failed, /errore temporaneo/);
  await recovered;
  assert.deepEqual(writes, ["draft recuperato"]);
});

test("il chiamante può attendere il salvataggio più recente", async () => {
  const queue = new ClinicalAutosaveQueue();
  const firstGate = deferred();
  let saved = "";

  void queue.enqueue(async () => {
    await firstGate.promise;
    saved = "precedente";
  });
  const latest = queue.enqueue(async () => {
    saved = "corrente";
  });

  firstGate.resolve();
  await latest;
  assert.equal(saved, "corrente");
});
