import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Organic Premium spotlight is mouse-only, non-blocking and reduced-motion aware", async () => {
  const [component, styles] = await Promise.all([
    read("../components/organic-premium/spotlight-card.tsx"),
    read("../components/organic-premium/spotlight-card.module.css"),
  ]);
  assert.match(component, /event\.pointerType !== "mouse"/);
  assert.match(component, /setProperty\("--spot-x"/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /pointer: coarse/);
  assert.match(styles, /pointer-events: none/);
});

test("Organic Premium action keeps a normal link and animated tabs preserve tab semantics", async () => {
  const [action, tabs, tabStyles] = await Promise.all([
    read("../components/organic-premium/premium-action.tsx"),
    read("../components/organic-premium/animated-tabs.tsx"),
    read("../components/organic-premium/animated-tabs.module.css"),
  ]);
  assert.match(action, /<Link href=\{href\}/);
  const actionStyles = await read("../components/organic-premium/premium-action.module.css");
  assert.match(actionStyles, /action:hover::before/);
  assert.match(actionStyles, /cubic-bezier\(\.2,\.85,\.25,1\.5\)/);
  assert.match(actionStyles, /\.action:hover \.icon/);
  assert.match(actionStyles, /prefers-reduced-motion: reduce/);
  assert.match(actionStyles, /pointer: coarse/);
  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /aria-selected=\{value === option\.value\}/);
  assert.match(tabs, /ArrowRight/);
  assert.match(tabs, /ArrowLeft/);
  assert.match(tabs, /aria-controls=\{option\.controls\}/);
  assert.match(tabStyles, /prefers-reduced-motion: reduce/);
  const experience = await read("../app/design-lab/experience.tsx");
  assert.match(experience, /<AnimatedTabs label="Sezioni scheda paziente"/);
  assert.match(experience, /role="tabpanel" aria-labelledby=\{activeTab\.id\}/);
  assert.doesNotMatch(await read("../components/calendar-settings-panel.tsx"), /AnimatedTabs/);
});
