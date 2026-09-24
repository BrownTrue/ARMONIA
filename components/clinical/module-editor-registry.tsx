import { LanguageOralEditor } from "./modules/language-oral-editor";
import { AacMultimodalEditor, AuditoryCommunicationEditor, FeedingSwallowingEditor, FluencyEditor, MotorSpeechEditor, OrofacialFunctionsEditor, SpeechSoundEditor, VoiceEditor } from "./modules/observational-module-editors";
import type { ComponentType } from "react";
import type { ClinicalModuleEditorProps } from "@/lib/clinical/module-registry";

const editors: { code: string; version: number; Editor: ComponentType<ClinicalModuleEditorProps<unknown>> }[] = [
  { code: "language_oral", version: 1, Editor: LanguageOralEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "speech_sound", version: 1, Editor: SpeechSoundEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "motor_speech", version: 1, Editor: MotorSpeechEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "fluency", version: 1, Editor: FluencyEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "voice", version: 1, Editor: VoiceEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "feeding_swallowing", version: 1, Editor: FeedingSwallowingEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "orofacial_functions", version: 1, Editor: OrofacialFunctionsEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "aac_multimodal", version: 1, Editor: AacMultimodalEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
  { code: "auditory_communication", version: 1, Editor: AuditoryCommunicationEditor as ComponentType<ClinicalModuleEditorProps<unknown>> },
];

export function getClinicalModuleEditor(code: string, version: number) {
  return editors.find((entry) => entry.code === code && entry.version === version)?.Editor;
}
