const FALLBACK_LOGO = "/branding/logo-mark.svg";

export function assessmentPdfFileName(now: Date | string = new Date()) {
  const date = typeof now === "string" ? new Date(now) : now;
  if (Number.isNaN(date.getTime())) throw new Error("assessment_pdf_date_invalid");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `valutazione-clinica-${year}-${month}-${day}.pdf`;
}

export async function resolveAssessmentPdfLogo(logoSrc?: string) {
  const sources = [...new Set([logoSrc, FALLBACK_LOGO].filter((value): value is string => Boolean(value)))];
  for (const source of sources) {
    try {
      const resolved = await resolveImageSource(source);
      if (resolved) return resolved;
    } catch {
      // A text mark is rendered if both the custom and fallback logo cannot be read.
    }
  }
  return undefined;
}

async function resolveImageSource(source: string) {
  if (!source.startsWith("blob:") && !source.startsWith("data:") && !source.startsWith("/")) throw new Error("assessment_pdf_logo_external");
  const response = await fetch(source);
  if (!response.ok) throw new Error("assessment_pdf_logo_unavailable");
  const blob = await response.blob();
  if (blob.type === "image/png" || blob.type === "image/jpeg") return blobToDataUrl(blob);
  return rasterizeToPng(blob);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("assessment_pdf_logo_read_failed"));
    reader.onerror = () => reject(new Error("assessment_pdf_logo_read_failed"));
    reader.readAsDataURL(blob);
  });
}

async function rasterizeToPng(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("assessment_pdf_logo_canvas_failed");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("assessment_pdf_logo_decode_failed"));
    image.src = source;
  });
}
