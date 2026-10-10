// Branding is stored as WebP, which React PDF cannot embed directly.
// Resolve the browser-readable source before rendering, preserving transparency.
export async function resolveAttendancePdfLogo(source?: string): Promise<string | undefined> {
  if (!source) return undefined;
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("attendance_logo_unavailable"));
      image.src = source;
    });
    if (!image.naturalWidth || !image.naturalHeight) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    // A missing/invalid logo must not prevent exporting the attestation.
    return undefined;
  }
}
