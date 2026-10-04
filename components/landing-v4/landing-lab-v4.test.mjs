import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("./landing-lab-v4.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./landing-lab-v4.module.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/landing-lab-v4/page.tsx", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const v3 = fs.readFileSync(new URL("../landing-v3/landing-lab-v3.tsx", import.meta.url), "utf8");

test("V4 è isolata, riusa V3 e non sostituisce root", () => {
  assert.match(page, /LandingLabV4/);
  assert.match(component, /<LandingLabV3/);
  assert.doesNotMatch(root, /LandingLabV4/);
  assert.doesNotMatch(v3, /LandingLabV4/);
});

test("pricing LAB è locale, tipizzato e senza billing reale", () => {
  assert.match(component, /monthlyPrice: 15/);
  assert.match(component, /annualPrice: 120/);
  assert.match(component, /pricingStatus: "prototype"/);
  assert.match(component, /Prezzo provvisorio/);
  assert.match(component, /aria-pressed=/);
  assert.match(component, /Nessun checkout o abbonamento è collegato/);
  assert.doesNotMatch(component, /from ["']stripe|createCheckout|checkoutSession|subscriptionId|trialDays/i);
});

test("studi e centri sono annunciati senza promesse non esistenti", () => {
  assert.match(component, /Studi e centri/);
  assert.match(component, /Prossimamente/);
  assert.match(component, /funzione dimostrativa del lab/);
  assert.doesNotMatch(component, /amministratore centro|gestione équipe|ruoli multiutente/i);
});

test("supporto e form restano demo senza trasmissione", () => {
  assert.match(component, /indirizzo previsto · non ancora operativo/g);
  assert.match(component, /Modulo non ancora collegato/);
  assert.match(component, /Nessun dato è stato inviato/);
  assert.doesNotMatch(component, /mailto:|fetch\(|axios|\/api\/contact/i);
});

test("FAQ usa disclosure native e claim verificabili", () => {
  assert.match(component, /<details/);
  assert.match(component, /<summary/);
  assert.match(component, /esportazione dei dati/);
  assert.doesNotMatch(component, /GDPR compliant|medical grade|E2E|backup automatic/i);
});

test("responsive e reduced motion sono previsti", () => {
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(component, /data-provisional-visual="agenda"/);
});
