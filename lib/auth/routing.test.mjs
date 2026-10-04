import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { authRoutingDecision, loginPathFor, safeNextPath } from "./routing.ts";

test("safe next accetta soltanto destinazioni applicative interne", () => {
  assert.equal(safeNextPath("/pazienti/123"), "/pazienti/123");
  assert.equal(safeNextPath("/pazienti/123?tab=x"), "/pazienti/123?tab=x");
  assert.equal(safeNextPath("/pazienti/123?tab=x#focus"), "/pazienti/123?tab=x#focus");
  for (const value of ["//evil.com", "https://evil.com", "http://evil.com", "javascript:alert(1)", "", "%zz", "/unknown", "/login"]) {
    assert.equal(safeNextPath(value), "/oggi", value);
  }
});

test("route private anonime conservano path e query nel login", () => {
  assert.deepEqual(authRoutingDecision({ pathname: "/pazienti/123", destination: "/pazienti/123?tab=resources", localMode: false, authState: "unauthenticated" }), {
    type: "redirect",
    destination: loginPathFor("/pazienti/123?tab=resources"),
  });
  assert.equal(loginPathFor("/pazienti/123?tab=resources"), "/login?next=%2Fpazienti%2F123%3Ftab%3Dresources");
});

test("routing distingue autenticati, anonimi ed errori transitori", () => {
  assert.deepEqual(authRoutingDecision({ pathname: "/pazienti", destination: "/pazienti", localMode: false, authState: "authenticated" }), { type: "pass" });
  assert.deepEqual(authRoutingDecision({ pathname: "/login", destination: "/login", localMode: false, authState: "authenticated" }), { type: "redirect", destination: "/oggi" });
  assert.deepEqual(authRoutingDecision({ pathname: "/login", destination: "/login", localMode: false, authState: "authenticated", requestedNext: "/pazienti/123" }), { type: "redirect", destination: "/pazienti/123" });
  assert.deepEqual(authRoutingDecision({ pathname: "/login", destination: "/login", localMode: false, authState: "unauthenticated" }), { type: "pass" });
  assert.deepEqual(authRoutingDecision({ pathname: "/pazienti", destination: "/pazienti", localMode: false, authState: "error" }), { type: "pass" });
});

test("root usa lo stato server e local mode bypassa il login", () => {
  assert.deepEqual(authRoutingDecision({ pathname: "/", destination: "/", localMode: false, authState: "authenticated" }), { type: "redirect", destination: "/oggi" });
  assert.deepEqual(authRoutingDecision({ pathname: "/", destination: "/", localMode: false, authState: "unauthenticated" }), { type: "redirect", destination: "/login" });
  assert.deepEqual(authRoutingDecision({ pathname: "/", destination: "/", localMode: true, authState: "authenticated" }), { type: "redirect", destination: "/oggi" });
  assert.deepEqual(authRoutingDecision({ pathname: "/pazienti", destination: "/pazienti", localMode: true, authState: "authenticated" }), { type: "pass" });
});

test("route pubbliche, API e Calendar Feed non vengono trasformati in login", () => {
  for (const pathname of ["/about", "/privacy", "/signup", "/check-email", "/auth/callback", "/calendar/private-token.ics", "/api/google-calendar/callback", "/api/clinical-tools/tool/materials/file"]) {
    assert.deepEqual(authRoutingDecision({ pathname, destination: pathname, localMode: false, authState: "unauthenticated" }), { type: "pass" }, pathname);
  }
});

test("signup è pubblico per anonimi ma non per autenticati o local mode", () => {
  assert.deepEqual(authRoutingDecision({ pathname: "/signup", destination: "/signup", localMode: false, authState: "unauthenticated" }), { type: "pass" });
  assert.deepEqual(authRoutingDecision({ pathname: "/signup", destination: "/signup", localMode: false, authState: "authenticated" }), { type: "redirect", destination: "/oggi" });
  assert.deepEqual(authRoutingDecision({ pathname: "/signup", destination: "/signup", localMode: true, authState: "authenticated" }), { type: "redirect", destination: "/oggi" });
});

test("middleware esclude API, callback Google, feed e asset e usa getUser", () => {
  const middleware = fs.readFileSync(new URL("../../middleware.ts", import.meta.url), "utf8");
  const session = fs.readFileSync(new URL("../supabase/middleware.ts", import.meta.url), "utf8");
  assert.match(middleware, /api\(\?:\/\|\$\)/);
  assert.match(middleware, /calendar\(\?:\/\|\$\)/);
  assert.match(session, /auth\.getUser\(\)/);
  assert.doesNotMatch(session, /auth\.getSession\(\)/);
});
