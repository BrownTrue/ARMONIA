import { armoniaAssetCatalog } from "../data/armonia-assets/catalog.ts";
import { validateAssetCatalog } from "../lib/asset-bank/validation.ts";

const result = validateAssetCatalog(armoniaAssetCatalog);
for (const warning of result.warnings.slice(0, 20)) console.warn(`WARN ${warning.assetId || "catalogo"}:${warning.field || "entry"} ${warning.message}`);
if (result.warnings.length > 20) console.warn(`WARN altri ${result.warnings.length - 20} metadati facoltativi non compilati; consultare il catalogo per la revisione editoriale.`);
if (!result.valid) {
  for (const error of result.errors) console.error(`ERROR ${error.assetId || "catalogo"}:${error.field || "entry"} ${error.message}`);
  process.exitCode = 1;
} else console.log(`Banca Asset valida: ${armoniaAssetCatalog.length} asset, ${result.warnings.length} avvisi.`);
