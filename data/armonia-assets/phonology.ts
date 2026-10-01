import type { AssetPhonologyMetadata } from "../../lib/asset-bank/types.ts";

// Dizionario editoriale sparso collegato tramite AssetEntry.id.
// Aggiungere una voce soltanto quando la revisione fonologica del lemma è iniziata.
// La trascrizione è IPA ampia/editoriale e può richiedere note sulle varianti.
const reviewedAssetPhonologySample: Partial<Record<string, AssetPhonologyMetadata>> = {
  noun_rana_001: {
    syllabification: "ra-na",
    syllableCount: 2,
    phonemicTranscription: "/ˈrana/",
    phonemes: [
      { symbol: "r", position: "initial", syllable: 1 },
      { symbol: "a", position: "medial", syllable: 1 },
      { symbol: "n", position: "medial", syllable: 2 },
      { symbol: "a", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: [],
    phonologyReviewStatus: "reviewed",
  },
  noun_fragola_001: {
    syllabification: "fra-go-la",
    syllableCount: 3,
    phonemicTranscription: "/ˈfraɡola/",
    phonemes: [
      { symbol: "f", position: "initial", syllable: 1 },
      { symbol: "r", position: "medial", syllable: 1 },
      { symbol: "a", position: "medial", syllable: 1 },
      { symbol: "ɡ", position: "medial", syllable: 2 },
      { symbol: "o", position: "medial", syllable: 2 },
      { symbol: "l", position: "medial", syllable: 3 },
      { symbol: "a", position: "final", syllable: 3 },
    ],
    consonantClusters: [{ phonemes: ["f", "r"], position: "initial", syllable: 1 }],
    geminates: [],
    phonologyReviewStatus: "reviewed",
  },
  noun_gatto_001: {
    syllabification: "gat-to",
    syllableCount: 2,
    phonemicTranscription: "/ˈɡatto/",
    phonemes: [
      { symbol: "ɡ", position: "initial", syllable: 1 },
      { symbol: "a", position: "medial", syllable: 1 },
      { symbol: "t", position: "medial", syllable: 1 },
      { symbol: "t", position: "medial", syllable: 2 },
      { symbol: "o", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: ["t"],
    phonologyReviewStatus: "reviewed",
  },
  noun_pesce_001: {
    syllabification: "pe-sce",
    syllableCount: 2,
    phonemicTranscription: "/ˈpeʃʃe/",
    phonemes: [
      { symbol: "p", position: "initial", syllable: 1 },
      { symbol: "e", position: "medial", syllable: 1 },
      { symbol: "ʃ", position: "medial", syllable: 1 },
      { symbol: "ʃ", position: "medial", syllable: 2 },
      { symbol: "e", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: ["ʃ"],
    phonologyReviewStatus: "reviewed",
  },
  noun_coniglio_001: {
    syllabification: "co-ni-glio",
    syllableCount: 3,
    phonemicTranscription: "/koˈniʎʎo/",
    phonemes: [
      { symbol: "k", position: "initial", syllable: 1 },
      { symbol: "o", position: "medial", syllable: 1 },
      { symbol: "n", position: "medial", syllable: 2 },
      { symbol: "i", position: "medial", syllable: 2 },
      { symbol: "ʎ", position: "medial", syllable: 2 },
      { symbol: "ʎ", position: "medial", syllable: 3 },
      { symbol: "o", position: "final", syllable: 3 },
    ],
    consonantClusters: [],
    geminates: ["ʎ"],
    phonologyReviewStatus: "reviewed",
  },
  noun_maglia_001: {
    syllabification: "ma-glia",
    syllableCount: 2,
    phonemicTranscription: "/ˈmaʎʎa/",
    phonemes: [
      { symbol: "m", position: "initial", syllable: 1 },
      { symbol: "a", position: "medial", syllable: 1 },
      { symbol: "ʎ", position: "medial", syllable: 1 },
      { symbol: "ʎ", position: "medial", syllable: 2 },
      { symbol: "a", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: ["ʎ"],
    phonologyReviewStatus: "reviewed",
  },
  noun_bagno_001: {
    syllabification: "ba-gno",
    syllableCount: 2,
    phonemicTranscription: "/ˈbaɲɲo/",
    phonemes: [
      { symbol: "b", position: "initial", syllable: 1 },
      { symbol: "a", position: "medial", syllable: 1 },
      { symbol: "ɲ", position: "medial", syllable: 1 },
      { symbol: "ɲ", position: "medial", syllable: 2 },
      { symbol: "o", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: ["ɲ"],
    phonologyReviewStatus: "reviewed",
  },
  noun_zebra_001: {
    syllabification: "ze-bra",
    syllableCount: 2,
    phonemicTranscription: "/ˈdzɛbra/",
    phonemes: [
      { symbol: "dz", position: "initial", syllable: 1 },
      { symbol: "ɛ", position: "medial", syllable: 1 },
      { symbol: "b", position: "medial", syllable: 2 },
      { symbol: "r", position: "medial", syllable: 2 },
      { symbol: "a", position: "final", syllable: 2 },
    ],
    consonantClusters: [{ phonemes: ["b", "r"], position: "medial", syllable: 2 }],
    geminates: [],
    pronunciationNotes: "Voce mantenuta in revisione editoriale per possibili variazioni di pronuncia nell'uso italiano.",
    phonologyReviewStatus: "needs_review",
  },
  noun_scimmia_001: {
    syllabification: "scim-mia",
    syllableCount: 2,
    phonemicTranscription: "/ˈʃimmja/",
    phonemes: [
      { symbol: "ʃ", position: "initial", syllable: 1 },
      { symbol: "i", position: "medial", syllable: 1 },
      { symbol: "m", position: "medial", syllable: 1 },
      { symbol: "m", position: "medial", syllable: 2 },
      { symbol: "j", position: "medial", syllable: 2 },
      { symbol: "a", position: "final", syllable: 2 },
    ],
    consonantClusters: [],
    geminates: ["m"],
    phonologyReviewStatus: "reviewed",
  },
  noun_tigre_001: {
    syllabification: "ti-gre",
    syllableCount: 2,
    phonemicTranscription: "/ˈtiɡre/",
    phonemes: [
      { symbol: "t", position: "initial", syllable: 1 },
      { symbol: "i", position: "medial", syllable: 1 },
      { symbol: "ɡ", position: "medial", syllable: 2 },
      { symbol: "r", position: "medial", syllable: 2 },
      { symbol: "e", position: "final", syllable: 2 },
    ],
    consonantClusters: [{ phonemes: ["ɡ", "r"], position: "medial", syllable: 2 }],
    geminates: [],
    phonologyReviewStatus: "reviewed",
  },
  noun_specchio_001: {
    syllabification: "spec-chio",
    syllableCount: 2,
    phonemicTranscription: "/ˈspɛkkjo/",
    phonemes: [
      { symbol: "s", position: "initial", syllable: 1 },
      { symbol: "p", position: "medial", syllable: 1 },
      { symbol: "ɛ", position: "medial", syllable: 1 },
      { symbol: "k", position: "medial", syllable: 1 },
      { symbol: "k", position: "medial", syllable: 2 },
      { symbol: "j", position: "medial", syllable: 2 },
      { symbol: "o", position: "final", syllable: 2 },
    ],
    consonantClusters: [{ phonemes: ["s", "p"], position: "initial", syllable: 1 }],
    geminates: ["k"],
    phonologyReviewStatus: "reviewed",
  },
  noun_ginocchio_001: {
    syllabification: "gi-noc-chio",
    syllableCount: 3,
    phonemicTranscription: "/dʒiˈnɔkkjo/",
    phonemes: [
      { symbol: "dʒ", position: "initial", syllable: 1 },
      { symbol: "i", position: "medial", syllable: 1 },
      { symbol: "n", position: "medial", syllable: 2 },
      { symbol: "ɔ", position: "medial", syllable: 2 },
      { symbol: "k", position: "medial", syllable: 2 },
      { symbol: "k", position: "medial", syllable: 3 },
      { symbol: "j", position: "medial", syllable: 3 },
      { symbol: "o", position: "final", syllable: 3 },
    ],
    consonantClusters: [],
    geminates: ["k"],
    phonologyReviewStatus: "reviewed",
  },
};
const promotedAssetPhonology = {
  "noun_cane_001": {
    "syllabification": "ca-ne",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkane/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_volpe_001": {
    "syllabification": "vol-pe",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈvolpe/",
    "phonemes": [
      {
        "symbol": "v",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "p",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_giraffa_001": {
    "syllabification": "gi-raf-fa",
    "syllableCount": 3,
    "phonemicTranscription": "/dʒiˈraffa/",
    "phonemes": [
      {
        "symbol": "dʒ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "f",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "f",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "f"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_pane_001": {
    "syllabification": "pa-ne",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpane/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_banana_001": {
    "syllabification": "ba-na-na",
    "syllableCount": 3,
    "phonemicTranscription": "/baˈnana/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_mela_001": {
    "syllabification": "me-la",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈmela/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_pera_001": {
    "syllabification": "pe-ra",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpera/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_gelato_001": {
    "syllabification": "ge-la-to",
    "syllableCount": 3,
    "phonemicTranscription": "/dʒeˈlato/",
    "phonemes": [
      {
        "symbol": "dʒ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_ciliegia_001": {
    "syllabification": "ci-lie-gia",
    "syllableCount": 3,
    "phonemicTranscription": "/tʃiˈljɛdʒa/",
    "phonemes": [
      {
        "symbol": "tʃ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_limone_001": {
    "syllabification": "li-mo-ne",
    "syllableCount": 3,
    "phonemicTranscription": "/liˈmone/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_torta_001": {
    "syllabification": "tor-ta",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈtorta/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_biscotto_001": {
    "syllabification": "bi-scot-to",
    "syllableCount": 3,
    "phonemicTranscription": "/biˈskɔtto/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɔ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "k"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_casa_001": {
    "syllabification": "ca-sa",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkasa/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed",
    "pronunciationNotes": "Sono possibili varianti regionali con /z/."
  },
  "noun_sedia_001": {
    "syllabification": "se-dia",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈsɛdja/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_tavolo_001": {
    "syllabification": "ta-vo-lo",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈtavolo/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "v",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_porta_001": {
    "syllabification": "por-ta",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpɔrta/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_finestra_001": {
    "syllabification": "fi-ne-stra",
    "syllableCount": 3,
    "phonemicTranscription": "/fiˈnɛstra/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "t",
          "r"
        ],
        "position": "medial",
        "syllable": 3
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_letto_001": {
    "syllabification": "let-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈlɛtto/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_bicchiere_001": {
    "syllabification": "bic-chie-re",
    "syllableCount": 3,
    "phonemicTranscription": "/bikˈkjɛre/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "k"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_cucchiaio_001": {
    "syllabification": "cuc-chia-io",
    "syllableCount": 3,
    "phonemicTranscription": "/kukˈkjajo/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "k"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_spazzola_001": {
    "syllabification": "spaz-zo-la",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈspattsola/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "p",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ts",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ts",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "p"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [
      "ts"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_libro_001": {
    "syllabification": "li-bro",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈlibro/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "b",
          "r"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_penna_001": {
    "syllabification": "pen-na",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpenna/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "n"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_matita_001": {
    "syllabification": "ma-ti-ta",
    "syllableCount": 3,
    "phonemicTranscription": "/maˈtita/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_quaderno_001": {
    "syllabification": "qua-der-no",
    "syllableCount": 3,
    "phonemicTranscription": "/kwaˈdɛrno/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "w",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_gomma_001": {
    "syllabification": "gom-ma",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈɡomma/",
    "phonemes": [
      {
        "symbol": "ɡ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "m"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_zaino_001": {
    "syllabification": "zai-no",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈdzaino/",
    "phonemes": [
      {
        "symbol": "dz",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_forbici_001": {
    "syllabification": "for-bi-ci",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈfɔrbitʃi/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_palla_001": {
    "syllabification": "pal-la",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpalla/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "l"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_bambola_001": {
    "syllabification": "bam-bo-la",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈbambola/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_dado_001": {
    "syllabification": "da-do",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈdado/",
    "phonemes": [
      {
        "symbol": "d",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_scarpa_001": {
    "syllabification": "scar-pa",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈskarpa/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "p",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "k"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_calza_001": {
    "syllabification": "cal-za",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkaltsa/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ts",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_cappello_001": {
    "syllabification": "cap-pel-lo",
    "syllableCount": 3,
    "phonemicTranscription": "/kapˈpɛllo/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "p",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "p",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "p",
      "l"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_mano_001": {
    "syllabification": "ma-no",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈmano/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_piede_001": {
    "syllabification": "pie-de",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpjɛde/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_bocca_001": {
    "syllabification": "boc-ca",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈbokka/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "k"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_naso_001": {
    "syllabification": "na-so",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈnaso/",
    "phonemes": [
      {
        "symbol": "n",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed",
    "pronunciationNotes": "Sono possibili varianti regionali con /z/."
  },
  "noun_braccio_001": {
    "syllabification": "brac-cio",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈbrattʃo/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "b",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [
      "tʃ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_auto_001": {
    "syllabification": "au-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈauto/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_treno_001": {
    "syllabification": "tre-no",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈtrɛno/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "t",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_barca_001": {
    "syllabification": "bar-ca",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈbarka/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_bici_001": {
    "syllabification": "bi-ci",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈbitʃi/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_camion_001": {
    "syllabification": "ca-mion",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkamjon/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_moto_001": {
    "syllabification": "mo-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈmɔto/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_fiore_001": {
    "syllabification": "fio-re",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈfjore/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_albero_001": {
    "syllabification": "al-be-ro",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈalbero/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_stella_001": {
    "syllabification": "stel-la",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈstella/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "t"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [
      "l"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_foglia_001": {
    "syllabification": "fo-glia",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈfɔʎʎa/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "ʎ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_chiave_001": {
    "syllabification": "chia-ve",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkjave/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "v",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_telefono_001": {
    "syllabification": "te-le-fo-no",
    "syllableCount": 4,
    "phonemicTranscription": "/teˈlɛfono/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "f",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_orologio_001": {
    "syllabification": "o-ro-lo-gio",
    "syllableCount": 4,
    "phonemicTranscription": "/oroˈlɔdʒo/",
    "phonemes": [
      {
        "symbol": "o",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "ɔ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_piatto_001": {
    "syllabification": "piat-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpjatto/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_bottiglia_001": {
    "syllabification": "bot-ti-glia",
    "syllableCount": 3,
    "phonemicTranscription": "/botˈtiʎʎa/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "t",
      "ʎ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_scatola_001": {
    "syllabification": "sca-to-la",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈskatola/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "k"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_regalo_001": {
    "syllabification": "re-ga-lo",
    "syllableCount": 3,
    "phonemicTranscription": "/reˈɡalo/",
    "phonemes": [
      {
        "symbol": "r",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɡ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_ombrello_001": {
    "syllabification": "om-brel-lo",
    "syllableCount": 3,
    "phonemicTranscription": "/omˈbrɛllo/",
    "phonemes": [
      {
        "symbol": "o",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "m",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "b",
          "r"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [
      "l"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "noun_candela_001": {
    "syllabification": "can-de-la",
    "syllableCount": 3,
    "phonemicTranscription": "/kanˈdela/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_mangiare_001": {
    "syllabification": "man-gia-re",
    "syllableCount": 3,
    "phonemicTranscription": "/manˈdʒare/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_bere_001": {
    "syllabification": "be-re",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈbere/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_dormire_001": {
    "syllabification": "dor-mi-re",
    "syllableCount": 3,
    "phonemicTranscription": "/dorˈmire/",
    "phonemes": [
      {
        "symbol": "d",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_correre_001": {
    "syllabification": "cor-re-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈkorrere/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "r"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_saltare_001": {
    "syllabification": "sal-ta-re",
    "syllableCount": 3,
    "phonemicTranscription": "/salˈtare/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_camminare_001": {
    "syllabification": "cam-mi-na-re",
    "syllableCount": 4,
    "phonemicTranscription": "/kammiˈnare/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "m",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "m"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_leggere_001": {
    "syllabification": "leg-ge-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈlɛddʒere/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "dʒ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_scrivere_001": {
    "syllabification": "scri-ve-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈskrivere/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "v",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "k",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_parlare_001": {
    "syllabification": "par-la-re",
    "syllableCount": 3,
    "phonemicTranscription": "/parˈlare/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_ascoltare_001": {
    "syllabification": "a-scol-ta-re",
    "syllableCount": 4,
    "phonemicTranscription": "/askolˈtare/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "k"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_aprire_001": {
    "syllabification": "a-pri-re",
    "syllableCount": 3,
    "phonemicTranscription": "/aˈprire/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "p",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "p",
          "r"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_chiudere_001": {
    "syllabification": "chiu-de-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈkjudere/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_prendere_001": {
    "syllabification": "pren-de-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈprɛndere/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "p",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_dare_001": {
    "syllabification": "da-re",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈdare/",
    "phonemes": [
      {
        "symbol": "d",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_mettere_001": {
    "syllabification": "met-te-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈmettere/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_togliere_001": {
    "syllabification": "to-glie-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈtɔʎʎere/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "ʎ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_lavare_001": {
    "syllabification": "la-va-re",
    "syllableCount": 3,
    "phonemicTranscription": "/laˈvare/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "v",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_pettinare_001": {
    "syllabification": "pet-ti-na-re",
    "syllableCount": 4,
    "phonemicTranscription": "/pettiˈnare/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_vestirsi_001": {
    "syllabification": "ve-stir-si",
    "syllableCount": 3,
    "phonemicTranscription": "/veˈstirsi/",
    "phonemes": [
      {
        "symbol": "v",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "t"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_sedersi_001": {
    "syllabification": "se-der-si",
    "syllableCount": 3,
    "phonemicTranscription": "/seˈdersi/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_ridere_001": {
    "syllabification": "ri-de-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈridere/",
    "phonemes": [
      {
        "symbol": "r",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_piangere_001": {
    "syllabification": "pian-ge-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈpjandʒere/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_soffiare_001": {
    "syllabification": "sof-fia-re",
    "syllableCount": 3,
    "phonemicTranscription": "/sofˈfjare/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "f",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "f",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "j",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "f"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_tagliare_001": {
    "syllabification": "ta-glia-re",
    "syllableCount": 3,
    "phonemicTranscription": "/taʎˈʎare/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʎ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "ʎ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_incollare_001": {
    "syllabification": "in-col-la-re",
    "syllableCount": 4,
    "phonemicTranscription": "/inkolˈlare/",
    "phonemes": [
      {
        "symbol": "i",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 4,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 4,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "l"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_lanciare_001": {
    "syllabification": "lan-cia-re",
    "syllableCount": 3,
    "phonemicTranscription": "/lanˈtʃare/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_tirare_001": {
    "syllabification": "ti-ra-re",
    "syllableCount": 3,
    "phonemicTranscription": "/tiˈrare/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_spingere_001": {
    "syllabification": "spin-ge-re",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈspindʒere/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "p",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "dʒ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "p"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_cercare_001": {
    "syllabification": "cer-ca-re",
    "syllableCount": 3,
    "phonemicTranscription": "/tʃerˈkare/",
    "phonemes": [
      {
        "symbol": "tʃ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "verb_trovare_001": {
    "syllabification": "tro-va-re",
    "syllableCount": 3,
    "phonemicTranscription": "/troˈvare/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "v",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "t",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_grande_001": {
    "syllabification": "gran-de",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈɡrande/",
    "phonemes": [
      {
        "symbol": "ɡ",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "ɡ",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_piccolo_001": {
    "syllabification": "pic-co-lo",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈpikkolo/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "k"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_lungo_001": {
    "syllabification": "lun-go",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈlunɡo/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɡ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_corto_001": {
    "syllabification": "cor-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkorto/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "o",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_pieno_001": {
    "syllabification": "pie-no",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈpjɛno/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_vuoto_001": {
    "syllabification": "vuo-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈvwɔto/",
    "phonemes": [
      {
        "symbol": "v",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "w",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_aperto_001": {
    "syllabification": "a-per-to",
    "syllableCount": 3,
    "phonemicTranscription": "/aˈpɛrto/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "p",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "ɛ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_chiuso_001": {
    "syllabification": "chiu-so",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkjuso/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "j",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed",
    "pronunciationNotes": "Sono possibili varianti regionali con /z/."
  },
  "concept_sporco_001": {
    "syllabification": "spor-co",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈspɔrko/",
    "phonemes": [
      {
        "symbol": "s",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "p",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "k",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "s",
          "p"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_pulito_001": {
    "syllabification": "pu-li-to",
    "syllableCount": 3,
    "phonemicTranscription": "/puˈlito/",
    "phonemes": [
      {
        "symbol": "p",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_bagnato_001": {
    "syllabification": "ba-gna-to",
    "syllableCount": 3,
    "phonemicTranscription": "/baɲˈɲato/",
    "phonemes": [
      {
        "symbol": "b",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɲ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ɲ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "a",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "ɲ"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_asciutto_001": {
    "syllabification": "a-sciut-to",
    "syllableCount": 3,
    "phonemicTranscription": "/aʃˈʃutto/",
    "phonemes": [
      {
        "symbol": "a",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ʃ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "ʃ",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "u",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [
      "ʃ",
      "t"
    ],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_felice_001": {
    "syllabification": "fe-li-ce",
    "syllableCount": 3,
    "phonemicTranscription": "/feˈlitʃe/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_triste_001": {
    "syllabification": "tri-ste",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈtriste/",
    "phonemes": [
      {
        "symbol": "t",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "s",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "t",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      },
      {
        "phonemes": [
          "s",
          "t"
        ],
        "position": "medial",
        "syllable": 2
      }
    ],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_veloce_001": {
    "syllabification": "ve-lo-ce",
    "syllableCount": 3,
    "phonemicTranscription": "/veˈlotʃe/",
    "phonemes": [
      {
        "symbol": "v",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "tʃ",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_lento_001": {
    "syllabification": "len-to",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈlɛnto/",
    "phonemes": [
      {
        "symbol": "l",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɛ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "n",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "t",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_duro_001": {
    "syllabification": "du-ro",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈduro/",
    "phonemes": [
      {
        "symbol": "d",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "u",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_morbido_001": {
    "syllabification": "mor-bi-do",
    "syllableCount": 3,
    "phonemicTranscription": "/ˈmɔrbido/",
    "phonemes": [
      {
        "symbol": "m",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "ɔ",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "b",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "i",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 3,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 3,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_caldo_001": {
    "syllabification": "cal-do",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈkaldo/",
    "phonemes": [
      {
        "symbol": "k",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "a",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "l",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [],
    "geminates": [],
    "phonologyReviewStatus": "reviewed"
  },
  "concept_freddo_001": {
    "syllabification": "fred-do",
    "syllableCount": 2,
    "phonemicTranscription": "/ˈfreddo/",
    "phonemes": [
      {
        "symbol": "f",
        "syllable": 1,
        "position": "initial"
      },
      {
        "symbol": "r",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "e",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 1,
        "position": "medial"
      },
      {
        "symbol": "d",
        "syllable": 2,
        "position": "medial"
      },
      {
        "symbol": "o",
        "syllable": 2,
        "position": "final"
      }
    ],
    "consonantClusters": [
      {
        "phonemes": [
          "f",
          "r"
        ],
        "position": "initial",
        "syllable": 1
      }
    ],
    "geminates": [
      "d"
    ],
    "phonologyReviewStatus": "reviewed"
  }
} satisfies Partial<Record<string, AssetPhonologyMetadata>>;

export const armoniaAssetPhonology: Partial<Record<string, AssetPhonologyMetadata>> = {
  ...reviewedAssetPhonologySample,
  ...promotedAssetPhonology,
};
