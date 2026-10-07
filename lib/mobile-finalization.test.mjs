import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Calendar V3 è l'unico calendario di produzione e il lab conserva le fixture", () => {
  const production = read("app/calendario/page.tsx");
  const lab = read("app/calendar-v3-lab/page.tsx");
  const navigation = read("components/app-shell/navigation-model.ts");
  assert.match(production, /<CalendarLab dataMode="real" canonicalHref="\/calendario"/);
  assert.doesNotMatch(production, /fixture|showModeNotice/);
  assert.match(lab, /mode === "real" \? "real" : "fixture"/);
  assert.match(lab, /robots: \{ index: false, follow: false \}/);
  assert.match(navigation, /label: "Calendario", href: "\/calendario"/);
});

test("Calendar V3 desktop resta dentro AppShell e usa l'area residua a piena altezza", () => {
  const calendar = read("components/calendar-v3-lab/calendar-lab.tsx");
  const calendarCss = read("components/calendar-v3-lab/calendar-v3-lab.module.css");
  const shell = read("components/app-shell.tsx");
  const desktopChrome = read("components/app-shell/desktop-shell-chrome.tsx");
  assert.match(calendar, /<div className=\{styles\.desktopShell\}>\s*<AppShell desktopFullScreen>/);
  assert.match(shell, /desktopFullScreen \? "md:h-dvh md:min-h-0 md:overflow-hidden"/);
  assert.match(shell, /md:max-w-none md:overflow-hidden md:px-0 md:pb-0 md:pt-0/);
  assert.match(calendarCss, /\.desktopApp \{ height: 100%; min-height: 0;/);
  assert.match(desktopChrome, /desktopNavigationItems\.map/);
  assert.match(calendarCss, /\.mobileApp \{ display: none; \}/);
});

test("Auth, Google OAuth e Calendar Feed derivano l'host dal runtime corretto", () => {
  const signup = read("app/signup/page.tsx");
  const resend = read("app/check-email/page.tsx");
  const recovery = read("app/forgot-password/page.tsx");
  const googleConnect = read("app/api/google-calendar/connect/route.ts");
  const googleCallback = read("app/api/google-calendar/callback/route.ts");
  const feed = read("app/api/calendar-feed/route.ts");
  const googleConfig = read("lib/google-calendar/config.ts");
  for (const source of [signup, resend, recovery]) {
    assert.match(source, /window\.location\.origin/);
    assert.doesNotMatch(source, /armonia-logopedia\.vercel\.app|https:\/\/[^"' ]+\.vercel\.app/);
  }
  assert.match(googleConnect, /request\.url/);
  assert.match(googleCallback, /request\.url/);
  assert.match(feed, /calendarFeedUrl\(request\.nextUrl\.origin/);
  assert.match(googleConfig, /process\.env\.GOOGLE_REDIRECT_URI/);
});

test("metadata e manifest descrivono una shell standalone accessibile", () => {
  const layout = read("app/layout.tsx");
  const manifest = read("app/manifest.ts");
  assert.match(layout, /appleWebApp:\{capable:true,title:"Armonia"/);
  assert.match(layout, /viewportFit:"cover"/);
  assert.doesNotMatch(layout, /maximumScale|userScalable/);
  assert.match(manifest, /id: "\/"/);
  assert.match(manifest, /start_url: "\/oggi"/);
  assert.match(manifest, /scope: "\/"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /icon-192\.png/);
  assert.match(manifest, /icon-512\.png/);
});

test("le icone PWA dichiarate esistono con le dimensioni corrette", () => {
  for (const [name, expected] of [["icon-192.png", 192], ["icon-512.png", 512]]) {
    const png = readFileSync(new URL(`../public/branding/${name}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), expected);
    assert.equal(png.readUInt32BE(20), expected);
  }
});

test("viewport dinamico e safe area proteggono shell e calendario mobile", () => {
  const shell = read("components/app-shell.tsx");
  const calendar = read("components/calendar-v3-lab/calendar-v3-lab.module.css");
  assert.match(shell, /min-h-\[100dvh\]/);
  assert.match(shell, /safe-area-inset-bottom/);
  assert.match(calendar, /100dvh/);
  assert.match(calendar, /safe-area-inset-top/);
  assert.match(calendar, /safe-area-inset-bottom/);
});

test("i link interni restano nella shell e gli export Blob attendono il consumo browser", () => {
  const proforma = read("components/economy/economic-documents-panel.tsx");
  const selector = read("components/clinical-tools/tool-selector.tsx");
  const assessment = read("components/clinical/assessment-v2-editor.tsx");
  const exportSection = read("components/settings/data-export-section.tsx");
  assert.doesNotMatch(proforma, /href="\/impostazioni\?section=professional" target="_blank"/);
  assert.doesNotMatch(selector, /href=\{`\/risorse\/strumenti\/\$\{tool\.id\}`\} target="_blank"/);
  assert.doesNotMatch(assessment, /href=\{`\/risorse\/strumenti\/\$\{item\.catalogToolId\}`\} target="_blank"/);
  assert.match(exportSection, /document\.body\.appendChild\(anchor\)/);
  assert.match(exportSection, /setTimeout\(\(\)=>URL\.revokeObjectURL\(url\),60_000\)/);
});
