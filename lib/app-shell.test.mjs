import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { desktopNavigationItems, isNavigationItemActive, mobilePageTitle, navigationItems, primaryNavigationItems, secondaryNavigationItems } from "../components/app-shell/navigation-model.ts";
import { desktopEditorialSection } from "../components/app-shell/desktop-editorial-model.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const shell = read("components/app-shell.tsx");
const desktop = read("components/app-shell/desktop-shell-chrome.tsx");
const mobile = read("components/app-shell/mobile-shell-chrome.tsx");
const header = read("components/app-shell/mobile-header.tsx");
const drawer = read("components/app-shell/mobile-navigation-drawer.tsx");
const account = read("components/app-shell/mobile-account-menu.tsx");
const icons = read("components/app-shell/navigation-icons.tsx");
const css = read("app/globals.css");
const desktopCss = read("components/app-shell/desktop-shell-chrome.module.css");
const editorialCss = read("components/app-shell/desktop-editorial-shell.module.css");
const editorialFoundation = read("app/organic-editorial-foundation.css");

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
  assert.equal(mobilePageTitle("/calendar-v3-lab"), "Calendario");
  assert.equal(mobilePageTitle("/sconosciuta"), "Armonia");
});

test("AppShell rende children una volta e orchestra chrome distinti", () => {
  assert.match(shell, /DesktopShellChrome/);
  assert.match(shell, /MobileShellChrome/);
  assert.equal((shell.match(/\{children\}/g) || []).length, 1);
  assert.doesNotMatch(shell, /bottom-nav|primaryMobileItems|mobile-more-sheet/);
  assert.doesNotMatch(css, /\.bottom-nav/);
});

test("cornice editoriale è opt-in per le route principali e lascia fuori detail/editor e Calendar fullscreen", () => {
  assert.deepEqual(
    ["/oggi", "/pazienti", "/risorse", "/economia", "/statistiche", "/impostazioni", "/materiali"].map((path) => desktopEditorialSection(path, false)),
    ["Oggi", "Pazienti", "Risorse", "Economia", "Statistiche", "Impostazioni", "Materiali"],
  );
  for (const path of ["/calendario", "/calendar-v3-lab", "/pazienti/abc", "/sedute/nuova", "/risorse/documenti", "/risorse/laboratorio/crea"]) {
    assert.equal(desktopEditorialSection(path, false), null, `${path} deve mantenere il proprio chrome`);
  }
  assert.equal(desktopEditorialSection("/oggi", true), null);
  assert.match(shell, /editorialSection && <header className=\{editorialStyles\.toolbar\}/);
  assert.match(shell, /<span className=\{editorialStyles\.brand\}>ARMONIA<\/span>/);
  assert.match(shell, /organic-editorial-title/);
  assert.doesNotMatch(shell, /<button|<Link|accountButton|Search/);
});

test("la directory Pazienti usa più larghezza solo tramite la variante desktop ampia", () => {
  const patientsPage = read("app/pazienti/page.tsx");
  const patientStyles = read("components/patients/patient-experience.module.css");
  assert.match(patientsPage, /<AppShell desktopWide>/);
  assert.match(patientsPage, /MobilePatientDirectory[\s\S]*hidden md:block/);
  assert.match(patientStyles, /\.directory\s*\{[^}]*max-width:\s*1500px/);
});

