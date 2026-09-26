export type DatabaseMaterialObject = { materialId: string; path: string; size: number };
export type StorageMaterialObject = { path: string; size: number };
export type StorageListEntry = { name: string; metadata?: { size?: number } | null };

export async function collectAllPages<T>(pageSize: number, fetchPage: (from: number, to: number) => Promise<T[]>) {
  const result: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    result.push(...page);
    if (page.length < pageSize) return result;
  }
}

export async function walkStorageNamespace(
  root: string,
  listPage: (prefix: string, offset: number, limit: number) => Promise<StorageListEntry[]>,
  pageSize = 100,
  maxDepth = 32,
) {
  const objects: StorageMaterialObject[] = [];
  const queue: Array<{ prefix: string; depth: number }> = [{ prefix: root.replace(/\/+$/, ""), depth: 0 }];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current.prefix)) continue;
    if (current.depth > maxDepth) throw new Error("storage_namespace_too_deep");
    visited.add(current.prefix);
    for (let offset = 0; ; offset += pageSize) {
      const page = await listPage(current.prefix, offset, pageSize);
      for (const entry of page) {
        if (!entry.name || entry.name === "." || entry.name === ".." || entry.name.includes("/") || entry.name.includes("\\")) throw new Error("invalid_storage_entry");
        const path = `${current.prefix}/${entry.name}`;
        if (entry.metadata) objects.push({ path, size: Number(entry.metadata.size || 0) });
        else queue.push({ prefix: path, depth: current.depth + 1 });
      }
      if (page.length < pageSize) break;
    }
  }
  return objects;
}

export function buildStorageReconciliationReport(database: DatabaseMaterialObject[], storage: StorageMaterialObject[]) {
  const databaseByPath = new Map(database.map(item => [item.path, item]));
  const storageByPath = new Map(storage.map(item => [item.path, item]));
  return {
    storageOrphans: storage.filter(item => !databaseByPath.has(item.path)),
    databaseOrphans: database.filter(item => !storageByPath.has(item.path)),
    sizeMismatches: database.flatMap(item => {
      const object = storageByPath.get(item.path);
      return object && object.size !== item.size ? [{ materialId: item.materialId, path: item.path, databaseSize: item.size, storageSize: object.size }] : [];
    }),
    totalRealBytes: storage.reduce((total, item) => total + item.size, 0),
    totalDatabaseBytes: database.reduce((total, item) => total + item.size, 0),
  };
}
