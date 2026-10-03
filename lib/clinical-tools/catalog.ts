import { clinicalToolsV1, clinicalToolsV1Meta } from "../../data/clinical-tools/catalog-v1.ts";
import { armoniaOriginalClinicalToolsV1 } from "../../data/clinical-tools/armonia-originals-v1.ts";
import type { ClinicalToolCatalogEntry } from "./types.ts";
import { validateClinicalToolCatalog } from "./validation.ts";

export const clinicalToolCatalog = [...clinicalToolsV1, ...armoniaOriginalClinicalToolsV1] as readonly unknown[] as readonly ClinicalToolCatalogEntry[];
export const clinicalToolCatalogMeta = { ...clinicalToolsV1Meta, recordCount: clinicalToolCatalog.length };
export const clinicalToolCatalogErrors = validateClinicalToolCatalog(clinicalToolCatalog);
if (clinicalToolCatalogErrors.length) throw new Error(`Catalogo strumenti clinici non valido: ${clinicalToolCatalogErrors.join(" ")}`);

export const visibleClinicalTools = clinicalToolCatalog.filter((tool) => tool.catalogReviewStatus === "reviewed");
export const getClinicalTool = (id: string) => visibleClinicalTools.find((tool) => tool.id === id);
