import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as appointmentIntegrity from "../appointment-patient-integrity.ts";
import * as appointmentOperations from "../appointments.ts";

const require = createRequire(import.meta.url);
const read = file => fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
function evaluate(file, resolve) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function("require", "module", "exports", compiled)(resolve, module, module.exports);
  return module.exports;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

// Execute the actual provider with deterministic hook state and a fake Supabase
// client. No network, browser or duplicated implementation of save/load logic.
function provider({ cloud = true } = {}) {
  const slots = [], effects = [], writes = [], google = [];
  let cursor = 0, authEvent, load = async () => snapshot(), persist = async () => ({ error: null });
  let account = { id: "synthetic-user-a" }, loadCalls = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useMemo(factory) { const index = cursor++; return slots[index] ||= factory(); },
    useEffect(effect, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        slots[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: account ? { user: account } : null }, error: null }),
      onAuthStateChange(callback) { authEvent = callback; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => authEvent("SIGNED_OUT", null),
    },
    from: table => ({ upsert: row => { writes.push({ table, row }); return persist(table, row); } }),
  };
  const repository = {
    loadCloudData: async (...args) => { loadCalls++; return load(...args); },
    patientRow: (value, userId) => ({ ...value, user_id: userId }),
    goalRow: (value, userId) => ({ ...value, user_id: userId }),
    appointmentRow: (value, userId) => ({ ...value, user_id: userId }),
  };
  const { DataProvider } = evaluate("components/data-provider.tsx", id => {
    if (id === "react") return hooks;
    if (id === "react/jsx-runtime") return require(id);
    if (id === "@/lib/supabase/client") return { createClient: () => client };
    if (id === "@/lib/supabase/repository") return repository;
    if (id === "@/lib/appointment-patient-integrity") return appointmentIntegrity;
    if (id === "@/lib/appointments") return appointmentOperations;
    if (id === "@/lib/data-mode") return { isCloudDataModeConfigured: () => cloud };
    if (id === "@/lib/data/local-store") return { normalizeAppData: value => value, readLocalData: () => ({ data: snapshot(), writable: true }), serializeLocalData: JSON.stringify };
    if (id === "@/lib/google-calendar/client-sync") return { queueGoogleUpsert: (...args) => google.push(args) };
    if (id === "@/lib/auth/session-state") return {
      runAuthBootstrap: async get => { const result = await get(); return { session: result.data.session, status: result.data.session ? "authenticated" : "unauthenticated", error: null }; },
      authStatusFromEvent: (current, event, session) => event === "SIGNED_OUT" ? "unauthenticated" : session ? "authenticated" : current,
    };
    if (id === "@/lib/auth/diagnostics") return { logAuthDiagnostic() {} };
    return {};
  });
  function store() {
    cursor = 0;
    const value = DataProvider({ children: "workspace" }).props.value;
    effects.splice(0).forEach(run => run());
    return value;
  }
  function snapshot() {
    // The provider's own initial shape avoids making a second domain fixture.
    const base = store().data;
    return { ...base, patients: [], goals: [], appointments: [], profile: { ...base.profile, onboardingCompletedAt: "2026-10-01" } };
  }
  store();
  return { store, writes, google, snapshot, setLoad: fn => { load = fn; }, setPersist: fn => { persist = fn; }, get loadCalls() { return loadCalls; }, event: (event, user = account) => { account = user; authEvent(event, user ? { user } : null); } };
}

for (const [table, method, collection] of [["patients", "savePatient", "patients"], ["goals", "saveGoal", "goals"]]) {
  test(`${table}: create/update commits only after server success; failure and retry preserve existing data`, async () => {
    const app = provider(); await tick();
    const original = { id: "synthetic-item", title: "Original", firstName: "Original" };
    await app.store()[method](original);
    const pending = deferred(); app.setPersist(() => pending.promise);
    const edited = { ...original, title: "Edited", firstName: "Edited" };
    const saving = app.store()[method](edited);
    assert.deepEqual(app.store().data[collection], [original]);
    pending.resolve({ error: null }); await saving;
    assert.deepEqual(app.store().data[collection], [edited]);
    app.setPersist(async () => ({ error: { message: "technical database details" } }));
    await assert.rejects(app.store()[method]({ id: "failed-new" }), /Non è stato possibile salvare/);
    await assert.rejects(app.store()[method](original), /Non è stato possibile salvare/);
    assert.deepEqual(app.store().data[collection], [edited]);
    assert.doesNotMatch(app.store().connection.message, /technical database/);
    app.setPersist(async () => ({ error: null }));
    await app.store()[method](original);
    assert.deepEqual(app.store().data[collection], [original]);
    assert.equal(app.writes.length, 5, "one upsert per explicit attempt, no automatic duplicated save");
    assert.ok(app.writes.every(write => write.table === table));
    assert.equal(app.store().connection.kind, "cloud");
  });
}

