import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("./interaction-lab.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./interaction-lab.module.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/landing-lab/page.tsx", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("il laboratorio è una route isolata e non modifica la root", () => {
  assert.match(page, /InteractionLab/);
  assert.match(page, /index: false/);
  assert.match(root, /ARMONIA — Gestionale per logopedisti/);
  assert.doesNotMatch(root, /InteractionLab/);
});

test("espone tre stati selezionabili con button e tab semantics", () => {
  for (const id of ["pathway", "laboratory", "tools"]) assert.match(component, new RegExp(`id: "${id}"`));
  assert.match(component, /role="tablist"/);
  assert.match(component, /role="tab"/);
  assert.match(component, /aria-selected=/);
  assert.match(component, /ArrowDown/);
  assert.match(component, /ArrowRight/);
});

test("motion, pointer e scroll restano progressivi e accessibili", () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /onPointerMove/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /@media\(max-width:959px\)/);
});

test("usa solo scene DOM e il branding esistente", () => {
  assert.match(component, /logo-mark\.svg/);
  assert.doesNotMatch(component, /\.(png|jpg|jpeg|webp|mp4|webm)["']/i);
  assert.doesNotMatch(component, /<canvas|from ["']three|from ["']@react-three/i);
});
