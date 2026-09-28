import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/app-shell.tsx", import.meta.url), "utf8");

test("bottom navigation mobile contiene le cinque destinazioni definitive", () => {
  assert.match(source, /primaryMobileItems\s*=\s*\[\["◷", "Oggi", "\/oggi"\], \["□", "Calendario", "\/calendario"\], \["◎", "Pazienti", "\/pazienti"\], \["▧", "Materiali", "\/materiali"\]\]/);
  assert.match(source, /primaryMobileItems\.map[\s\S]*Altro/);
  const primaryDefinition = source.match(/const primaryMobileItems = ([^;]+);/)?.[1] || "";
  assert.doesNotMatch(primaryDefinition, /Statistiche/);
});

test("Altro apre un bottom sheet con sole route secondarie reali ed Economia per prima", () => {
  assert.match(source, /secondaryMobileItems\s*=\s*\[\["€", "Economia"[\s\S]*"\/economia"\], \["◔", "Statistiche"[\s\S]*"\/statistiche"\], \["⚙", "Impostazioni"[\s\S]*"\/impostazioni"\]\]/);
  assert.match(source, /openMore[\s\S]*setMoreOpen\(true\)[\s\S]*mobile-more-sheet[\s\S]*role="dialog"[\s\S]*rounded-t/);
  assert.doesNotMatch(source, /Report|Supporto/);
});

test("route secondarie rendono Altro attivo e i link chiudono il foglio", () => {
  assert.match(source, /isSecondaryRoute\(path\) \|\| moreOpen/);
  assert.match(source, /secondaryMobileItems\.map[\s\S]*onClick=\{closeMore\}/);
  for (const route of ["/economia", "/statistiche", "/impostazioni"]) assert.match(source, new RegExp(route));
});

test("sheet mobile protegge scroll safe area e interazioni accessibili", () => {
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /overflow-y-auto[\s\S]*safe-area-inset-bottom/);
  assert.match(source, /aria-modal="true"[\s\S]*aria-labelledby="mobile-more-title"/);
  assert.match(source, /min-h-11|min-h-14/);
});

test("header mobile usa avatar e desktop conserva tutte le destinazioni", () => {
  assert.doesNotMatch(source, /☰|Apri menu|mobile-navigation/);
  assert.match(source, /Apri account e altre sezioni[\s\S]*\{initials\}/);
  for (const label of ["Oggi", "Calendario", "Pazienti", "Materiali", "Statistiche", "Economia", "Impostazioni"]) assert.match(source, new RegExp(`desktopItems[\\s\\S]*${label}`));
});
