import type { AssetEntry } from "../../lib/asset-bank/types.ts";
import { ASSET_GRID_MANIFEST } from "./grid-manifest.mjs";
import { armoniaAssetPhonology } from "./phonology.ts";

const categoryLemmas = {
  animali: ["cane", "gatto", "rana", "pesce", "zebra", "volpe", "tigre", "scimmia", "giraffa", "coniglio"],
  alimenti: ["pane", "banana", "mela", "pera", "fragola", "gelato", "ciliegia", "limone", "torta", "biscotto"],
  casa: ["casa", "sedia", "tavolo", "porta", "finestra", "letto", "bicchiere", "cucchiaio", "spazzola", "bagno"],
  scuola_gioco: ["libro", "penna", "matita", "quaderno", "gomma", "zaino", "forbici", "palla", "bambola", "dado"],
  corpo_abbigliamento: ["scarpa", "calza", "maglia", "cappello", "mano", "piede", "bocca", "naso", "braccio", "ginocchio"],
  trasporti: ["auto", "treno", "barca", "bici", "camion", "moto"],
  natura: ["fiore", "albero", "stella", "foglia"],
  oggetti: ["chiave", "telefono", "orologio", "piatto", "bottiglia", "scatola", "regalo", "ombrello", "specchio", "candela"],
} as const;

const categoryByLemma = new Map<string, string>(Object.entries(categoryLemmas).flatMap(([category, lemmas]) => lemmas.map((lemma) => [lemma, category])));
const manifestFiles = ASSET_GRID_MANIFEST.flatMap((batch) => batch.files);

function entryFromFilename(filename: string): AssetEntry {
  const id = filename.replace(/\.webp$/, ""), [kind, ...lemmaParts] = id.replace(/_\d{3}$/, "").split("_"), label = lemmaParts.join(" ");
  const partOfSpeech = kind === "noun" ? "noun" : kind === "verb" ? "verb" : "adjective";
  const semanticCategory = kind === "verb" ? "azioni" : kind === "concept" ? "concetti" : categoryByLemma.get(label);
  if (!semanticCategory) throw new Error(`Categoria editoriale mancante per ${filename}`);
  const altText = kind === "noun" ? `Illustrazione raffigurante ${label}` : kind === "verb" ? `Illustrazione dell’azione “${label}”` : `Illustrazione del concetto “${label}”`;
  return { id, label, semanticCategory, imagePath: `/armonia-assets/images/${filename}`, altText, sourceType: "armonia_original", commercialUseAllowed: false, reviewStatus: "draft", partOfSpeech };
}

// Il manifest resta la fonte tecnica autorevole di ID, filename e path. I
// metadati linguistici non revisionati vengono intenzionalmente omessi.
const baseCatalog = manifestFiles.map(entryFromFilename);
const knownIds = new Set(baseCatalog.map((asset) => asset.id));
for (const id of Object.keys(armoniaAssetPhonology)) if (!knownIds.has(id)) throw new Error(`Metadati fonologici collegati a un asset inesistente: ${id}`);
export const armoniaAssetCatalog: AssetEntry[] = baseCatalog.map((asset) => ({ ...asset, ...armoniaAssetPhonology[asset.id] }));
