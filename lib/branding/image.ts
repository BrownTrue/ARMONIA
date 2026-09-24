import { BRANDING_MAX_FILE_SIZE, validateBrandingFile } from "./config";

const canvasBlob = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Elaborazione immagine non riuscita.")), "image/webp", quality);
});

export async function normalizeBrandingImage(file: File) {
  validateBrandingFile(file);
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / image.width, 1200 / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas non disponibile.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    let blob = await canvasBlob(canvas, 0.88);
    if (blob.size > BRANDING_MAX_FILE_SIZE) blob = await canvasBlob(canvas, 0.72);
    if (blob.size > BRANDING_MAX_FILE_SIZE) throw new Error("Il logo elaborato è ancora troppo grande.");
    return blob;
  } catch {
    throw new Error("Non è stato possibile elaborare il logo. Il logo precedente è rimasto invariato.");
  }
}

export async function waitForPrintableLogo() {
  const image = document.querySelector<HTMLImageElement>(".assessment-print-logo img");
  if (!image) return;
  try {
    if (!image.complete || image.naturalWidth === 0) await image.decode();
    if (image.naturalWidth === 0) throw new Error();
  } catch {
    image.src = "/branding/logo-mark.svg";
    try { await image.decode(); } catch { /* La stampa resta disponibile anche senza immagine. */ }
  }
}