test("initial cloud error is not ready/empty-success; a coalesced retry can load a genuinely empty archive", async () => {
  const app = provider(); app.setLoad(async () => { throw new Error("internal table error"); });
  await tick();
  const failed = app.store();
  assert.equal(failed.ready, false); assert.equal(failed.authStatus, "authenticated");
  assert.equal(failed.dataLoadStatus, "error");
  assert.match(failed.dataLoadError, /I dati salvati non sono stati cancellati/);
  assert.doesNotMatch(failed.dataLoadError, /internal table/);
  await assert.rejects(failed.savePatient({ id: "blocked" }), /Non è stato possibile salvare/);
  await assert.rejects(failed.saveGoal({ id: "blocked" }), /Non è stato possibile salvare/);
  assert.equal(app.writes.length, 0);
  const pending = deferred(); app.setLoad(() => pending.promise);
  const retry = failed.retryData(), duplicateRetry = failed.retryData();
  assert.equal(app.store().dataLoadStatus, "loading"); assert.equal(app.store().ready, false);
  await tick(); assert.equal(app.loadCalls, 2);
  pending.resolve(app.snapshot()); await Promise.all([retry, duplicateRetry]);
  const empty = app.store();
  assert.equal(empty.dataLoadStatus, "ready"); assert.equal(empty.ready, true);
  assert.equal(empty.dataLoadError, null); assert.deepEqual(empty.data.patients, []);
});

test("initial loading is explicit; duplicate auth events share one repository request", async () => {
  const app = provider(), pending = deferred(); app.setLoad(() => pending.promise);
  assert.equal(app.store().dataLoadStatus, "loading"); assert.equal(app.store().ready, false);
  await tick(); app.event("TOKEN_REFRESHED"); await tick();
  assert.equal(app.loadCalls, 1);
  pending.resolve(app.snapshot()); await tick();
  assert.equal(app.store().ready, true);
});

test("a late cloud response after logout cannot repopulate the archive", async () => {
  const app = provider(), pending = deferred(); app.setLoad(() => pending.promise); await tick();
  app.event("SIGNED_OUT", null);
  pending.resolve({ ...app.snapshot(), patients: [{ id: "old-user-data" }] }); await tick();
  assert.equal(app.store().user, null); assert.deepEqual(app.store().data.patients, []);
});

test("patient failure never queues Google; success queues once after the confirmed write", async () => {
  const app = provider();
  app.setLoad(async () => ({ ...app.snapshot(), appointments: [{ id: "synthetic-appointment", patientId: "synthetic-patient" }] }));
  await tick();
  app.setPersist(async () => { throw Error("network"); });
  await assert.rejects(app.store().savePatient({ id: "synthetic-patient" }), /Non è stato possibile salvare/);
  assert.equal(app.google.length, 0); assert.deepEqual(app.store().data.patients, []);
  app.setPersist(async () => ({ error: null }));
  await app.store().savePatient({ id: "synthetic-patient" });
  assert.equal(app.google.length, 1); assert.equal(app.writes.length, 2);
});

test("a pending mutation cannot commit to the shared state after logout", async () => {
  const app = provider(); await tick();
  const pending = deferred(); app.setPersist(() => pending.promise);
  const saving = app.store().saveGoal({ id: "old-account-goal" });
  app.event("SIGNED_OUT", null); pending.resolve({ error: null });
  await assert.rejects(saving, /Non è stato possibile salvare/);
  assert.deepEqual(app.store().data.goals, []);
});

