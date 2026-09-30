import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { appendAuthDiagnostic, AUTH_DIAGNOSTICS_KEY, AUTH_DIAGNOSTICS_LIMIT, sanitizedAuthErrorCode } from "./diagnostics.ts";
import { authStatusFromBootstrap, authStatusFromEvent, runAuthBootstrap } from "./session-state.ts";

test("bootstrap con sessione valida è authenticated", () => {
  assert.equal(authStatusFromBootstrap({ error: null, sessionPresent: true }), "authenticated");
});

test("bootstrap senza sessione è unauthenticated", () => {
  assert.equal(authStatusFromBootstrap({ error: null, sessionPresent: false }), "unauthenticated");
});

test("errore getSession resta error e non diventa unauthenticated", () => {
  assert.equal(authStatusFromBootstrap({ error: { code: "network_error" }, sessionPresent: false }), "error");
});

test("retry riesegue il bootstrap e può recuperare una sessione valida", async () => {
  let attempts = 0;
  const getSession = async () => ++attempts === 1
    ? { data: { session: null }, error: { code: "network_error" } }
    : { data: { session: { expires_at: 123 } }, error: null };
  assert.equal((await runAuthBootstrap(getSession)).status, "error");
  assert.equal((await runAuthBootstrap(getSession)).status, "authenticated");
  assert.equal(attempts, 2);
});

test("SIGNED_OUT vero porta a unauthenticated", () => {
  assert.equal(authStatusFromEvent("authenticated", "SIGNED_OUT", false), "unauthenticated");
});

test("TOKEN_REFRESHED con sessione mantiene authenticated", () => {
  assert.equal(authStatusFromEvent("error", "TOKEN_REFRESHED", true), "authenticated");
});

test("evento nullo non equivalente a logout conserva lo stato", () => {
  assert.equal(authStatusFromEvent("error", "TOKEN_REFRESHED", false), "error");
});

test("logger conserva un buffer limitato", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  for (let index = 0; index < AUTH_DIAGNOSTICS_LIMIT + 5; index += 1) {
    appendAuthDiagnostic(storage, { timestamp: String(index), event: "TEST", route: "/oggi", sessionPresent: false, online: true, visibility: "visible" });
  }
  const entries = JSON.parse(storage.getItem(AUTH_DIAGNOSTICS_KEY));
  assert.equal(entries.length, AUTH_DIAGNOSTICS_LIMIT);
  assert.equal(entries.at(0).timestamp, "5");
});

test("diagnostica sanitizza errori e non conserva token email o user id", () => {
  assert.equal(sanitizedAuthErrorCode({ code: "refresh_token_not_found", message: "secret@example.it token-value", user_id: "123" }), "refresh_token_not_found");
  const source = JSON.stringify({ code: sanitizedAuthErrorCode({ name: "AuthRetryableFetchError", message: "secret@example.it token-value" }) });
  assert.doesNotMatch(source, /secret@example\.it|token-value|user_id/);
});

test("AuthGate non redirige su auth error e offre retry", async () => {
  const source = await readFile(new URL("../../components/auth-gate.tsx", import.meta.url), "utf8");
  assert.match(source, /authStatus === "unauthenticated"/);
  assert.match(source, /authStatus === "error"/);
  assert.match(source, /retryAuth/);
});

test("DataProvider separa errore dati da stato auth e conserva logout esplicito", async () => {
  const source = await readFile(new URL("../../components/data-provider.tsx", import.meta.url), "utf8");
  assert.match(source, /runAuthBootstrap/);
  assert.match(source, /const fail=.*setError/);
  assert.doesNotMatch(source, /const fail=.*setAuthStatus/);
  assert.match(source, /client\.auth\.signOut\(\)/);
});
