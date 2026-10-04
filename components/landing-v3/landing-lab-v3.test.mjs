import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("./landing-lab-v3.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./landing-lab-v3.module.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/landing-lab-v3/page.tsx", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const v1 = fs.readFileSync(new URL("../landing-lab/interaction-lab.tsx", import.meta.url), "utf8");
const v2 = fs.readFileSync(new URL("../landing-lab-v2/interaction-lab-v2.tsx", import.meta.url), "utf8");

test("V3 è una route isolata e non sostituisce root, V1 o V2", () => {
  assert.match(page, /LandingLabV3/);
  assert.match(page, /index: false/);
  assert.doesNotMatch(root, /LandingLabV3/);
  assert.doesNotMatch(v1, /LandingLabV3/);
  assert.doesNotMatch(v2, /LandingLabV3/);
});

test("la homepage espone header, CTA reali e sei momenti narrativi", () => {
  assert.match(component, /Funzioni/);
  assert.match(component, /Perché ARMONIA/);
  assert.match(component, /href="\/signup"/);
  assert.match(component, /href="\/login"/);
  for (const marker of ["hero", "ProductStage", "Continuity", "Materials", "ProfessionalResources", "TrustAndCta"]) assert.match(component, new RegExp(marker));
});

test("il product stage ha tre scene accessibili e nessun progresso clinico automatico", () => {
  for (const id of ["pathway", "laboratory", "tools"]) assert.match(component, new RegExp(`id: "${id}"`));
  assert.match(component, /role="tablist"/);
  assert.match(component, /role="tab"/);
  assert.match(component, /aria-selected=/);
  assert.match(component, /ArrowRight/);
  assert.doesNotMatch(component, /65%/);
  assert.match(component, /In corso/);
});

test("claim di affidabilità restano limitati a capacità reali", () => {
  for (const claim of ["Accesso autenticato", "Dati separati", "File protetti", "Esportazione dati"]) assert.match(component, new RegExp(claim));
  assert.doesNotMatch(component, /GDPR compliant|medical grade|E2E|backup automatic/i);
});

test("motion ha fallback touch, mobile e reduced-motion", () => {
  assert.match(component, /pointerType === "touch"/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media\(max-width:850px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test("tre slot visuali sono sostituibili senza asset pesanti", () => {
  for (const slot of ["SLOT A", "SLOT B", "SLOT C"]) assert.match(component, new RegExp(slot));
  assert.doesNotMatch(component, /<canvas|from ["']three|from ["']framer-motion|\.(mp4|webm)["']/i);
});
