import assert from "node:assert/strict";
import test from "node:test";
import { BRANDING_FALLBACK_LOGO, BRANDING_MAX_FILE_SIZE, brandingLogoOrFallback, brandingStoragePath, validateBrandingFile } from "./config.ts";

test("accetta esclusivamente PNG, JPEG e WebP entro 2 MB", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp"]) assert.doesNotThrow(() => validateBrandingFile({ type, size: 1024 }));
  assert.throws(() => validateBrandingFile({ type: "image/svg+xml", size: 1024 }), /PNG, JPG o WebP/);
  assert.throws(() => validateBrandingFile({ type: "image/png", size: BRANDING_MAX_FILE_SIZE + 1 }), /inferiore a 2 MB/);
});

test("usa un path deterministico isolato per utente", () => {
  assert.equal(brandingStoragePath("user-123"), "user-123/logo.webp");
});

test("usa il logo Armonia come fallback", () => {
  assert.equal(brandingLogoOrFallback(), BRANDING_FALLBACK_LOGO);
  assert.equal(brandingLogoOrFallback("blob:logo"), "blob:logo");
});
