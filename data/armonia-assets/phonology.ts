import type { AssetPhonologyMetadata } from "../../lib/asset-bank/types.ts";

// Dizionario editoriale sparso collegato tramite AssetEntry.id.
// Aggiungere una voce soltanto quando la revisione fonologica del lemma è iniziata.
// La trascrizione è IPA ampia/editoriale e può richiedere note sulle varianti.
export const armoniaAssetPhonology: Partial<Record<string, AssetPhonologyMetadata>> = {};
