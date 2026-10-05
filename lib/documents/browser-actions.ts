export type DocumentSource =
  | { kind: "blob"; blob: Blob }
  | { kind: "url"; url: string };

export type DocumentShareResult = "shared" | "cancelled" | "unsupported";

type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

type ObjectUrlApi = Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;

export type PreparedDocumentUrl = {
  url: string;
  release: () => void;
};

export function documentFile(source: Extract<DocumentSource, { kind: "blob" }>, fileName: string) {
  return new File([source.blob], fileName, {
    type: source.blob.type || "application/pdf",
    lastModified: Date.now(),
  });
}

export function canShareDocument(source: DocumentSource, fileName: string, shareNavigator: ShareNavigator = navigator) {
  if (typeof shareNavigator.share !== "function") return false;
  if (source.kind === "url") return true;
  if (typeof shareNavigator.canShare !== "function") return false;
  try {
    return shareNavigator.canShare({ files: [documentFile(source, fileName)] });
  } catch {
    return false;
  }
}

export async function shareDocument(
  source: DocumentSource,
  fileName: string,
  title: string,
  shareNavigator: ShareNavigator = navigator,
): Promise<DocumentShareResult> {
  if (!canShareDocument(source, fileName, shareNavigator)) return "unsupported";
  try {
    if (source.kind === "blob") {
      await shareNavigator.share!({ title, files: [documentFile(source, fileName)] });
    } else {
      await shareNavigator.share!({ title, url: source.url });
    }
    return "shared";
  } catch (error) {
    if (isShareCancellation(error)) return "cancelled";
    throw error;
  }
}

export function prepareDocumentUrl(source: DocumentSource, objectUrls: ObjectUrlApi = URL): PreparedDocumentUrl {
  if (source.kind === "url") return { url: source.url, release: () => undefined };
  const url = objectUrls.createObjectURL(source.blob);
  let released = false;
  return {
    url,
    release: () => {
      if (released) return;
      released = true;
      objectUrls.revokeObjectURL(url);
    },
  };
}

export function isShareCancellation(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}

