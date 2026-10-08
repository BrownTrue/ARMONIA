import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const page = read("app/statistiche/page.tsx");
const mobile = read("components/statistics/mobile-statistics-dashboard.tsx");
const period = read("components/statistics/statistics-period-filter.tsx");
const chart = read("components/statistics/activity-chart.tsx");

test("Statistiche mobile e desktop condividono una sola derivazione", () => {
  for (const calculation of ["coreStatistics", "patientStatistics", "appointmentStatistics", "serviceStatistics", "economyStatistics", "activitySeries"]) assert.equal((page.match(new RegExp(`${calculation}\\(`, "g")) || []).length, 1);
  assert.match(page, /MobileStatisticsDashboard[\s\S]*hidden md:block \$\{styles\.desktopPage\}/);
  assert.match(page, /periodFilter\("mobile"\)/);
  assert.match(page, /periodFilter\(\)/);
});

test("selettore mobile espone tutti i periodi reali e date custom", () => {
  assert.match(period, /variant === "mobile"/);
  assert.match(period, /<select id="mobile-statistics-period"[\s\S]*onPreset/);
  for (const preset of ["current_month", "previous_month", "last_3_months", "last_6_months", "current_year", "custom"]) assert.match(period, new RegExp(preset));
  assert.match(period, /preset === "custom"[\s\S]*type="date"[\s\S]*type="date"/);
});

test("gerarchia mobile conserva KPI grafico breakdown Agenda Pazienti ed Economia", () => {
  assert.match(mobile, /kpis\.slice\(0, 2\)/);
  assert.match(mobile, /kpis\.slice\(2\)/);
  assert.match(mobile, /ActivityChart points=\{chart\} compact/);
  assert.match(mobile, /ServiceBreakdown rows=\{services\}/);
  for (const section of ["Economia", "Agenda", "Pazienti"]) assert.match(mobile, new RegExp(section));
  assert.match(mobile, /Le statistiche cresceranno con la tua attività/);
  assert.match(mobile, /Non ci sono sedute nel periodo selezionato/);
  assert.doesNotMatch(mobile, /table|overflow-x-auto|shadow/);
});

test("grafico mobile elimina la larghezza desktop forzata ma conserva valori e accessibilità", () => {
  assert.match(chart, /compact \? "h-48 min-w-0 gap-1"/);
  assert.match(chart, /point\.sessions \|\| ""/);
  assert.match(chart, /tabIndex=\{0\}[\s\S]*aria-label=/);
  assert.match(chart, /compact \? [\s\S]*min-w-\[580px\]/);
});
