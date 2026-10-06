import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  mobileSettingsHref,
  mobileSettingsSections,
  parseMobileSettingsSection,
} from "./mobile-settings.ts";

const settingsSource = readFileSync(new URL("../app/impostazioni/page.tsx", import.meta.url), "utf8");
const economySource = readFileSync(new URL("../app/economia/page.tsx", import.meta.url), "utf8");
const documentsSource = readFileSync(new URL("../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("MOBILE 6 espone soltanto le sezioni Settings reali con URL stabile", () => {
  assert.deepEqual(mobileSettingsSections.map(({ id }) => id), [
    "professional",
    "branding",
    "calendars",
    "security",
    "export",
  ]);
  assert.equal(parseMobileSettingsSection("calendars"), "calendars");
  assert.equal(parseMobileSettingsSection("invented"), null);
  assert.equal(parseMobileSettingsSection(null), null);
  assert.equal(mobileSettingsHref("security"), "/impostazioni?section=security");
});

test("Settings mobile usa indice e drill-down condividendo componenti e mutation desktop", () => {
  assert.match(settingsSource, /useSearchParams/);
  assert.match(settingsSource, /MobileSettingsIndex/);
  assert.match(settingsSource, /mobileFullScreen=\{Boolean\(mobileSection\)\}/);
  assert.match(settingsSource, /router\.push\(mobileSettingsHref\(section\)\)/);
  assert.match(settingsSource, /router\.back\(\)/);
  for (const sharedCapability of [
    "saveProfile",
    "saveProfessionalDocumentDetails",
    "saveLogo",
    "removeLogo",
    "CalendarFeedSettings",
    "AccountSecurity",
    "DataExportSection",
  ]) assert.match(settingsSource, new RegExp(sharedCapability));
  assert.doesNotMatch(settingsSource, /saveMobile(?:Profile|Logo|Settings)/);
});

test("Economia mobile conserva tab, liste e filtri sugli stessi dati", () => {
  assert.match(economySource, /economyTabClasses/);
  for (const tab of ["services", "payments", "documents"]) assert.match(economySource, new RegExp(`"${tab}"`));
  assert.match(documentsSource, /mobileFiltersOpen/);
  assert.match(documentsSource, /DocumentFilters/);
  assert.match(documentsSource, /Filtri documenti/);
  assert.match(documentsSource, /Number\(Boolean\(patientFilter\)\)/);
});

test("Proforma mobile separa le quattro superfici senza duplicare emissione e void", () => {
  assert.match(documentsSource, /data-mobile-step=\{mobileStep\}/);
  assert.match(documentsSource, /Dati documento/);
  assert.match(documentsSource, /Righe e prestazioni/);
  assert.match(documentsSource, /Destinatario e professionista/);
  assert.match(documentsSource, /Riepilogo e anteprima/);
  assert.match(documentsSource, /createEconomicDocumentIssueRunner/);
  assert.match(documentsSource, /requestEconomicDocumentIssue/);
  assert.match(documentsSource, /requestEconomicDocumentVoid/);
  assert.match(documentsSource, /const openPdf = async/);
  assert.doesNotMatch(documentsSource, /saveMobile(?:Payment|Proforma)/);
  assert.match(stylesSource, /@media \(max-width: 767px\)/);
  assert.match(stylesSource, /\.proforma-mobile\[data-mobile-step="4"\]/);
});

test("i form lunghi Economy diventano full-screen solo sotto il breakpoint mobile", () => {
  assert.match(stylesSource, /div\[role="dialog"\]:has\(\.proforma-mobile\) > div/);
  assert.match(stylesSource, /div\[role="dialog"\]:has\(#payment-amount\) > div/);
  assert.match(stylesSource, /height: 100dvh/);
  assert.match(stylesSource, /border-radius: 0/);
});
