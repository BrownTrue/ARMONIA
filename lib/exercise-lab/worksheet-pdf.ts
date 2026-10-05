import type { WorksheetPrintModel } from "./worksheet-print.ts";

export type WorksheetPdfImageSources = Record<string, string>;
export type WorksheetPdfImageLoader = (path: string) => Promise<string>;

export function worksheetPdfFileName(date: Date | string = new Date()) {
  const iso = typeof date === "string" ? date : date.toISOString();
  const day = /^\d{4}-\d{2}-\d{2}/.exec(iso)?.[0];
  if (!day) throw new Error("worksheet_pdf_date_invalid");
  return `scheda-attivita-${day}.pdf`;
}

export function worksheetPdfImagePaths(model: WorksheetPrintModel) {
  const paths: string[] = [];
  for (const block of model.blocks) {
    if (block.kind === "picture_naming") paths.push(...block.items.map((item) => item.imagePath));
    if (block.kind === "minimal_pairs") {
      for (const item of block.items) {
        if (item.imagePathA) paths.push(item.imagePathA);
        if (item.imagePathB) paths.push(item.imagePathB);
      }
    }
  }
  return [...new Set(paths)];
}

export async function resolveWorksheetPdfImageSources(
  model: WorksheetPrintModel,
  loader: WorksheetPdfImageLoader = loadWorksheetImageAsPng,
): Promise<WorksheetPdfImageSources> {
  const entries = await Promise.all(worksheetPdfImagePaths(model).map(async (path) => {
    const source = await loader(path);
    if (!source) throw new Error(`worksheet_pdf_asset_missing:${path}`);
    return [path, source] as const;
  }));
  return Object.fromEntries(entries);
}

export function assertWorksheetPdfImages(model: WorksheetPrintModel, sources: WorksheetPdfImageSources) {
  const missing = worksheetPdfImagePaths(model).filter((path) => !sources[path]);
  if (missing.length) throw new Error(`worksheet_pdf_assets_missing:${missing.join(",")}`);
}

async function loadWorksheetImageAsPng(path: string) {
  if (typeof window === "undefined") throw new Error("worksheet_pdf_browser_required");
  const resolved = new URL(path, window.location.href);
  if (resolved.origin !== window.location.origin) throw new Error("worksheet_pdf_external_asset");
  const response = await fetch(resolved.href, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`worksheet_pdf_asset_unavailable:${path}`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error(`worksheet_pdf_asset_invalid:${path}`);
  if (blob.type === "image/png" || blob.type === "image/jpeg") return blobDataUrl(blob);
  return imageBlobAsPng(blob);
}

function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("worksheet_pdf_asset_read_failed"));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("worksheet_pdf_asset_read_failed"));
    reader.readAsDataURL(blob);
  });
}

async function imageBlobAsPng(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("worksheet_pdf_asset_decode_failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) throw new Error("worksheet_pdf_asset_decode_failed");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
