import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type EncryptedValue = { v: 1; iv: string; tag: string; data: string };

const ENCRYPTION_KEY_ERROR = "CALENDAR_FEED_ENCRYPTION_KEY deve essere Base64URL valida e decodificare esattamente 32 byte";

export function parseCalendarFeedEncryptionKey(value: string | undefined) {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error(ENCRYPTION_KEY_ERROR);
  const key = Buffer.from(value, "base64url");
  if (key.length !== 32 || key.toString("base64url") !== value) throw new Error(ENCRYPTION_KEY_ERROR);
  return key;
}

export function generateCalendarFeedToken(bytes: (size: number) => Buffer = randomBytes) {
  return bytes(32).toString("base64url");
}

export function hashCalendarFeedToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function encryptCalendarFeedToken(token: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", parseCalendarFeedEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const packed: EncryptedValue = {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
  return JSON.stringify(packed);
}

export function decryptCalendarFeedToken(value: string, secret: string) {
  const packed = JSON.parse(value) as EncryptedValue;
  if (packed.v !== 1 || !packed.iv || !packed.tag || !packed.data) throw new Error("Token calendario cifrato non valido");
  const decipher = createDecipheriv("aes-256-gcm", parseCalendarFeedEncryptionKey(secret), Buffer.from(packed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(packed.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(packed.data, "base64")), decipher.final()]).toString("utf8");
}

export function createCalendarFeedCredentials(secret: string, token = generateCalendarFeedToken()) {
  return {
    token,
    tokenHash: hashCalendarFeedToken(token),
    tokenEncrypted: encryptCalendarFeedToken(token, secret),
  };
}
