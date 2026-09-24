import { BRANDING_LOCAL_KEY } from "./config";

const openFilesDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("armonia-files", 2);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files");
    if (!request.result.objectStoreNames.contains("branding")) request.result.createObjectStore("branding");
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export async function readLocalBrandingLogo() {
  const database = await openFilesDatabase();
  return new Promise<Blob | undefined>((resolve, reject) => {
    const request = database.transaction("branding").objectStore("branding").get(BRANDING_LOCAL_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function writeLocalBrandingLogo(blob: Blob) {
  const database = await openFilesDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("branding", "readwrite");
    transaction.objectStore("branding").put(blob, BRANDING_LOCAL_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteLocalBrandingLogo() {
  const database = await openFilesDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("branding", "readwrite");
    transaction.objectStore("branding").delete(BRANDING_LOCAL_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
