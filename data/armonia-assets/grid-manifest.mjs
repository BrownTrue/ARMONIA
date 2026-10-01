export const ASSET_GRID_MANIFEST = [
  ["noun_cane_001.webp", "noun_gatto_001.webp", "noun_rana_001.webp", "noun_pesce_001.webp", "noun_zebra_001.webp", "noun_volpe_001.webp", "noun_tigre_001.webp", "noun_scimmia_001.webp"],
  ["noun_giraffa_001.webp", "noun_coniglio_001.webp", "noun_pane_001.webp", "noun_banana_001.webp", "noun_mela_001.webp", "noun_pera_001.webp", "noun_fragola_001.webp", "noun_gelato_001.webp"],
  ["noun_ciliegia_001.webp", "noun_limone_001.webp", "noun_torta_001.webp", "noun_biscotto_001.webp", "noun_casa_001.webp", "noun_sedia_001.webp", "noun_tavolo_001.webp", "noun_porta_001.webp"],
  ["noun_finestra_001.webp", "noun_letto_001.webp", "noun_bicchiere_001.webp", "noun_cucchiaio_001.webp", "noun_spazzola_001.webp", "noun_libro_001.webp", "noun_penna_001.webp", "noun_matita_001.webp"],
  ["noun_quaderno_001.webp", "noun_gomma_001.webp", "noun_zaino_001.webp", "noun_forbici_001.webp", "noun_palla_001.webp", "noun_bambola_001.webp", "noun_dado_001.webp", "noun_scarpa_001.webp"],
  ["noun_calza_001.webp", "noun_maglia_001.webp", "noun_cappello_001.webp", "noun_mano_001.webp", "noun_piede_001.webp", "noun_bocca_001.webp", "noun_naso_001.webp", "noun_braccio_001.webp"],
  ["noun_ginocchio_001.webp", "noun_auto_001.webp", "noun_treno_001.webp", "noun_barca_001.webp", "noun_bici_001.webp", "noun_camion_001.webp", "noun_moto_001.webp", "noun_fiore_001.webp"],
  ["noun_albero_001.webp", "noun_stella_001.webp", "noun_foglia_001.webp", "noun_chiave_001.webp", "noun_telefono_001.webp", "noun_orologio_001.webp", "noun_piatto_001.webp", "noun_bottiglia_001.webp"],
  ["noun_scatola_001.webp", "noun_regalo_001.webp", "noun_ombrello_001.webp", "noun_specchio_001.webp", "noun_candela_001.webp", "verb_mangiare_001.webp", "verb_bere_001.webp", "verb_dormire_001.webp"],
  ["verb_correre_001.webp", "verb_saltare_001.webp", "verb_camminare_001.webp", "verb_leggere_001.webp", "verb_scrivere_001.webp", "verb_parlare_001.webp", "verb_ascoltare_001.webp", "verb_aprire_001.webp"],
  ["verb_chiudere_001.webp", "verb_prendere_001.webp", "verb_dare_001.webp", "verb_mettere_001.webp", "verb_togliere_001.webp", "verb_lavare_001.webp", "verb_pettinare_001.webp", "verb_vestirsi_001.webp"],
  ["verb_sedersi_001.webp", "verb_ridere_001.webp", "verb_piangere_001.webp", "verb_soffiare_001.webp", "verb_tagliare_001.webp", "verb_incollare_001.webp", "verb_lanciare_001.webp", "verb_tirare_001.webp"],
  ["noun_bagno_001.webp", "verb_spingere_001.webp", "verb_cercare_001.webp", "verb_trovare_001.webp", "concept_grande_001.webp", "concept_piccolo_001.webp", "concept_lungo_001.webp", "concept_corto_001.webp"],
  ["concept_pieno_001.webp", "concept_vuoto_001.webp", "concept_aperto_001.webp", "concept_chiuso_001.webp", "concept_sporco_001.webp", "concept_pulito_001.webp", "concept_bagnato_001.webp", "concept_asciutto_001.webp"],
  ["concept_felice_001.webp", "concept_triste_001.webp", "concept_veloce_001.webp", "concept_lento_001.webp", "concept_duro_001.webp", "concept_morbido_001.webp", "concept_caldo_001.webp", "concept_freddo_001.webp"],
].map((files, index) => ({ batch: index + 1, input: `batch-${String(index + 1).padStart(2, "0")}.png`, files }));

export const EXPECTED_ASSET_GRID_OUTPUTS = 120;
