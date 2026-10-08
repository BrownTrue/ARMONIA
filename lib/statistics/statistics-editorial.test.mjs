import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("Statistica Editorial usa solo KPI reali e non copia dati demo", async () => {
  const page = await read("app/statistiche/page.tsx");
  for (const unsupportedDemo of ["+12%", "31,5 h", '"42"', '"18"', "€ 2.160", "€ 1.740"]) {
    assert.equal(page.includes(unsupportedDemo), false, `valore dimostrativo inatteso: ${unsupportedDemo}`);
  }
  assert.match(page, /const kpis: \[string, string, string\]\[\]/);
  assert.match(page, /kpis\.map\(/);
  assert.match(page, /kpis\.map\([\s\S]*<KpiGlyph/);
  assert.match(page, /<StatisticsPeriodFilter/);
  assert.match(page, /<ActivityChart points=\{chart\}/);
  assert.match(page, /<ServiceBreakdown rows=\{services\}/);
});

test("Statistica Editorial limita presentazione e larghezza desktop da 1024 px", async () => {
  const page = await read("app/statistiche/page.tsx");
  const styles = await read("app/statistiche/statistics-editorial.module.css");
  const shell = await read("components/app-shell/desktop-editorial-shell.module.css");
  assert.match(page, /<AppShell desktopWideAtLarge>/);
  assert.match(page, /Il lavoro, <em>nel tempo\.<\/em>/);
  assert.match(styles, /@media screen and \(min-width: 1024px\)/);
  assert.match(styles, /\.desktopPage\s*\{[\s\S]*max-width: 1500px/);
  assert.match(shell, /@media screen and \(min-width: 1024px\)\s*\{\s*\.wideMainAtLarge/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("hero Statistiche riunisce titolo e unico KPI sedute a piena larghezza", async () => {
  const page = await read("app/statistiche/page.tsx");
  const styles = await read("app/statistiche/statistics-editorial.module.css");
  assert.match(page, /dataset\.sessions\.length \? styles\.populatedPage/);
  assert.match(page, /index === 0 && <span className=\{styles\.heroPeriod\}>\{period\.label\}/);
  assert.equal((page.match(/String\(core\.sessionCount\)/g) || []).length, 1);
  assert.match(styles, /\.heroBackdrop\s*\{[^}]*grid-column: 1 \/ -1;[^}]*grid-row: 2;/s);
  assert.match(styles, /\.populatedPage \.heading\s*\{[^}]*grid-row: 2;/s);
  assert.match(styles, /\.indicators > \.kpiCard:first-child\s*\{[^}]*grid-row: 2;/s);
  for (const index of [2, 3, 4]) {
    assert.match(styles, new RegExp(`\\.kpiCard:nth-child\\(${index}\\) \\{[^}]*grid-row: 3;`));
  }
});
