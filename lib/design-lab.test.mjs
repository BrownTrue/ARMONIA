import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/design-lab/page.tsx", import.meta.url), "utf8");
const lab = readFileSync(new URL("../app/design-lab/design-lab.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/design-lab/design-lab.module.css", import.meta.url), "utf8");
const experience = readFileSync(new URL("../app/design-lab/experience.tsx", import.meta.url), "utf8");
const experienceCss = readFileSync(new URL("../app/design-lab/experience.module.css", import.meta.url), "utf8");

test("design lab route is unavailable outside development", () => {
  assert.match(page, /process\.env\.NODE_ENV\s*!==\s*["']development["']/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /force-dynamic/);
});

test("playground includes every requested demo family and theme", () => {
  for (const id of ["dot", "elastic", "magnetic", "context"]) assert.match(lab, new RegExp(`id: "${id}"`));
  for (const label of ["Organic premium", "Editorial tech", "Modern playful"]) assert.ok(lab.includes(label));
  for (const section of ["cursori", "pulsanti", "schede", "navigazione"]) assert.ok(lab.includes(`id="${section}"`));
  assert.match(lab, /prefers-reduced-motion/);
});

test("cursor treatment is scoped to its preview and honors touch and reduced motion", () => {
  assert.match(lab, /className=\{`\$\{styles\.cursorStage\}/);
  assert.match(lab, /querySelectorAll<HTMLButtonElement>\(`\.\$\{styles\.cursorZones\} button`\)/);
  assert.match(css, /\.cursorStage\.cursorVisible\{cursor:none\}/);
  assert.match(css, /@media \(pointer:fine\) and \(hover:hover\)/);
  assert.match(css, /@media \(hover:none\),\s*\(pointer:coarse\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /calc\([^)]*\* var\(--speed\)/);
  assert.doesNotMatch(css, /(^|\})\s*body\s*\{[^}]*cursor\s*:/s);
});

test("Design Lab V2 keeps V1 and adds the navigable local product experience", () => {
  assert.match(lab, /useState<"experience" \| "v1">\("experience"\)/);
  assert.match(lab, /Esperimenti V1/);
  assert.match(lab, /export function ButtonPlayground/);
  assert.match(lab, /export function CardPlayground/);
  for (const label of ["Oggi", "Calendario", "Pazienti", "Risorse", "Statistiche", "Economia", "Impostazioni"]) {
    assert.ok(experience.includes(`label: "${label}"`), `missing navigation section ${label}`);
  }
  assert.match(experience, /aria-label="Navigazione principale"/);
  assert.match(experience, /aria-selected=\{screen === item\.label\}/);
  assert.match(experience, /onKeyDown=\{\(event\) => handleNavKeys/);
  assert.match(experience, /Pannello contestuale Calendario/);
  assert.match(experience, /setContextOpen/);
  assert.match(experience, /Giulia Bianchi/);
  assert.match(experience, /Luca Ferri/);
  assert.match(experience, /CardPlayground speed=\{speed\} motionOn=\{motionOn\}/);
  assert.match(experience, /ButtonPlayground speed=\{speed\} motionOn=\{motionOn\}/);
  assert.match(experienceCss, /prefers-reduced-motion:reduce/);
  assert.match(experienceCss, /@media\(max-width:760px\)/);
  assert.match(experienceCss, /\.navTooltip/);
});
