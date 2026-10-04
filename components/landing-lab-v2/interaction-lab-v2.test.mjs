import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("./interaction-lab-v2.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./interaction-lab-v2.module.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../app/landing-lab-v2/page.tsx", import.meta.url), "utf8");
const v1 = fs.readFileSync(new URL("../landing-lab/interaction-lab.tsx", import.meta.url), "utf8");
const root = fs.readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("V2 è isolata da root e Interaction Lab V1", () => {
  assert.match(page, /InteractionLabV2/);
  assert.match(page, /index: false/);
  assert.doesNotMatch(root, /InteractionLabV2/);
  assert.doesNotMatch(v1, /InteractionLabV2/);
});

test("espone tre scene continue con controlli accessibili", () => {
  for (const id of ["pathway", "laboratory", "tools"]) assert.match(component, new RegExp(`id: "${id}"`));
  assert.match(component, /role="tablist"/);
  assert.match(component, /role="tab"/);
  assert.match(component, /role="tabpanel"/);
  assert.match(component, /aria-selected=/);
  assert.match(component, /ArrowRight/);
  assert.match(component, /Home/);
});

test("motion e input hanno fallback mobile e reduced motion", () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /pointerType === "touch"/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media\(max-width:850px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test("la modalità Strumenti è l'unico momento dark", () => {
  assert.match(component, /active === "tools" \? styles\.toolsMode/);
  assert.match(css, /\.toolsMode \.experience\{background:#173c30\}/);
  assert.match(css, /\.intro\{[^}]*background:radial-gradient/);
});

test("usa soltanto DOM e simbolo ARMONIA esistente", () => {
  assert.match(component, /logo-mark\.svg/);
  assert.doesNotMatch(component, /\.(png|jpg|jpeg|webp|mp4|webm)["']/i);
  assert.doesNotMatch(component, /<canvas|from ["']three|from ["']framer-motion|from ["']motion/i);
});
