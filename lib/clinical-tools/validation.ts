import type { ClinicalToolCatalogEntry } from "./types.ts";

const INTEGRATION = new Set(["external", "catalog_only", "integrated"]);
const LICENSE = new Set(["open_verified", "permission_required", "restricted", "unclear"]);
const REVIEW = new Set(["reviewed", "needs_review"]);
const RIGHTS = new Set(["allowed", "allowed_with_attribution", "allowed_with_conditions", "allowed_noncommercial_unmodified", "forbidden", "forbidden_except_license", "forbidden_without_permission", "permission_required", "restricted_to_language_translation", "unknown"]);
const validUrl = (value: string | null) => value === null || (() => { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } })();

export function validateClinicalToolCatalog(entries: readonly ClinicalToolCatalogEntry[], expectedCount = 38) {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (entries.length !== expectedCount) errors.push(`Il catalogo deve contenere ${expectedCount} strumenti, non ${entries.length}.`);
  entries.forEach((entry, index) => {
    const at = entry.id || `record ${index + 1}`;
    if (!entry.id.trim()) errors.push(`ID vuoto al record ${index + 1}.`);
    if (ids.has(entry.id)) errors.push(`ID duplicato: ${entry.id}.`); else ids.add(entry.id);
    if (!entry.name.trim()) errors.push(`Nome vuoto: ${at}.`);
    if (!entry.shortDescription.trim()) errors.push(`Descrizione vuota: ${at}.`);
    if (entry.population.ageMinMonths !== null && entry.population.ageMaxMonths !== null && entry.population.ageMinMonths > entry.population.ageMaxMonths) errors.push(`Intervallo età non coerente: ${at}.`);
    if (!INTEGRATION.has(entry.integrationStatus)) errors.push(`Stato integrazione non valido: ${at}.`);
    if (!LICENSE.has(entry.licenseStatus)) errors.push(`Stato licenza non valido: ${at}.`);
    if (!REVIEW.has(entry.catalogReviewStatus)) errors.push(`Stato revisione non valido: ${at}.`);
    for (const value of [entry.rights.commercialUse, entry.rights.redistribution, entry.rights.modification, entry.rights.softwareIntegration]) if (!RIGHTS.has(value)) errors.push(`Diritto non valido (${value}): ${at}.`);
    if (![entry.officialUrl, entry.officialPurchaseUrl, entry.rights.licenseUrl].every(validUrl)) errors.push(`URL principale non valido: ${at}.`);
    if (entry.references.some((reference) => !reference.title.trim() || !validUrl(reference.url))) errors.push(`Riferimento non valido: ${at}.`);
  });
  return errors;
}
