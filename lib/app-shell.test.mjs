import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { desktopNavigationItems, isNavigationItemActive, mobilePageTitle, navigationItems, primaryNavigationItems, secondaryNavigationItems } from "../components/app-shell/navigation-model.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const shell = read("components/app-shell.tsx");
const desktop = read("components/app-shell/desktop-shell-chrome.tsx");
const mobile = read("components/app-shell/mobile-shell-chrome.tsx");
const header = read("components/app-shell/mobile-header.tsx");
const drawer = read("components/app-shell/mobile-navigation-drawer.tsx");
const account = read("components/app-shell/mobile-account-menu.tsx");
const icons = read("components/app-shell/navigation-icons.tsx");
const css = read("app/globals.css");

test("navigation model è unico e conserva ordine desktop e gruppi mobile", () => {
  assert.equal(navigationItems.length, 7);
  assert.deepEqual(primaryNavigationItems.map((item) => item.label), ["Oggi", "Calendario", "Pazienti", "Risorse"]);
  assert.deepEqual(secondaryNavigationItems.map((item) => item.label), ["Economia", "Statistiche", "Impostazioni"]);
  assert.deepEqual(desktopNavigationItems.map((item) => item.label), ["Oggi", "Calendario", "Pazienti", "Risorse", "Statistiche", "Economia", "Impostazioni"]);
  assert.equal(new Set(navigationItems.map((item) => item.href)).size, navigationItems.length);
});

test("active route e titoli mobile gestiscono route principali e dettaglio", () => {
  assert.equal(isNavigationItemActive("/pazienti/abc", "/pazienti"), true);
  assert.equal(isNavigationItemActive("/oggi-extra", "/oggi"), false);
  assert.equal(mobilePageTitle("/oggi"), "Oggi");
  assert.equal(mobilePageTitle("/pazienti/abc"), "Paziente");
  assert.equal(mobilePageTitle("/risorse/laboratorio/crea"), "Laboratorio");
  assert.equal(mobilePageTitle("/sconosciuta"), "Armonia");
});

test("AppShell rende children una volta e orchestra chrome distinti", () => {
  assert.match(shell, /DesktopShellChrome/);
  assert.match(shell, /MobileShellChrome/);
  assert.equal((shell.match(/\{children\}/g) || []).length, 1);
  assert.doesNotMatch(shell, /bottom-nav|primaryMobileItems|mobile-more-sheet/);
  assert.doesNotMatch(css, /\.bottom-nav/);
});

test("desktop conserva sidebar, dimensioni, profilo e navigazione completa", () => {
  assert.match(desktop, /hidden w-64 shrink-0 border-r border-sage-100 bg-white px-5 py-7 md:block/);
  assert.match(desktop, /desktopNavigationItems\.map/);
  assert.match(desktop, /href="\/impostazioni"/);
  assert.match(desktop, /profile\.firstName/);
});

test("header mobile usa un solo trigger mark più Menu ed espone titolo e safe area", () => {
  assert.match(header, /aria-label="Apri menu"/);
  assert.match(header, /aria-controls="mobile-navigation-drawer"/);
  assert.match(header, /<button[\s\S]*branding\/logo-mark\.svg[\s\S]*>Menu<\/span>[\s\S]*<\/button>/);
  assert.equal((header.match(/<button/g) || []).length, 1);
  assert.doesNotMatch(header, /grid gap-1|h-px w-\[1\.125rem\]/);
  assert.match(header, /h-11/);
  assert.match(header, /\{title\}/);
  assert.match(header, /safe-area-inset-top/);
  assert.match(header, /safe-area-inset-right/);
  assert.match(header, /md:hidden/);
});

test("mobile usa una sola famiglia SVG monocromatica senza emoji o dipendenze", () => {
  assert.equal(new Set(navigationItems.map((item) => item.mobileIcon)).size, 7);
  assert.match(icons, /viewBox="0 0 24 24"[\s\S]*stroke="currentColor"[\s\S]*strokeWidth="1\.65"/);
  assert.match(drawer, /NavigationIcon name=\{item\.mobileIcon\}/);
  assert.doesNotMatch(drawer, />\{item\.icon\}</);
});

test("drawer chiude con backdrop, Escape e selezione route e ripristina il focus", () => {
  assert.match(drawer, /aria-label="Chiudi navigazione"[\s\S]*onClick=\{onClose\}/);
  assert.match(drawer, /onClick=\{onNavigate\}/);
  assert.match(mobile, /event\.key === "Escape"/);
  assert.match(mobile, /document\.body\.style\.overflow = "hidden"/);
  assert.match(mobile, /menuButtonRef\.current\?\.focus\(\)/);
  assert.match(mobile, /querySelectorAll<HTMLElement>\(focusableSelector\)/);
});

test("account menu usa Settings e logout canonico senza capacità inventate", () => {
  assert.match(account, /href="\/impostazioni"/);
  assert.match(account, />Logout</);
  assert.match(shell, /await signOut\(\); router\.replace\("\/login"\)/);
  assert.doesNotMatch(account, /Supporto|Parla con noi|Tema/);
  assert.match(account, /mobile-local-signout-hint/);
});

test("drawer è laterale, accessibile e non reintroduce una bottom sheet", () => {
  assert.match(drawer, /role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title"/);
  assert.match(drawer, /inset-y-0 left-0[\s\S]*w-\[88vw\][\s\S]*max-w-\[22rem\]/);
  assert.match(drawer, /aria-current=\{active \? "page"/);
  assert.doesNotMatch(drawer, /bottom-0|rounded-t/);
  assert.match(drawer, /label="Principale"[\s\S]*label="Gestione"/);
  assert.match(css, /mobile-drawer-panel-in[\s\S]*prefers-reduced-motion/);
});
