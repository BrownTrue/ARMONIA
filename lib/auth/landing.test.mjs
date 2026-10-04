import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const home = fs.readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const gate = fs.readFileSync(new URL("../../components/auth-gate.tsx", import.meta.url), "utf8");

test("la landing espone CTA pubbliche, sezioni reali e canonical", () => {
  assert.match(home, /https:\/\/conarmonia\.it/);
  for (const href of ["/signup", "/login", "/privacy"]) assert.match(home, new RegExp(`href=["']${href}["']`));
  for (const label of ["Percorso clinico", "Agenda e sedute", "Laboratorio", "Strumenti clinici", "Economia", "Modulistica e handout"]) assert.match(home, new RegExp(label));
});

test("la landing usa mockup in codice e non screenshot applicativi", () => {
  assert.match(home, /function ProductMockup/);
  assert.doesNotMatch(home, /screenshot/i);
  assert.doesNotMatch(home, /\.(png|jpg|jpeg|webp)["']/i);
});

test("AuthGate non mostra la landing mentre verifica un utente autenticato", () => {
  assert.match(gate, /const isLandingPath = pathname === "\/"/);
  assert.match(gate, /if \(authStatus === "unauthenticated"\) return <>{children}<\/>/);
  assert.match(gate, /isLandingPath\) router\.replace\(onboardingIncomplete \? "\/onboarding" : "\/oggi"\)/);
});
