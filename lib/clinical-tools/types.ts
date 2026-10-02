export type ClinicalToolReference = { kind: string; title: string; url: string };
export type ClinicalToolRights = {
  licenseType: string;
  commercialUse: string;
  redistribution: string;
  modification: string;
  softwareIntegration: string;
  licenseUrl: string | null;
  lastCheckedDate: string;
};

export type ClinicalToolCatalogEntry = {
  id: string;
  name: string;
  acronym: string | null;
  version: string | null;
  clinicalAreas: readonly string[];
  toolType: string;
  shortDescription: string;
  population: {
    label: string;
    lifeStages: readonly string[];
    ageMinMonths: number | null;
    ageMaxMonths: number | null;
    targetDescription: string;
  };
  originalLanguage: string;
  availableLanguages: readonly string[];
  italianVersionAvailable: boolean;
  italianVersionType: string;
  italianEvidence: string;
  italianValidation: {
    reference: string | null;
    year: number | null;
    sampleSize: number | null;
    normativeDataAvailable: boolean;
    italianCutoffAvailable: boolean | null;
  };
  administrationModes: readonly string[];
  approximateDurationMinutes: number | null;
  resultType: string;
  scoringAvailable: boolean;
  publisher: string | null;
  rightsHolder: string | null;
  officialUrl: string | null;
  officialPurchaseUrl: string | null;
  rights: ClinicalToolRights;
  integrationStatus: "external" | "catalog_only";
  licenseStatus: "open_verified" | "permission_required" | "restricted" | "unclear";
  partnershipStatus: "none" | "partner";
  suggestedIntegration: string;
  references: readonly ClinicalToolReference[];
  catalogReviewStatus: "reviewed" | "needs_review";
};

export type ClinicalToolAudienceFilter = "all" | "pediatric" | "adult";
export type ClinicalToolAreaFilter = "all" | "language" | "voice" | "swallowing" | "fluency" | "aac" | "literacy";
export type ClinicalToolStatusFilter = "all" | "open_verified" | "external" | "permission_required";
