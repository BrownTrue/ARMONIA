import type { AssetPhonologyMetadata } from "../../lib/asset-bank/types.ts";

export type AssetPhonologyCandidate = AssetPhonologyMetadata & {
  assetId: string;
  phonologyReviewStatus: "needs_review";
};

// Nessun candidato pendente. Il file resta disponibile come coda editoriale
// per le future estensioni della Banca Asset.
export const armoniaAssetPhonologyCandidates: readonly AssetPhonologyCandidate[] = [];
