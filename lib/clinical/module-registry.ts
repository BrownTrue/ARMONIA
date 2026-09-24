import type { ComponentType } from "react";
import type { ClinicalModuleInstance } from "./assessment-v2.ts";

export type ClinicalPrintField = { label: string; value: string | string[] };
export type ClinicalPrintSection = { code: string; title: string; fields: ClinicalPrintField[] };
export type ClinicalModuleEditorProps<TData> = {
  value: TData;
  readOnly: boolean;
  onChange: (value: TData) => void;
};

export type ClinicalModuleDefinition<TData = unknown> = {
  code: string;
  version: number;
  label: string;
  createEmptyData: () => TData;
  validate: (value: unknown) => value is TData;
  editor?: ComponentType<ClinicalModuleEditorProps<TData>>;
  toPrintSections: (data: TData) => ClinicalPrintSection[];
};

const isEmptyRecord = (value: unknown): value is Record<string, never> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;

const languageOralV1: ClinicalModuleDefinition<Record<string, never>> = {
  code: "language_oral",
  version: 1,
  label: "Linguaggio orale",
  createEmptyData: () => ({}),
  validate: isEmptyRecord,
  toPrintSections: () => [],
};

const definitions = [languageOralV1] as const;

export function getClinicalModuleDefinition(code: string, version: number) {
  return definitions.find((definition) => definition.code === code && definition.version === version);
}

export function isRegisteredClinicalModule(instance: ClinicalModuleInstance) {
  const definition = getClinicalModuleDefinition(instance.code, instance.version);
  return Boolean(definition && definition.validate(instance.data));
}

export function createClinicalModuleInstance(code: string, version: number): ClinicalModuleInstance {
  const definition = getClinicalModuleDefinition(code, version);
  if (!definition) throw new Error(`Modulo clinico non supportato: ${code} V${version}.`);
  return { code, version, data: definition.createEmptyData() };
}

export const clinicalModuleRegistry = definitions;