test("a second failed load retry remains blocked and can retry again successfully", async () => {
  const app = provider(); app.setLoad(async () => { throw Error("offline"); }); await tick();
  await app.store().retryData();
  assert.equal(app.store().dataLoadStatus, "error"); assert.equal(app.store().ready, false);
  app.setLoad(async () => ({ ...app.snapshot(), patients: [{ id: "restored" }] }));
  await app.store().retryData();
  assert.equal(app.store().ready, true); assert.deepEqual(app.store().data.patients, [{ id: "restored" }]);
});

test("an existing complete snapshot stays mounted when a background refresh fails", async () => {
  const app = provider(); await tick(); await app.store().savePatient({ id: "kept" });
  app.setLoad(async () => { throw new Error("offline"); }); await app.store().reload();
  assert.equal(app.store().ready, true); assert.equal(app.store().dataLoadStatus, "ready");
  assert.deepEqual(app.store().data.patients, [{ id: "kept" }]);
});

test("local mode keeps local save semantics and never calls the cloud client", async () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  try {
    const app = provider({ cloud: false });
    await app.store().savePatient({ id: "local-patient" }); await app.store().saveGoal({ id: "local-goal" });
    assert.equal(app.store().ready, true); assert.equal(app.store().dataLoadStatus, "ready");
    assert.equal(app.store().data.patients.length, 1); assert.equal(app.store().data.goals.length, 1);
    assert.equal(app.loadCalls, 0); assert.equal(app.writes.length, 0);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});

function gate(store, pathname = "/pazienti", cloud = true) {
  const redirects = [];
  const { AuthGate } = evaluate("components/auth-gate.tsx", id => {
    if (id === "react") return { ...React, useEffect() {} };
    if (id === "react/jsx-runtime") return require(id);
    if (id === "next/navigation") return { usePathname: () => pathname, useRouter: () => ({ replace: path => redirects.push(path) }) };
    if (id === "@/components/data-provider") return { useData: () => store, isCloudConfigured: cloud };
    return {};
  });
  return renderToStaticMarkup(AuthGate({ children: React.createElement("button", null, "Create patient sentinel") }));
}

test("AuthGate blocks private workspace on data failure, offers data retry, not a fake empty state", async () => {
  const app = provider(); app.setLoad(async () => { throw Error("offline"); }); await tick();
  const html = gate(app.store());
  assert.match(html, /Dati non disponibili/); assert.match(html, /Riprova caricamento/);
  assert.doesNotMatch(html, /Create patient sentinel|Nessun paziente|Verifica.*sessione/);
  assert.match(gate(app.store(), "/privacy"), /Create patient sentinel/);
  assert.match(gate(app.store(), "/pazienti", false), /Create patient sentinel/);
  app.setLoad(async () => app.snapshot()); await app.store().retryData();
  assert.match(gate(app.store()), /Create patient sentinel/);
});

test("linked appointment patient change rejects before any remote, state or Google mutation; corrected retry succeeds", async () => {
  const app = provider();
  const original = { id: "appointment-a", patientId: "patient-a", date: "2026-10-12", time: "10:00", duration: 45, type: "regular", notes: "", createdAt: "2026-10-01" };
  app.setLoad(async () => ({ ...app.snapshot(), appointments: [original], sessions: [{ id: "session-a", patientId: "patient-a", appointmentId: original.id }] }));
  await tick();
  await assert.rejects(app.store().saveAppointments([{ ...original, patientId: "patient-b" }]), appointmentIntegrity.AppointmentPatientIntegrityError);
  assert.equal(app.writes.length, 0); assert.equal(app.google.length, 0);
  assert.deepEqual(app.store().data.appointments, [original]);
  await app.store().saveAppointment({ ...original, notes: "Edited" });
  assert.equal(app.writes.length, 1); assert.equal(app.store().data.appointments[0].notes, "Edited");
});

test("new database FK rejection from a stale snapshot becomes safe patient feedback without committing state", async () => {
  const app = provider(); await tick();
  app.setPersist(async () => ({ error: { code: "23503", message: 'violates foreign key constraint "sessions_appointment_owner_patient_fk"' } }));
  await assert.rejects(app.store().saveAppointment({ id: "a", patientId: "p" }), appointmentIntegrity.AppointmentPatientIntegrityError);
  assert.deepEqual(app.store().data.appointments, []);
  assert.doesNotMatch(app.store().connection.message, /23503|foreign key constraint/);
});
