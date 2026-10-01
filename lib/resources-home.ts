import type { Material } from "./types.ts";

export function recentMaterials(materials: Material[], limit = 5) {
  return [...materials]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
}

export function filterResourceMaterials(materials: Material[], filter: "all" | "favorites") {
  return filter === "favorites" ? materials.filter((material) => material.favorite) : materials;
}

export function materialKind(material: Material) {
  if (material.externalUrl) return "Link";
  if (material.mimeType.startsWith("image/")) return "Immagine";
  if (material.mimeType.startsWith("audio/")) return "Audio";
  if (material.mimeType.includes("pdf")) return "PDF";
  if (material.fileName.toLowerCase().endsWith(".docx")) return "Documento";
  return "File";
}
