export type MaterialDeleteRecord = {
  id: string;
  storagePath: string | null;
};

export type StorageRemovalError = {
  message?: string;
  status?: number;
  statusCode?: number | string;
  code?: string;
};

export function isMissingStorageObject(error: StorageRemovalError | null | undefined) {
  if (!error) return false;
  const status = Number(error.status ?? error.statusCode);
  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || "").toLowerCase();
  return status === 404 || code === "not_found" || code === "nosuchkey"
    || message.includes("not found") || message.includes("does not exist");
}

export async function deleteTherapeuticMaterialRecord(input: {
  userId: string;
  material: MaterialDeleteRecord | null;
  removeStorageObject: (path: string) => Promise<{ error?: StorageRemovalError | null }>;
  deleteRecord: (materialId: string) => Promise<void>;
}) {
  const { userId, material, removeStorageObject, deleteRecord } = input;
  if (!material) return { alreadyDeleted: true };

  if (material.storagePath) {
    if (!material.storagePath.startsWith(`${userId}/`)) throw new Error("invalid_storage_path");
    const removal = await removeStorageObject(material.storagePath);
    if (removal.error && !isMissingStorageObject(removal.error)) throw removal.error;
  }

  // The RPC owns the database delete and quota decrement. It is called once
  // per request and is idempotent when a retry finds the record already gone.
  await deleteRecord(material.id);
  return { alreadyDeleted: false };
}
