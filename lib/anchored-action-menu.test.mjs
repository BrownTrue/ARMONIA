import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { anchoredMenuPosition } from "./anchored-menu.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("components/anchored-action-menu.tsx");
const styles = read("components/anchored-action-menu.module.css");
const economy = read("app/economia/page.tsx");

test("focus soltanto dopo il commit visibile, una volta per apertura anche dopo resize", () => {
  const match = component.match(/useLayoutEffect\(\(\) => \{([\s\S]*?)\}, \[open, position\]\)/);
  assert.ok(match, "il focus deve dipendere anche dal posizionamento committed");
  const body = match[1].slice(match[1].lastIndexOf("if (!open)"));
  const run = new Function("open", "position", "focusedThisOpening", "setPosition", "itemRefs", body);
  let focusCount = 0;
  const opening = { current: false };
  const items = { current: [{ focus: () => { focusCount++; } }] };
  let cleared = false;
  const setPosition = (value) => { cleared = value === null; };
  run(true, null, opening, setPosition, items);
  assert.equal(focusCount, 0, "portal nascosto: nessun focus prematuro");
  run(true, { left: 100, top: 200 }, opening, setPosition, items);
  assert.equal(focusCount, 1, "portal posizionato: prima azione focused");
  run(true, { left: 110, top: 190 }, opening, setPosition, items);
  assert.equal(focusCount, 1, "resize/scroll non rubano il focus");
  run(false, null, opening, setPosition, items);
  assert.equal(cleared, true);
  run(true, null, opening, setPosition, items);
  assert.equal(focusCount, 1);
  run(true, { left: 100, top: 200 }, opening, setPosition, items);
  assert.equal(focusCount, 2, "riapertura rifocalizza dopo il nuovo posizionamento");
  const positioning = component.match(/useLayoutEffect\(\(\) => \{([\s\S]*?)\}, \[open\]\)/)[1];
  assert.doesNotMatch(positioning, /\.focus\(/);
});

test("menu contestuale rimane sotto l'ancora quando c'è spazio", () => {
  const position = anchoredMenuPosition({ top: 120, right: 360, bottom: 156 }, { width: 180, height: 120 }, { width: 1280, height: 800 });
  assert.deepEqual(position, { left: 180, top: 162, maxWidth: 1264, maxHeight: 784, opensUp: false });
});

test("menu contestuale si apre sopra l'ultima riga e resta nel viewport", () => {
  const position = anchoredMenuPosition({ top: 740, right: 1240, bottom: 776 }, { width: 220, height: 180 }, { width: 1280, height: 800 });
  assert.equal(position.opensUp, true);
  assert.equal(position.left, 1020);
  assert.equal(position.top, 554);
  assert.ok(position.left >= 8 && position.left + 220 <= 1272);
  assert.ok(position.top >= 8 && position.top + 180 <= 792);
});

test("menu contestuale si adatta anche quando la viewport è più piccola del menu", () => {
  const position = anchoredMenuPosition({ top: 24, right: 180, bottom: 60 }, { width: 300, height: 500 }, { width: 240, height: 180 });
  assert.equal(position.left, 8);
  assert.equal(position.top, 8);
  assert.equal(position.maxWidth, 224);
  assert.equal(position.maxHeight, 164);
});

test("menu azioni usa portal, outside click, Escape e navigazione tastiera", () => {
  assert.match(component, /createPortal\([\s\S]*document\.body/);
  assert.match(component, /addEventListener\("pointerdown", closeFromOutside\)/);
  assert.match(component, /event\.key !== "Escape"/);
  assert.match(component, /triggerRef\.current\?\.focus\(\)/);
  assert.match(component, /ArrowDown[\s\S]*ArrowUp[\s\S]*Home[\s\S]*End/);
  assert.match(component, /aria-haspopup="menu" aria-expanded=\{open\}/);
  assert.match(component, /role="menu"/);
  assert.match(styles, /position:fixed;z-index:90/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test("azioni prestazioni riusano il menu viewport-aware senza alterare l'azione economica", () => {
  assert.match(economy, /<AnchoredActionMenu label="Altre azioni" actions=\{\[\{ label: "Dettaglio economico", onSelect: onDetail \}\]\}/);
  assert.doesNotMatch(economy, /<details className="relative"><summary[\s\S]*Altre azioni/);
});
