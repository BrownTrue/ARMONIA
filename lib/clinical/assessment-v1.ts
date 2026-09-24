import { uid } from "../types.ts";
import type { ClinicalAssessment } from "./types.ts";

export type ClinicalAvailability = "available" | "not_available" | "not_applicable";

export type ClinicalValue<T> = {
  value?: T;
  availability?: ClinicalAvailability;
  note?: string;
};

export type ClinicalChoice = {
  code: string;
  label?: string;
};

export type AssessmentTestEntryV1 = {
  id: string;
  name?: string;
  date?: string;
  area?: string;
  rawScore?: number | string;
  standardizedScore?: number | string;
  percentile?: number | string;
  notes?: string;
};

export type LanguageCommunicationAssessmentV1 = {
  accessReason?: {
    reportedBy?: ClinicalValue<string>;
    description?: string;
    concerns?: string[];
    notes?: string;
  };
  anamnesis?: {
    pregnancyBirth?: ClinicalValue<string>;
    motorDevelopment?: ClinicalValue<string>;
    firstWordsMonths?: ClinicalValue<number>;
    firstCombinationsMonths?: ClinicalValue<number>;
    hearing?: ClinicalValue<string[]>;
    professionals?: string[];
    general?: string;
    developmental?: string;
    medical?: string;
    family?: string;
    educational?: string;
    languages?: string[];
    unavailableAreas?: string[];
    notes?: string;
  };
  observation?: {
    communication?: ClinicalValue<string>;
    communicativeIntent?: ClinicalValue<string>;
    comprehensionProfile?: ClinicalValue<string>;
    production?: ClinicalValue<string[]>;
    intelligibility?: ClinicalValue<string>;
    vocabulary?: ClinicalValue<string>;
    morphosyntax?: ClinicalValue<string>;
    pragmatics?: ClinicalValue<string>;
    context?: string;
    communicationProfile?: string;
    comprehension?: string;
    expression?: string;
    interaction?: string;
    speech?: string;
    observedFeatures?: ClinicalChoice[];
    notes?: string;
  };
  tests?: {
    items?: AssessmentTestEntryV1[];
    notAdministered?: boolean;
    notes?: string;
  };
  summary?: {
    clinicalSummary?: string;
    strengths?: string[];
    difficulties?: string[];
    conclusions?: string;
    recommendations?: string;
    notes?: string;
  };
  goals?: {
    planningNotes?: string;
  };
};

export function createLanguageCommunicationAssessmentV1(
  patientId: string,
  clinicalPathwayId: string,
  now = new Date().toISOString(),
): ClinicalAssessment {
  return {
    id: uid(),
    patientId,
    clinicalPathwayId,
    moduleType: "language_communication",
    assessmentType: "initial",
    status: "draft",
    schemaVersion: 1,
    data: {},
    createdAt: now,
    updatedAt: now,
  };
}
