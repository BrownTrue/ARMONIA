import { armoniaAssetCatalog } from "../data/armonia-assets/catalog.ts";
import { validateAssetCatalog } from "../lib/asset-bank/validation.ts";

const result = validateAssetCatalog(armoniaAssetCatalog);
for (const warning of result.warnings) console.warn(`WARN ${warning.assetId || "catalogo"}:${warning.field || "entry"} ${warning.message}`);
if (!result.valid) {
  for (const error of result.errors) console.error(`ERROR ${error.assetId || "catalogo"}:${error.field || "entry"} ${error.message}`);
  process.exitCode = 1;
} else console.log(`Banca Asset valida: ${armoniaAssetCatalog.length} asset, ${result.warnings.length} avvisi.`);
