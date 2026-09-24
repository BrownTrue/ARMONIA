import { LanguageOralEditor } from "./modules/language-oral-editor";
import type { ComponentType } from "react";
import type { ClinicalModuleEditorProps } from "@/lib/clinical/module-registry";

const editors: { code: string; version: number; Editor: ComponentType<ClinicalModuleEditorProps<unknown>> }[] = [
  { code: "language_oral", version: 1, Editor: LanguageOralEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
];

export function getClinicalModuleEditor(code: string, version: number) {
  return editors.find((entry) => entry.code === code && entry.version === version)?.Editor;
}
