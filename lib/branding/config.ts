export const BRANDING_FALLBACK_LOGO = "/branding/logo-mark.svg";
export const BRANDING_BUCKET = "professional-branding";
export const BRANDING_LOCAL_KEY = "professional-logo";
export const BRANDING_MAX_FILE_SIZE = 2 * 1024 * 1024;
export const BRANDING_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type BrandingFileInfo = { type: string; size: number };

export function validateBrandingFile(file: BrandingFileInfo) {
  if (!(BRANDING_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Usa un’immagine PNG, JPG o WebP.");
  }
  if (file.size > BRANDING_MAX_FILE_SIZE) {
    throw new Error("Il logo deve essere inferiore a 2 MB.");
  }
  if (file.size <= 0) throw new Error("Il file selezionato è vuoto.");
}

export const brandingStoragePath = (userId: string) => `${userId}/logo.webp`;
export const brandingLogoOrFallback = (logoUrl?: string | null) => logoUrl || BRANDING_FALLBACK_LOGO;
