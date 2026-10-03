import "server-only";
import path from "node:path";
import { getClinicalTool } from "./catalog";

const MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
} as const;

export function resolveOriginalClinicalToolMaterial(toolId: string, materialId: string) {
  const tool = getClinicalTool(toolId);
  if (!tool || tool.origin !== "armonia") return undefined;
  const material = tool.materials?.find((entry) => entry.id === materialId);
  if (!material || path.basename(material.fileName) !== material.fileName) return undefined;
  const folder = tool.id.replace(/^armonia-/, "");
  return {
    tool,
    material,
    filePath: path.join(process.cwd(), "private", "clinical-tools", "originals", folder, material.fileName),
    contentType: MIME_TYPES[material.kind],
  };
}
