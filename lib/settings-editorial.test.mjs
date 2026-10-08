import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import { mobileSettingsSections, parseMobileSettingsSection } from "./mobile-settings.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("app/impostazioni/page.tsx");
const css = read("app/impostazioni/settings-editorial.module.css");
const nav = read("components/settings/settings-editorial-navigation.tsx");
const syntax = ts.createSourceFile("page.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test("Impostazioni Editorial usa le cinque aree reali e i deep link esistenti", () => {
  assert.match(nav, /mobileSettingsSections\.map/);
  assert.match(nav, /aria-pressed=\{selected === section\.id\}/);
  assert.match(nav, /aria-controls=\{`settings-\$\{section\.id\}-panel`\}/);
  assert.match(page, /onSelect=\{\(section\)=>router\.push\(mobileSettingsHref\(section\),\{scroll:false\}\)\}/);
  assert.match(page, /selected=\{mobileSection\|\|"professional"\}/);
  assert.match(nav, /href="\/calendario"/);
  for (const section of mobileSettingsSections) {
    assert.equal(parseMobileSettingsSection(section.id), section.id);
    assert.match(page, new RegExp(`id="settings-${section.id}-panel" className=\\{surface\\("${section.id}"\\)\\}`));
  }
});

test("il cambio area non smonta form o componenti e non aggiunge stato o effetti", () => {
  const wrappers = [];
  let effects = 0;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(syntax) === "useEffect") effects++;
    if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some((attr) =>
      ts.isJsxAttribute(attr) && attr.name.text === "id" && attr.initializer?.getText(syntax).startsWith('"settings-'))) {
      assert.ok(ts.isJsxElement(node.parent), "le aree devono essere figli JSX diretti, non condizionali");
      assert.ok(!node.openingElement.attributes.properties.some((attr) => ts.isJsxAttribute(attr) && attr.name.text === "key"));
      wrappers.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  assert.equal(wrappers.length, 5);
  assert.equal(effects, 5);
  for (const component of ["AccountSecurity", "DataExportSection", "CalendarFeedSettings"]) {
    assert.equal((page.match(new RegExp(`<${component}\\b`, "g")) || []).length, 1);
  }
  assert.doesNotMatch(page, /key=\{mobileSection\}|useState<MobileSettingsSection>/);
});

test("gli handler operativi restano identici al checkpoint pre-restyling", () => {
  const handlers = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && ["onClick", "onChange", "onSubmit", "onConfirm", "onClose"].includes(node.name.text)) {
      handlers.push(node.getText(syntax));
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  assert.equal(handlers.length, 32);
  // Snapshot of real save/upload/OAuth/export/account handlers, not the new navigation.
  assert.equal(createHash("sha256").update(handlers.join("\n")).digest("hex"),
    "a80a9e6e1195335bebd6b5d2d160f1bc282e80dc431adf5f68ec6eb0ea5f8d54");
});

test("layout e switch Editorial sono desktop-only con larghezza stabile e focus", () => {
  assert.match(page, /<AppShell desktopWideAtLarge mobileFullScreen=/);
  const beforeDesktop = css.split("@media screen and (min-width: 1024px)")[0];
  assert.match(beforeDesktop, /\.page, \.layout, \.panels \{ display: contents; \}/);
  assert.match(beforeDesktop, /\.editorialHeading, \.navigation \{ display: none; \}/);
  assert.doesNotMatch(beforeDesktop, /\.surface/);
  assert.match(css, /grid-template-columns: clamp\(280px, 23vw, 330px\) minmax\(0, 1fr\)/);
  assert.match(css, /max-width: 1500px/);
  assert.match(css, /\.panels > \.surface \{ display: none; \}/);
  assert.match(css, /\.panels > \.surface\.selected \{ display: block; \}/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /overflow:\s*hidden|width:\s*fit-content/);
});

test("Calendari condivide intestazione e azione esistente nella superficie Google solo desktop", () => {
  assert.match(page, /id="settings-calendars-panel"[\s\S]*<div className=\{styles\.calendarGroup\}>[\s\S]*legacyCalendarHeading[\s\S]*googleSettings/);
  assert.match(page, /className=\{`card p-4 sm:p-6 \$\{styles\.googleSettings\}`\}/);
  assert.match(page, /calendarDescription/);
  assert.equal((page.match(/onClick=\{\(\)=>setCalendarsHelpOpen\(true\)\}/g) || []).length, 1);
  const baseStyles = css.split("@media screen and (min-width: 1024px)")[0];
  assert.match(baseStyles, /\.calendarGroup \{ display: contents; \}/);
  assert.match(baseStyles, /\.calendarDescription \{ display: none; \}/);
  assert.match(css, /\.calendarGroup \{\s*display: block;[\s\S]*background: var\(--editorial-paper/);
  assert.match(css, /\.calendarGroup > \.legacyCalendarHeading/);
});

test("menu Impostazioni resta sticky sotto la toolbar e scrolla solo su viewport bassi", () => {
  const desktopRules = css.split("@media screen and (min-width: 1024px)")[1];
  const baseStyles = css.split("@media screen and (min-width: 1024px)")[0];
  assert.match(desktopRules, /\.navigation \{[\s\S]*position: sticky;[\s\S]*top: 78px;[\s\S]*max-height: calc\(100dvh - 98px\);[\s\S]*overflow-y: auto;/);
  assert.match(desktopRules, /overscroll-behavior: contain/);
  assert.doesNotMatch(baseStyles, /\.navigation \{[\s\S]*position: sticky/);
});
