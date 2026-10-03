import type { AppData } from "../types.ts";

export const DATA_EXPORT_SCHEMA_VERSION = 1 as const;
export type DataExportKind = "patients"|"appointments"|"sessions"|"economy"|"clinical"|"worksheets"|"materials"|"all";
export type DataExportSnapshot = {
  data: AppData;
  patientMaterials: { patientId: string; materialId: string }[];
  sessionMaterials: { sessionId: string; materialId: string }[];
};

export type ExportFile = { name: string; content: string };
