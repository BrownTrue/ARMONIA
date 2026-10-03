import type { ClinicalToolAreaFilter, ClinicalToolAudienceFilter, ClinicalToolCatalogEntry, ClinicalToolStatusFilter } from "./types.ts";

const AREA_FILTERS: Record<Exclude<ClinicalToolAreaFilter, "all">, readonly string[]> = {
  language: ["linguaggio_precoce", "lessico", "sviluppo_comunicativo", "linguaggio_evolutivo", "morfosintassi", "comprensione", "narrazione", "pragmatica", "comunicazione_sociale", "fonetica", "fonologia", "intelligibilita", "afasia", "linguaggio_adulto", "neuropsicologia_del_linguaggio", "pragmatica_adulto", "comunicazione_cognitiva", "motor_speech", "disartria", "aprassia_verbale"],
  voice: ["voce", "valutazione_percettiva"],
  swallowing: ["disfagia", "deglutizione", "alimentazione_orale", "feeding", "disfagia_pediatrica", "consistenze", "oro_miofunzionale", "funzioni_orofacciali"],
  fluency: ["fluenza", "balbuzie"],
  aac: ["caa", "comunicazione", "disabilita_comunicativa_complessa", "comunicazione_precoce"],
  literacy: ["lettura", "scrittura", "ortografia", "comprensione_del_testo", "produzione_del_testo"],
};
const PEDIATRIC = new Set(["infant", "toddler", "preschool", "school_age", "child", "adolescent"]);
const ADULT = new Set(["adult", "older_adult"]);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").replaceAll("_", " ");

export function searchClinicalTools(entries: readonly ClinicalToolCatalogEntry[], query = "") {
  const needle = normalize(query.trim());
  if (!needle) return [...entries];
  return entries.filter((tool) => normalize([tool.name, tool.acronym, tool.shortDescription, tool.population.label, tool.population.targetDescription, tool.publisher, ...tool.clinicalAreas].filter(Boolean).join(" ")).includes(needle));
}

export function filterClinicalTools(entries: readonly ClinicalToolCatalogEntry[], audience: ClinicalToolAudienceFilter, area: ClinicalToolAreaFilter, status: ClinicalToolStatusFilter) {
  return entries.filter((tool) => {
    const audienceOk = audience === "all" || tool.population.lifeStages.some((stage) => (audience === "pediatric" ? PEDIATRIC : ADULT).has(stage));
    const areaOk = area === "all" || tool.clinicalAreas.some((code) => AREA_FILTERS[area].includes(code));
    const statusOk = status === "all"
      || (status === "armonia_original" && tool.origin === "armonia")
      || ((status === "external" || status === "integrated") && tool.integrationStatus === status)
      || (status !== "armonia_original" && status !== "external" && status !== "integrated" && tool.licenseStatus === status);
    return audienceOk && areaOk && statusOk;
  });
}

export const clinicalAreaLabel = (value: string) => ({ linguaggio_precoce: "Linguaggio precoce", sviluppo_comunicativo: "Sviluppo comunicativo", linguaggio_evolutivo: "Linguaggio", fonetica: "Fonetica", fonologia: "Fonologia", intelligibilita: "Intelligibilità", voce: "Voce", disfagia: "Disfagia", deglutizione: "Deglutizione", fluenza: "Fluenza", afasia: "Afasia", motor_speech: "Parlato motorio", caa: "CAA", lettura: "Lettura", scrittura: "Scrittura" } as Record<string, string>)[value] || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
export const toolTypeLabel = (value: string) => ({ standardized_battery: "Batteria standardizzata", standardized_test: "Test standardizzato", caregiver_report: "Questionario caregiver", caregiver_or_informant_questionnaire: "Questionario caregiver", caregiver_rating_scale: "Scala caregiver", patient_reported_outcome: "Autovalutazione / outcome riferito dal paziente", screening_questionnaire: "Screening", patient_reported_screening: "Screening", clinician_rating_protocol: "Protocollo clinico", clinician_rating_scale: "Scala clinica", speech_sound_assessment: "Valutazione fonetico-fonologica", outcome_measure: "Misura di outcome", standard_framework: "Standard internazionale di classificazione delle consistenze", bedside_screening: "Screening bedside", screening_battery: "Batteria di screening", brief_screening_battery: "Batteria breve di screening", performance_based_assessment: "Valutazione prestazionale", communication_profile: "Profilo comunicativo", clinical_protocol: "Protocollo clinico", self_report_or_interview_scale: "Scala self-report / intervista", observational_profile: "Profilo osservativo", qualitative_observation: "Osservazione qualitativa", monitoring_tool: "Strumento di monitoraggio" } as Record<string, string>)[value] || "Strumento clinico";
export const licenseStatusLabel = (value: ClinicalToolCatalogEntry["licenseStatus"]) => ({ open_verified: "Open verificato", permission_required: "Licenza richiesta", restricted: "Uso limitato", unclear: "Diritti da verificare", armonia_original: "Strumento originale ARMONIA" })[value];
export const italianVersionLabel = (tool: ClinicalToolCatalogEntry) => {
  if (!tool.italianVersionAvailable) return tool.italianVersionType === "none" ? "Nessuna versione italiana verificata" : "Versione italiana non verificata";
  if (["validated_adaptation", "validated_translation", "standardized_adaptation"].includes(tool.italianVersionType)) return "Versione italiana validata";
  if (["official_adaptation", "official_translation"].includes(tool.italianVersionType)) return "Versione italiana ufficiale";
  if (["original_italian", "original_italian_revised"].includes(tool.italianVersionType)) return "Strumento originale italiano";
  if (tool.italianVersionType === "translated_adaptation") return "Adattamento italiano";
  return "Versione italiana disponibile";
};
export const rightsLabel = (value: string) => ({ allowed: "Consentito", allowed_with_attribution: "Consentito con attribuzione", allowed_with_conditions: "Consentito con condizioni", allowed_noncommercial_unmodified: "Solo non commerciale e senza modifiche", permission_required: "Richiede autorizzazione", forbidden: "Non consentito", forbidden_except_license: "Non consentito salvo licenza", forbidden_without_permission: "Non consentito senza autorizzazione", restricted_to_language_translation: "Limitato alla traduzione linguistica", unknown: "Da verificare" } as Record<string, string>)[value] || "Da verificare";

export function primaryLink(tool: ClinicalToolCatalogEntry) {
  if (tool.id === "iddsi-framework-it") return { href: "https://www.iddsi.org/standards/framework-plus-resources", label: "Consulta materiali ufficiali ↗" };
  if (tool.officialPurchaseUrl) return { href: tool.officialPurchaseUrl, label: "Acquista / richiedi licenza ↗" };
  const reference = tool.references.find((item) => item.kind.includes("publisher")) || tool.references.find((item) => item.kind.includes("official")) || tool.references[0];
  if (reference) return { href: reference.url, label: reference.kind.includes("publisher") ? "Editore ↗" : reference.kind.includes("scientific") ? "Fonte scientifica ↗" : reference.kind.includes("rights") ? "Informazioni sulla licenza ↗" : "Fonte ufficiale ↗" };
  return tool.officialUrl ? { href: tool.officialUrl, label: "Fonte ufficiale ↗" } : undefined;
}
