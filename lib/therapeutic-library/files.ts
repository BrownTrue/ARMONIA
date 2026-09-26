import { unzipSync } from "fflate";

export const STORAGE_QUOTA_BYTES = 1_073_741_824;
export const MAX_MATERIAL_FILE_BYTES = 20_971_520;
// Supabase signed upload tokens are valid for two hours. The extra hour keeps
// quota reserved until the token is expired and any in-flight upload has a
// conservative grace period before cleanup can release bytes.
export const UPLOAD_RESERVATION_TTL_SECONDS = 3 * 60 * 60;

export type AllowedMaterialExtension = "pdf" | "png" | "jpg" | "jpeg" | "mp3" | "m4a" | "wav" | "docx";

export const MATERIAL_FILE_TYPES: Record<AllowedMaterialExtension, readonly string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  mp3: ["audio/mpeg", "audio/mp3"],
  m4a: ["audio/mp4", "audio/x-m4a", "audio/m4a"],
  wav: ["audio/wav", "audio/x-wav", "audio/wave"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export type MaterialFileDeclaration = { fileName: string; size: number; mimeType: string };

export class MaterialFileValidationError extends Error {
  readonly code: "file_too_large" | "unsupported_format" | "invalid_content";
  constructor(code: "file_too_large" | "unsupported_format" | "invalid_content", message: string) { super(message); this.name = code; this.code = code; }
}

export function materialExtension(fileName: string): AllowedMaterialExtension | null {
  const match = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = match?.[1] as AllowedMaterialExtension | undefined;
  return extension && extension in MATERIAL_FILE_TYPES ? extension : null;
}

export function validateMaterialFileDeclaration(input: MaterialFileDeclaration) {
  if (!Number.isSafeInteger(input.size) || input.size <= 0 || input.size > MAX_MATERIAL_FILE_BYTES) {
    if (input.size > MAX_MATERIAL_FILE_BYTES) throw new MaterialFileValidationError("file_too_large", "Il file supera il limite di 20 MB.");
    throw new MaterialFileValidationError("unsupported_format", "Questo formato non è supportato.");
  }
  const extension = materialExtension(input.fileName);
  if (!extension || !MATERIAL_FILE_TYPES[extension].includes(input.mimeType.toLowerCase())) {
    throw new MaterialFileValidationError("unsupported_format", "Questo formato non è supportato.");
  }
  return { extension, mimeType: input.mimeType.toLowerCase(), size: input.size };
}

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value);
const ascii = (bytes: Uint8Array, start: number, length: number) => new TextDecoder("latin1").decode(bytes.subarray(start, start + length));

function validDocx(bytes: Uint8Array) {
  const MAX_ENTRIES = 2_048;
  const MAX_TOTAL_UNCOMPRESSED = 100 * 1_048_576;
  const MAX_ENTRY_UNCOMPRESSED = 25 * 1_048_576;
  const MAX_CONTENT_TYPES_BYTES = 1_048_576;
  let entryCount = 0;
  let totalUncompressed = 0;
  let hasDocument = false;
  let hasMacro = false;
  let unsafeArchive = false;
  const extracted = unzipSync(bytes, {
    filter: file => {
      entryCount += 1;
      totalUncompressed += file.originalSize;
      const segments = file.name.replace(/\\/g, "/").split("/");
      if (file.name.startsWith("/") || file.name.includes("\\") || segments.some(segment => segment === ".." || segment === ".")) unsafeArchive = true;
      if (entryCount > MAX_ENTRIES || totalUncompressed > MAX_TOTAL_UNCOMPRESSED || file.originalSize > MAX_ENTRY_UNCOMPRESSED) unsafeArchive = true;
      const normalized = file.name.replace(/^\/+/, "").toLowerCase();
      if (normalized === "word/document.xml") hasDocument = true;
      if (normalized.includes("vbaproject") || normalized.endsWith(".bin")) hasMacro = true;
      if (normalized === "[content_types].xml" && file.originalSize > MAX_CONTENT_TYPES_BYTES) unsafeArchive = true;
      return !unsafeArchive && normalized === "[content_types].xml" && file.originalSize <= MAX_CONTENT_TYPES_BYTES;
    },
  });
  const contentTypes = extracted["[Content_Types].xml"] || extracted["[content_types].xml"];
  if (!contentTypes || !hasDocument || hasMacro || unsafeArchive) return false;
  const xml = new TextDecoder().decode(contentTypes).toLowerCase();
  return xml.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")
    && !xml.includes("macroenabled")
    && !xml.includes("vba");
}

function validM4a(bytes: Uint8Array) {
  if (bytes.length < 16 || ascii(bytes, 4, 4) !== "ftyp") return false;
  const brands = ascii(bytes, 8, Math.min(24, bytes.length - 8)).toLowerCase();
  const audioBrand = brands.includes("m4a") || brands.includes("isom") || brands.includes("mp42");
  let hasAudio = false, hasVideo = false;
  for (let index = 4; index + 16 <= bytes.length; index += 1) {
    if (ascii(bytes, index, 4) !== "hdlr") continue;
    const handler = ascii(bytes, index + 12, 4).toLowerCase();
    if (handler === "soun") hasAudio = true;
    if (handler === "vide") hasVideo = true;
  }
  return audioBrand && hasAudio && !hasVideo;
}

function validMp3(bytes: Uint8Array) {
  let offset = 0;
  if (ascii(bytes, 0, 3) === "ID3") {
    if (bytes.length < 10 || [bytes[6], bytes[7], bytes[8], bytes[9]].some(value => (value & 0x80) !== 0)) return false;
    const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    offset = 10 + tagSize;
  }
  if (offset + 4 > bytes.length || bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) return false;
  const version = (bytes[offset + 1] >> 3) & 0x03;
  const layer = (bytes[offset + 1] >> 1) & 0x03;
  const bitrate = (bytes[offset + 2] >> 4) & 0x0f;
  const sampleRate = (bytes[offset + 2] >> 2) & 0x03;
  return version !== 1 && layer !== 0 && bitrate !== 0 && bitrate !== 15 && sampleRate !== 3;
}

export function validateMaterialFileContent(extension: AllowedMaterialExtension, bytes: Uint8Array) {
  let valid = false;
  if (extension === "pdf") valid = ascii(bytes, 0, 5) === "%PDF-";
  if (extension === "png") valid = startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "jpg" || extension === "jpeg") valid = startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (extension === "mp3") valid = validMp3(bytes);
  if (extension === "wav") valid = ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE";
  if (extension === "m4a") valid = validM4a(bytes);
  if (extension === "docx") {
    try { valid = validDocx(bytes); } catch { valid = false; }
  }
  if (!valid) throw new MaterialFileValidationError("invalid_content", "Il contenuto del file non corrisponde al formato dichiarato.");
}

export function materialUploadErrorMessage(code: string) {
  if (code === "file_too_large") return "Il file supera il limite di 20 MB.";
  if (code === "storage_quota_exceeded") return "Spazio esaurito. Elimina alcuni file prima di caricarne altri.";
  if (code === "storage_account_requires_reconciliation" || code === "storage_requires_reconciliation") return "Lo spazio disponibile è in verifica. Nel frattempo puoi aggiungere un link.";
  if (code === "upload_prepare_failed" || code === "upload_failed" || code === "upload_finalize_failed") return "Non è stato possibile completare il caricamento. Riprova senza cambiare file.";
  return "Questo formato non è supportato.";
}

export function formatStorageBytes(bytes: number) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(bytes % 1_073_741_824 === 0 ? 0 : 1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(bytes >= 104_857_600 ? 0 : 1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