test("Economia mantiene una larghezza desktop indipendente dalla scheda attiva", () => {
  const economy = read("app/economia/page.tsx");
  const economyStyles = read("app/economia/economy-experience.module.css");
  assert.match(economy, /return <AppShell mainClassName=\{styles\.main\}>/);
  assert.match(shell, /mainClassName = ""/);
  assert.match(shell, /<main className=\{`[\s\S]*\$\{mainClassName\}`\}>\{children\}/);
  assert.match(shell, /max-w-6xl/);
  assert.match(economyStyles, /@media \(min-width: 1024px\)\s*\{\s*\.main\s*\{\s*width: 100%;/);
  assert.doesNotMatch(economyStyles, /\.main\s*\{[^}]*fit-content/);
  for (const section of ["services", "payments", "documents"]) {
    assert.match(economy, new RegExp(`id="economy-${section}-panel"`));
  }
});

test("foundation Organic Editorial è opt-in e solo la shell cambia da desktop", () => {
  assert.match(editorialFoundation, /\.organic-editorial-shell\s*\{/);
  assert.match(editorialFoundation, /--editorial-forest-deep:\s*#263c30/);
  assert.match(editorialFoundation, /--editorial-paper:\s*#fffefa/);
  assert.match(editorialFoundation, /\.organic-editorial-title\s*\{/);
  assert.doesNotMatch(editorialFoundation, /(^|\n)\s*(h1|h2|body|button|input)\s*\{/);
  assert.match(editorialCss, /\.workspace\s*\{\s*display:\s*contents/);
  assert.match(editorialCss, /@media\s*screen\s*and\s*\(min-width:\s*1024px\)/);
  assert.match(editorialCss, /\.workspaceFullscreen\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(editorialCss, /\.toolbar\s*\{[^}]*position:\s*sticky/s);
  assert.match(desktopCss, /@media screen and \(min-width:1024px\)\{/);
  assert.match(desktopCss, /\.dock:before\{[^}]*#263c30/s);
  assert.match(desktopCss, /\.tooltip\{[^}]*background:#fffefa;color:#263c30/s);
  assert.match(desktopCss, /prefers-reduced-motion:reduce/);
});

test("desktop usa il dock compatto, le route canoniche e l'account nella shell", () => {
  assert.match(desktop, /styles\.dock/);
  assert.match(desktop, /desktopNavigationItems\.filter\([\s\S]*?\)\.map/);
  assert.match(desktop, /href="\/impostazioni"/);
  assert.match(desktop, /isNavigationItemActive\(pathname, item\.href\)/);
  assert.match(desktop, /icon=\{item\.mobileIcon\}/);
  assert.match(desktop, /aria-current=\{active \? "page"/);
  assert.match(desktop, /label=\{item\.label\}/);
  assert.doesNotMatch(desktop, /Espandi menu|Riduci menu|expandButton|setExpanded|styles\.expanded/);
  assert.match(desktop, /createPortal\([\s\S]*role="tooltip"/);
  assert.match(desktop, /onMouseEnter=\{\(\) => setHovered\(true\)\}[\s\S]*onFocus=\{\(\) => setFocused\(true\)\}/);
  assert.match(desktop, /aria-describedby=\{anchor \? `[\s\S]*?tooltip` : undefined\}/);
  assert.match(desktop, /onClick=\{\(\) => void onLogout\(\)\}/);
  assert.match(shell, /await signOut\(\); router\.replace\("\/login"\)/);
  assert.match(desktopCss, /\.dock\{[^}]*position:fixed;inset:0 auto 0 0;z-index:40;display:none/);
  assert.match(desktopCss, /\.dockSpacer\{--dock-width:72px;display:none/);
  assert.match(desktopCss, /@media\(min-width:768px\)\{\.dock,\.dockSpacer\{display:flex\}\}/);
  assert.match(desktopCss, /--dock-width:72px/);
  assert.match(desktopCss, /--dock-width:64px/);
  assert.match(desktopCss, /prefers-reduced-motion:reduce/);
  assert.match(desktopCss, /@media\(min-width:768px\)\{\.dock,\.dockSpacer\{display:flex\}\}/);
  assert.match(desktopCss, /@media\(max-width:1023px\)\{\.dock\{--dock-width:64px/);
  assert.match(desktopCss, /\.dockSpacer\{--dock-width:64px\}/);
  assert.match(desktopCss, /\.tooltip\{position:fixed;z-index:1000/);
  assert.match(desktopCss, /transform:scale\(1\.045\)/);
  assert.match(desktopCss, /\.navLink\.active:before\{position:absolute;left:3px/);
  assert.match(desktopCss, /\.dock:before\{[^}]*pointer-events:none/);
  assert.match(desktop, /document\.addEventListener\("pointerdown", closeOnOutside\)/);
  assert.match(desktop, /event\.key === "Escape" && accountOpen/);
  assert.doesNotMatch(desktopCss, /expanded|expandButton|dock-panel-width|dock-content-width/);
  assert.match(shell, /DesktopShellChrome pathname=\{pathname\} profile=\{data\.profile\} localMode=\{connection\.kind === "local"\}/);
  assert.match(drawer, /md:hidden/);
});

test("header mobile usa un solo trigger menu a due linee senza logo", () => {
  assert.match(header, /aria-label="Apri menu"/);
  assert.match(header, /aria-controls="mobile-navigation-drawer"/);
  assert.match(header, /<button[\s\S]*TwoLineMenuIcon[\s\S]*<\/button>/);
  assert.doesNotMatch(header, /branding\/logo-mark|<Image|>ARMONIA<|>⌄</);
  assert.equal((header.match(/aria-label="Apri menu"/g) || []).length, 1);
  assert.doesNotMatch(header, /grid gap-1|h-px w-\[1\.125rem\]/);
  assert.match(header, /h-11/);
  assert.match(header, /w-11/);
  assert.match(header, /\{title\}/);
  assert.match(header, /safe-area-inset-top/);
  assert.match(header, /safe-area-inset-right/);
  assert.match(header, /md:hidden/);
});

test("header detail sostituisce il menu con un solo controllo back", () => {
  assert.match(shell, /MobileHeaderDetail/);
  assert.match(mobile, /detailHeader\?: MobileHeaderDetail/);
  assert.match(header, /detail \? detail\.onBack \? <button/);
  assert.match(header, /onClick=\{detail\.onBack\}/);
  assert.match(header, /: <Link href=\{detail\.backHref\}/);
  assert.match(header, /aria-label=\{detail\.backLabel \|\| "Torna indietro"\}/);
  assert.doesNotMatch(header, /detail[\s\S]*onOpen\(\)[\s\S]*<Link/);
});

test("mobile usa una sola famiglia SVG monocromatica senza emoji o dipendenze", () => {
  assert.equal(new Set(navigationItems.map((item) => item.mobileIcon)).size, 7);
  assert.match(icons, /viewBox="0 0 24 24"[\s\S]*stroke="currentColor"[\s\S]*strokeWidth="1\.65"/);
  assert.match(icons, /TwoLineMenuIcon[\s\S]*M4\.5 8\.25h15M4\.5 15\.75h11/);
  assert.match(drawer, /NavigationIcon name=\{item\.mobileIcon\}/);
  assert.doesNotMatch(drawer, />\{item\.icon\}</);
  assert.match(drawer, /branding\/logo-mark\.svg[\s\S]*Armonia/);
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
