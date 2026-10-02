// ARMONIA — Strumenti clinici V1
// Consolidamento editoriale/scientifico-legale dei due report forniti.
// Stato verificato: 2026-10-02
// Regola: presenza nel catalogo ≠ autorizzazione all'integrazione nativa.

export const clinicalToolsV1 = [
  {
    "id": "pvb-it",
    "name": "Primo Vocabolario del Bambino",
    "acronym": "PVB",
    "version": "edizione italiana corrente / famiglia MB-CDI",
    "clinicalAreas": [
      "linguaggio_precoce",
      "lessico",
      "sviluppo_comunicativo"
    ],
    "toolType": "caregiver_report",
    "shortDescription": "Questionario genitoriale italiano per lo sviluppo comunicativo e lessicale precoce, appartenente alla famiglia MacArthur-Bates CDI.",
    "population": {
      "label": "Bambini 8–36 mesi",
      "lifeStages": [
        "infant",
        "toddler"
      ],
      "ageMinMonths": 8,
      "ageMaxMonths": 36,
      "targetDescription": "Sviluppo comunicativo e lessicale precoce"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "Italian",
      "English",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "PVB / adattamento italiano MacArthur-Bates CDI; pagina CNR e manuale FrancoAngeli",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "caregiver_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "profile_and_norm_referenced_scores",
    "scoringAvailable": true,
    "publisher": "FrancoAngeli",
    "rightsHolder": null,
    "officialUrl": "https://istc.cnr.it/it/group/lacam/risorse/PVB_it",
    "officialPurchaseUrl": "https://www.francoangeli.it/Libro/9788891714336/Ltd",
    "rights": {
      "licenseType": "copyrighted / MB-CDI materials",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://mb-cdi.stanford.edu/copyright.html",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "official",
        "title": "CNR – PVB risorse italiane",
        "url": "https://istc.cnr.it/it/group/lacam/risorse/PVB_it"
      },
      {
        "kind": "publisher",
        "title": "FrancoAngeli – Primo Vocabolario del Bambino",
        "url": "https://www.francoangeli.it/Libro/9788891714336/Ltd"
      },
      {
        "kind": "rights",
        "title": "MacArthur-Bates CDI copyright",
        "url": "https://mb-cdi.stanford.edu/copyright.html"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "bvl-4-12",
    "name": "Batteria per la Valutazione del Linguaggio in Bambini dai 4 ai 12 anni",
    "acronym": "BVL 4-12",
    "version": "BVL_4-12",
    "clinicalAreas": [
      "linguaggio_evolutivo",
      "fonologia",
      "lessico",
      "morfosintassi",
      "pragmatica",
      "narrazione"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana multidominio per produzione, comprensione e ripetizione orale.",
    "population": {
      "label": "Bambini 4–12 anni",
      "lifeStages": [
        "preschool",
        "school_age"
      ],
      "ageMinMonths": 48,
      "ageMaxMonths": 144,
      "targetDescription": "Bambini italofoni; utilizzabile anche per descrivere competenza in italiano in bambini con altra L1"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – BVL_4-12",
      "year": null,
      "sampleSize": 1086,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "digital"
    ],
    "approximateDurationMinutes": 90,
    "resultType": "norm_referenced_profile",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/bvl-4-12",
    "officialPurchaseUrl": "https://www.giuntipsy.it/bvl-4-12",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – BVL_4-12",
        "url": "https://www.giuntipsy.it/bvl-4-12"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela e divulgazione dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "tcgb-2",
    "name": "Test di Comprensione Grammaticale per Bambini – Seconda Edizione",
    "acronym": "TCGB-2",
    "version": "2",
    "clinicalAreas": [
      "linguaggio_evolutivo",
      "morfosintassi",
      "comprensione"
    ],
    "toolType": "standardized_test",
    "shortDescription": "Test italiano di comprensione morfosintattica con punteggi normativi per fascia d'età.",
    "population": {
      "label": "Bambini 3;6–8;11 anni",
      "lifeStages": [
        "preschool",
        "school_age"
      ],
      "ageMinMonths": 42,
      "ageMaxMonths": 107,
      "targetDescription": "Bambini con sviluppo tipico o disordini dello sviluppo"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian_revised",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Validation of an Italian Grammatical Comprehension Test for Children: TCGB-2",
      "year": 2026,
      "sampleSize": 452,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": 25,
    "resultType": "norm_referenced_scores_and_error_profile",
    "scoringAvailable": true,
    "publisher": "Hogrefe",
    "rightsHolder": null,
    "officialUrl": "https://www.hogrefe.com/it/shop/test-di-comprensione-grammaticale-per-bambini-seconda-edizione.html",
    "officialPurchaseUrl": "https://www.hogrefe.com/it/shop/test-di-comprensione-grammaticale-per-bambini-seconda-edizione.html",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.hogrefe.com/it/termini-e-condizioni",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Hogrefe – TCGB-2",
        "url": "https://www.hogrefe.com/it/shop/test-di-comprensione-grammaticale-per-bambini-seconda-edizione.html"
      },
      {
        "kind": "scientific",
        "title": "PubMed – validation TCGB-2",
        "url": "https://pubmed.ncbi.nlm.nih.gov/41474678/"
      },
      {
        "kind": "rights",
        "title": "Hogrefe Italia – termini e condizioni",
        "url": "https://www.hogrefe.com/it/termini-e-condizioni"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "trog-2-it",
    "name": "Test for Reception of Grammar – Version 2",
    "acronym": "TROG-2",
    "version": "Italian adaptation",
    "clinicalAreas": [
      "linguaggio_evolutivo",
      "morfosintassi",
      "comprensione"
    ],
    "toolType": "standardized_test",
    "shortDescription": "Test di comprensione grammaticale con adattamento italiano ufficiale.",
    "population": {
      "label": "Popolazione dell'adattamento italiano: età non riportata nel dataset V1",
      "lifeStages": [
        "child",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Comprensione di contrasti grammaticali; limiti anagrafici italiani da verificare sul manuale"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Manuale dell'adattamento italiano TROG-2 / Giunti Psychometrics",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "norm_referenced_scores",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/catalogo/test/trog-2",
    "officialPurchaseUrl": "https://www.giuntipsy.it/catalogo/test/trog-2",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – TROG-2",
        "url": "https://www.giuntipsy.it/catalogo/test/trog-2"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela e divulgazione dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "apl-medea",
    "name": "Abilità Pragmatiche nel Linguaggio Medea",
    "acronym": "APL Medea",
    "version": null,
    "clinicalAreas": [
      "pragmatica",
      "linguaggio_evolutivo",
      "comunicazione_sociale"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana per la valutazione quantitativa delle abilità pragmatiche del linguaggio.",
    "population": {
      "label": "Bambini 5–14 anni",
      "lifeStages": [
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": 60,
      "ageMaxMonths": 168,
      "targetDescription": "Valutazione pragmatica in età evolutiva"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – APL Medea",
      "year": null,
      "sampleSize": 515,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "norm_referenced_profile",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": "IRCCS Eugenio Medea / autori: titolarità specifica da verificare",
    "officialUrl": "https://www.giuntipsy.it/apl-medea",
    "officialPurchaseUrl": "https://www.giuntipsy.it/apl-medea",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – APL Medea",
        "url": "https://www.giuntipsy.it/apl-medea"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela e divulgazione dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "ccc-2-it",
    "name": "Children’s Communication Checklist – Second Edition",
    "acronym": "CCC-2",
    "version": "Italian edition",
    "clinicalAreas": [
      "pragmatica",
      "comunicazione_sociale",
      "linguaggio_evolutivo"
    ],
    "toolType": "caregiver_or_informant_questionnaire",
    "shortDescription": "Checklist per problemi linguistici e comunicativi, con particolare sensibilità agli aspetti pragmatici.",
    "population": {
      "label": "Bambini e ragazzi 4–11 anni",
      "lifeStages": [
        "preschool",
        "school_age"
      ],
      "ageMinMonths": 48,
      "ageMaxMonths": 132,
      "targetDescription": "Bambini e ragazzi in grado di formulare frasi"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – CCC-2 Italian edition",
      "year": null,
      "sampleSize": 561,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper",
      "online"
    ],
    "approximateDurationMinutes": 10,
    "resultType": "scale_scores_and_composite_scores",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/ccc-2-children-communication-checklist-scala-problemi-comunicazione-bambini-ragazzi",
    "officialPurchaseUrl": "https://www.giuntipsy.it/ccc-2-children-communication-checklist-scala-problemi-comunicazione-bambini-ragazzi",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – CCC-2",
        "url": "https://www.giuntipsy.it/ccc-2-children-communication-checklist-scala-problemi-comunicazione-bambini-ragazzi"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela e divulgazione dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "fanzago-balasso-articolazione",
    "name": "Test di Valutazione dell’Articolazione",
    "acronym": null,
    "version": "riedizione 2021",
    "clinicalAreas": [
      "fonetica",
      "fonologia",
      "intelligibilita"
    ],
    "toolType": "speech_sound_assessment",
    "shortDescription": "Strumento italiano per l'inventario fonetico tramite denominazione e ripetizione.",
    "population": {
      "label": "Bambini; range anagrafico numerico non documentato nelle fonti V1",
      "lifeStages": [
        "child"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Valutazione dell'inventario fonetico e della stimolabilità"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": null,
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "individual",
      "picture_naming",
      "repetition"
    ],
    "approximateDurationMinutes": null,
    "resultType": "phonetic_inventory_and_error_profile",
    "scoringAvailable": true,
    "publisher": "Vittoria Editrice",
    "rightsHolder": null,
    "officialUrl": "https://fli.it/2022/01/27/test-di-valutazione-dellarticolazione-riedizione/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted publication/test; no open software license found",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "professional_source",
        "title": "FLI – riedizione del Test di Valutazione dell’Articolazione",
        "url": "https://fli.it/2022/01/27/test-di-valutazione-dellarticolazione-riedizione/"
      },
      {
        "kind": "bibliographic",
        "title": "Vittoria Editrice edition – bibliographic listing",
        "url": "https://www.libreriauniversitaria.it/test-valutazione-articolazione-manuale-qr/libro/9788898719259"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "tfpi",
    "name": "Test Fonetico per la Prima Infanzia",
    "acronym": "TFPI",
    "version": "2025 validation study",
    "clinicalAreas": [
      "fonetica",
      "fonologia",
      "linguaggio_precoce"
    ],
    "toolType": "speech_sound_assessment",
    "shortDescription": "Nuovo strumento italiano per lo sviluppo fonetico nella prima infanzia; lo studio 2025 valuta soprattutto la prova di denominazione.",
    "population": {
      "label": "Bambini 18–47 mesi; campione di validazione 24–47 mesi",
      "lifeStages": [
        "toddler",
        "preschool"
      ],
      "ageMinMonths": 18,
      "ageMaxMonths": 47,
      "targetDescription": "Sviluppo fonetico di bambini italofoni"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": "Zmarich et al., Test Fonetico per la Prima Infanzia, Languages",
      "year": 2025,
      "sampleSize": 52,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "individual",
      "picture_naming",
      "repetition"
    ],
    "approximateDurationMinutes": null,
    "resultType": "phonetic_profile_and_pcc_related_metrics",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://www.mdpi.com/2226-471X/10/1/15",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "instrument license not separately verified; article is open access",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": "https://www.mdpi.com/2226-471X/10/1/15",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific_primary",
        "title": "MDPI – TFPI validation study",
        "url": "https://www.mdpi.com/2226-471X/10/1/15"
      },
      {
        "kind": "institutional",
        "title": "University of Padua repository – TFPI",
        "url": "https://www.research.unipd.it/handle/11577/3553037"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "ics-it",
    "name": "Intelligibility in Context Scale",
    "acronym": "ICS",
    "version": "Italian translation / ICS-I",
    "clinicalAreas": [
      "intelligibilita",
      "fonologia",
      "partecipazione_comunicativa"
    ],
    "toolType": "caregiver_rating_scale",
    "shortDescription": "Scala breve di intelligibilità del parlato valutata da un caregiver rispetto a diversi interlocutori.",
    "population": {
      "label": "Dati italiani verificati 3;0–5;11 anni",
      "lifeStages": [
        "preschool"
      ],
      "ageMinMonths": 36,
      "ageMaxMonths": 71,
      "targetDescription": "Bambini italofoni; caregiver report"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian validation/normative study of the Intelligibility in Context Scale",
      "year": 2020,
      "sampleSize": 364,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "caregiver_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "total_score",
    "scoringAvailable": true,
    "publisher": "Charles Sturt University",
    "rightsHolder": null,
    "officialUrl": "https://www.csu.edu.au/research/multilingual-speech/speech-assessments/ics",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "CC BY-NC-ND (distributed form; non-commercial/no-derivatives)",
      "commercialUse": "forbidden",
      "redistribution": "allowed_noncommercial_unmodified",
      "modification": "forbidden",
      "softwareIntegration": "forbidden",
      "licenseUrl": "https://www.csu.edu.au/research/multilingual-speech/speech-assessments/ics",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "restricted",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "official",
        "title": "Charles Sturt University – ICS translations",
        "url": "https://www.csu.edu.au/research/multilingual-speech/speech-assessments/ics"
      },
      {
        "kind": "scientific",
        "title": "Italian ICS validation",
        "url": "https://www.sciencedirect.com/science/article/abs/pii/S0165587620300677"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "focus-i",
    "name": "Focus on the Outcomes of Communication Under Six – Italian",
    "acronym": "FOCUS-I",
    "version": "Italian adaptation",
    "clinicalAreas": [
      "partecipazione_comunicativa",
      "linguaggio_evolutivo",
      "outcome"
    ],
    "toolType": "outcome_measure",
    "shortDescription": "Misura di outcome della partecipazione comunicativa in bambini in età prescolare.",
    "population": {
      "label": "Bambini 36–71 mesi nello studio italiano",
      "lifeStages": [
        "preschool"
      ],
      "ageMinMonths": 36,
      "ageMaxMonths": 71,
      "targetDescription": "Bambini italofoni in età prescolare"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Assessment of children's communicative participation: validity and reliability of FOCUS-I",
      "year": 2020,
      "sampleSize": 364,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "caregiver_report",
      "clinician_report"
    ],
    "approximateDurationMinutes": null,
    "resultType": "total_and_subscale_scores",
    "scoringAvailable": true,
    "publisher": "Holland Bloorview / CanChild",
    "rightsHolder": "FOCUS authors / Holland Bloorview",
    "officialUrl": "https://hollandbloorview.ca/research-education/bloorview-research-institute/outcome-measures/focus/focus-outcome-measure-and",
    "officialPurchaseUrl": "https://hollandbloorview.ca/research-education/bloorview-research-institute/outcome-measures/focus/focus-outcome-measure-and",
    "rights": {
      "licenseType": "copyrighted outcome measure; purchase/use conditions apply",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "forbidden_without_permission",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://hollandbloorview.ca/research-education/bloorview-research-institute/outcome-measures/focus/focus-outcome-measure-and",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official",
        "title": "Holland Bloorview – FOCUS outcome measure and manuals",
        "url": "https://hollandbloorview.ca/research-education/bloorview-research-institute/outcome-measures/focus/focus-outcome-measure-and"
      },
      {
        "kind": "scientific",
        "title": "FOCUS-I validation",
        "url": "https://www.tandfonline.com/doi/full/10.1080/2050571X.2020.1738037"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "mchat-rf-it",
    "name": "Modified Checklist for Autism in Toddlers, Revised with Follow-Up",
    "acronym": "M-CHAT-R/F",
    "version": "official Italian translation",
    "clinicalAreas": [
      "screening_sviluppo",
      "comunicazione_sociale",
      "linguaggio_precoce"
    ],
    "toolType": "screening_questionnaire",
    "shortDescription": "Screening caregiver per rischio di autismo; rilevante come strumento esterno nel percorso evolutivo, non come test logopedico diagnostico.",
    "population": {
      "label": "Bambini 16–30 mesi",
      "lifeStages": [
        "toddler"
      ],
      "ageMinMonths": 16,
      "ageMaxMonths": 30,
      "targetDescription": "Screening del rischio di autismo in toddler"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_translation",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": "Official Italian translation; specific Italian psychometric validation of R/F not confirmed in the two source reports",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "caregiver_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "risk_screen_result",
    "scoringAvailable": true,
    "publisher": "M-CHAT authors",
    "rightsHolder": "M-CHAT authors",
    "officialUrl": "https://www.mchatscreen.com/mchat-rf/translations/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted; license agreement required for software/EHR/telehealth",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "forbidden_without_permission",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.mchatscreen.com/mchat-rf/",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official",
        "title": "M-CHAT-R/F official translations",
        "url": "https://www.mchatscreen.com/mchat-rf/translations/"
      },
      {
        "kind": "rights",
        "title": "M-CHAT-R/F licensing conditions",
        "url": "https://www.mchatscreen.com/mchat-rf/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "mt-3-clinica",
    "name": "Prove MT-3 Clinica",
    "acronym": "MT-3 Clinica",
    "version": "current clinical edition",
    "clinicalAreas": [
      "lettura",
      "comprensione_del_testo"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana per lettura e comprensione nella scolarità, con estensione Advanced.",
    "population": {
      "label": "6–14 anni; Advanced 14–16 anni",
      "lifeStages": [
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": 72,
      "ageMaxMonths": 192,
      "targetDescription": "Valutazione clinica di lettura/comprensione"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – Prove MT-3 Clinica",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "norm_referenced_scores",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/catalogo/test/prove-mt-3-clinica-cornoldi",
    "officialPurchaseUrl": "https://www.giuntipsy.it/catalogo/test/prove-mt-3-clinica-cornoldi",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – MT-3 Clinica",
        "url": "https://www.giuntipsy.it/catalogo/test/prove-mt-3-clinica-cornoldi"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "dde-2",
    "name": "Batteria per la Valutazione della Dislessia e della Disortografia Evolutiva – 2",
    "acronym": "DDE-2",
    "version": "2",
    "clinicalAreas": [
      "lettura",
      "scrittura",
      "ortografia"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana per abilità di lettura e scrittura in età scolare.",
    "population": {
      "label": "Dalla 2ª primaria alla 3ª secondaria di I grado; età in mesi non documentata nella fonte V1",
      "lifeStages": [
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Valutazione di lettura e ortografia"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – DDE-2",
      "year": null,
      "sampleSize": 1550,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "norm_referenced_scores",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/dde-2",
    "officialPurchaseUrl": "https://www.giuntipsy.it/dde-2",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – DDE-2",
        "url": "https://www.giuntipsy.it/dde-2"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "bvsco-3",
    "name": "Batteria per la Valutazione della Scrittura e della Competenza Ortografica – 3",
    "acronym": "BVSCO-3",
    "version": "3",
    "clinicalAreas": [
      "scrittura",
      "ortografia",
      "produzione_del_testo"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana aggiornata per processi di scrittura, ortografia e produzione testuale.",
    "population": {
      "label": "Bambini e ragazzi 6–14 anni",
      "lifeStages": [
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": 72,
      "ageMaxMonths": 168,
      "targetDescription": "Valutazione della scrittura e competenza ortografica"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Giunti Psychometrics – BVSCO-3",
      "year": 2025,
      "sampleSize": 3703,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "group",
      "paper"
    ],
    "approximateDurationMinutes": 60,
    "resultType": "norm_referenced_scores",
    "scoringAvailable": true,
    "publisher": "Giunti Psychometrics",
    "rightsHolder": null,
    "officialUrl": "https://www.giuntipsy.it/catalogo/test/bvsco-3-batteria-per-la-valutazione-della-scrittura-e-delle-competenza-ortografica",
    "officialPurchaseUrl": "https://www.giuntipsy.it/catalogo/test/bvsco-3-batteria-per-la-valutazione-della-scrittura-e-delle-competenza-ortografica",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Giunti Psychometrics – BVSCO-3",
        "url": "https://www.giuntipsy.it/catalogo/test/bvsco-3-batteria-per-la-valutazione-della-scrittura-e-delle-competenza-ortografica"
      },
      {
        "kind": "rights",
        "title": "Giunti – tutela dei materiali testistici",
        "url": "https://giuntipsy.zendesk.com/hc/it/articles/360016114879-Posso-divulgare-test-parti-di-essi-anche-compilate-o-esempi-a-persone-prive-di-qualifica-professionale-specifica"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "kiddycat-it",
    "name": "Communication Attitude Test for Preschool and Kindergarten Children Who Stutter – Italian",
    "acronym": "KiddyCAT",
    "version": "Italian adaptation",
    "clinicalAreas": [
      "fluenza",
      "balbuzie"
    ],
    "toolType": "self_report_or_interview_scale",
    "shortDescription": "Misura dell'attitudine comunicativa in bambini piccoli che balbettano.",
    "population": {
      "label": "Bambini 3–6 anni",
      "lifeStages": [
        "preschool"
      ],
      "ageMinMonths": 36,
      "ageMaxMonths": 72,
      "targetDescription": "Bambini in età prescolare con o senza balbuzie"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "standardized_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Hogrefe – KiddyCAT Italian edition",
      "year": 2022,
      "sampleSize": 173,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": 8,
    "resultType": "standardized_score",
    "scoringAvailable": true,
    "publisher": "Hogrefe",
    "rightsHolder": null,
    "officialUrl": "https://www.hogrefe.com/it/shop/communication-attitude-test-for-preschool-and-kindergarten-children-who-stutter.html",
    "officialPurchaseUrl": "https://www.hogrefe.com/it/shop/communication-attitude-test-for-preschool-and-kindergarten-children-who-stutter.html",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.hogrefe.com/it/termini-e-condizioni",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Hogrefe – KiddyCAT",
        "url": "https://www.hogrefe.com/it/shop/communication-attitude-test-for-preschool-and-kindergarten-children-who-stutter.html"
      },
      {
        "kind": "rights",
        "title": "Hogrefe Italia – termini e condizioni",
        "url": "https://www.hogrefe.com/it/termini-e-condizioni"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "bab-it",
    "name": "Behavior Assessment Battery – Italian",
    "acronym": "BAB",
    "version": "Italian edition",
    "clinicalAreas": [
      "fluenza",
      "balbuzie",
      "impatto_psicosociale"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria cognitivo-comportamentale ed emotiva per l'assessment della balbuzie.",
    "population": {
      "label": "Bambini e ragazzi 6–16 anni",
      "lifeStages": [
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": 72,
      "ageMaxMonths": 192,
      "targetDescription": "Balbuzie in età evolutiva"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "standardized_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Erickson – BAB Italian edition",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "scale_scores_and_profile",
    "scoringAvailable": true,
    "publisher": "Erickson",
    "rightsHolder": null,
    "officialUrl": "https://www.erickson.it/it/bab-batteria-per-l-assessment-cognitivocomportamentale-ed-emotivo-della-balbuzie",
    "officialPurchaseUrl": "https://www.erickson.it/it/bab-batteria-per-l-assessment-cognitivocomportamentale-ed-emotivo-della-balbuzie",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://estudy.erickson.it/condizioni-duso",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Erickson – BAB",
        "url": "https://www.erickson.it/it/bab-batteria-per-l-assessment-cognitivocomportamentale-ed-emotivo-della-balbuzie"
      },
      {
        "kind": "rights",
        "title": "Erickson – condizioni d'uso",
        "url": "https://estudy.erickson.it/condizioni-duso"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "oases-it",
    "name": "Overall Assessment of the Speaker’s Experience of Stuttering – Italian",
    "acronym": "OASES",
    "version": "OASES-S / OASES-T / OASES-A Italian",
    "clinicalAreas": [
      "fluenza",
      "balbuzie",
      "partecipazione",
      "qualita_di_vita"
    ],
    "toolType": "patient_reported_outcome",
    "shortDescription": "Famiglia di strumenti per l'esperienza della balbuzie in età scolare, adolescenza e adulto.",
    "population": {
      "label": "7–12 / 13–17 / 18+ anni",
      "lifeStages": [
        "school_age",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": 84,
      "ageMaxMonths": null,
      "targetDescription": "Tre versioni per età"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_translation",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": "Italian forms commercially available; full Italian validation not confirmed in the source reports",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "self_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "impact_score_and_sections",
    "scoringAvailable": true,
    "publisher": "Stuttering Therapy Resources",
    "rightsHolder": "Stuttering Therapy Resources / authors",
    "officialUrl": "https://stutteringtherapyresources.com/collections/oases-print-your-own/products/oases-italian-print-your-own",
    "officialPurchaseUrl": "https://stutteringtherapyresources.com/collections/oases-print-your-own/products/oases-italian-print-your-own",
    "rights": {
      "licenseType": "proprietary copyrighted forms; authorized-print license",
      "commercialUse": "permission_required",
      "redistribution": "forbidden_except_license",
      "modification": "forbidden",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://stutteringtherapyresources.com/collections/oases-print-your-own/products/oases-italian-print-your-own",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Stuttering Therapy Resources – OASES Italian",
        "url": "https://stutteringtherapyresources.com/collections/oases-print-your-own/products/oases-italian-print-your-own"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "vhi-it",
    "name": "Voice Handicap Index – Italian",
    "acronym": "VHI",
    "version": "VHI-30 Italian",
    "clinicalAreas": [
      "voce",
      "qualita_di_vita"
    ],
    "toolType": "patient_reported_outcome",
    "shortDescription": "Questionario di autopercezione dell'impatto funzionale, fisico ed emotivo dei problemi vocali.",
    "population": {
      "label": "Adulti; range anagrafico numerico non documentato nella fonte V1",
      "lifeStages": [
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disturbi di voce"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Validation of the Italian Voice Handicap Index",
      "year": 2010,
      "sampleSize": 259,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "self_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "total_and_domain_scores",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": "American Speech-Language-Hearing Association (copyright of original publication/form as documented)",
    "officialUrl": "https://pubmed.ncbi.nlm.nih.gov/20083383/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted instrument",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://fitbir.nih.gov/dictionary/publicData/dataStructureAction%21view.action?dataStructureName=VHI&publicArea=true&style.key=fitbir-style",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "scientific",
        "title": "PubMed – Italian VHI validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/20083383/"
      },
      {
        "kind": "rights",
        "title": "FITBIR – VHI copyright information",
        "url": "https://fitbir.nih.gov/dictionary/publicData/dataStructureAction%21view.action?dataStructureName=VHI&publicArea=true&style.key=fitbir-style"
      },
      {
        "kind": "original",
        "title": "ASHA – original VHI publication",
        "url": "https://pubs.asha.org/doi/abs/10.1044/1058-0360.0603.66"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "vhi-10-it",
    "name": "Voice Handicap Index-10 – Italian",
    "acronym": "VHI-10",
    "version": "Italian",
    "clinicalAreas": [
      "voce",
      "qualita_di_vita"
    ],
    "toolType": "patient_reported_outcome",
    "shortDescription": "Forma breve a 10 item del VHI, validata in italiano.",
    "population": {
      "label": "Adulti; range anagrafico numerico non documentato nella fonte V1",
      "lifeStages": [
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disfonia"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Validation of the Italian Voice Handicap Index-10",
      "year": 2014,
      "sampleSize": 492,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "self_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "total_score",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://pubmed.ncbi.nlm.nih.gov/24094800/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted derivative of VHI; no open software license identified",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://fitbir.nih.gov/dictionary/publicData/dataStructureAction%21view.action?dataStructureName=VHI&publicArea=true&style.key=fitbir-style",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "scientific",
        "title": "PubMed – Italian VHI-10 validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24094800/"
      },
      {
        "kind": "rights_context",
        "title": "FITBIR – VHI copyright information",
        "url": "https://fitbir.nih.gov/dictionary/publicData/dataStructureAction%21view.action?dataStructureName=VHI&publicArea=true&style.key=fitbir-style"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "cape-v-it",
    "name": "Consensus Auditory-Perceptual Evaluation of Voice – Italian",
    "acronym": "CAPE-V",
    "version": "Italian adaptation",
    "clinicalAreas": [
      "voce",
      "valutazione_percettiva"
    ],
    "toolType": "clinician_rating_protocol",
    "shortDescription": "Protocollo di valutazione uditivo-percettiva della voce; l'uso commerciale in software richiede licenza ASHA.",
    "population": {
      "label": "Popolazione clinica vocale; età numerica non fissata nelle fonti V1",
      "lifeStages": [
        "child",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Valutazione percettiva della voce"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian adaptation/validation of CAPE-V",
      "year": 2014,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "clinician_rating",
      "voice_tasks"
    ],
    "approximateDurationMinutes": null,
    "resultType": "severity_ratings",
    "scoringAvailable": true,
    "publisher": "ASHA",
    "rightsHolder": "American Speech-Language-Hearing Association",
    "officialUrl": "https://www.asha.org/form/cape-v/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "ASHA non-commercial license; separate commercial license required",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "forbidden_without_permission",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.asha.org/form/cape-v/",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_rights",
        "title": "ASHA – CAPE-V licensing",
        "url": "https://www.asha.org/form/cape-v/"
      },
      {
        "kind": "scientific",
        "title": "PubMed – Italian CAPE-V adaptation/validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24714558/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "eat-10-it",
    "name": "Eating Assessment Tool-10 – Italian",
    "acronym": "I-EAT-10",
    "version": "Italian validated version",
    "clinicalAreas": [
      "disfagia",
      "deglutizione",
      "screening"
    ],
    "toolType": "patient_reported_screening",
    "shortDescription": "Questionario breve di screening/autovalutazione dei sintomi di disfagia.",
    "population": {
      "label": "Adulti; range numerico non riportato nel record V1",
      "lifeStages": [
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Screening di disfagia"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian validation of EAT-10",
      "year": 2013,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "self_report",
      "paper"
    ],
    "approximateDurationMinutes": 2,
    "resultType": "total_score",
    "scoringAvailable": true,
    "publisher": "Mapi Research Trust (licensing/distribution)",
    "rightsHolder": "Société des Produits Nestlé S.A.",
    "officialUrl": "https://www.nestlenutrition-institute.org/resources/nutrition-tools/details/swallowing-assessment-tool",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted / trademarked; licensed via Mapi Research Trust",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "forbidden",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.nestlenutrition-institute.org/resources/nutrition-tools/details/swallowing-assessment-tool",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_rights",
        "title": "Nestlé Nutrition Institute – EAT-10 licensing",
        "url": "https://www.nestlenutrition-institute.org/resources/nutrition-tools/details/swallowing-assessment-tool"
      },
      {
        "kind": "scientific",
        "title": "PubMed – Italian EAT-10 validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24358633/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "swal-qol-it",
    "name": "Swallowing Quality of Life Questionnaire – Italian",
    "acronym": "I-SWAL-QOL",
    "version": "Italian",
    "clinicalAreas": [
      "disfagia",
      "qualita_di_vita"
    ],
    "toolType": "patient_reported_outcome",
    "shortDescription": "Questionario di qualità di vita correlata alla deglutizione, validato in italiano.",
    "population": {
      "label": "Adulti",
      "lifeStages": [
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disfagia e controlli"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian validation of SWAL-QOL",
      "year": 2016,
      "sampleSize": 292,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "self_report",
      "paper"
    ],
    "approximateDurationMinutes": 20,
    "resultType": "domain_and_total_scores",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://pubmed.ncbi.nlm.nih.gov/27444734/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyright/permissions not sufficiently resolved for SaaS in source review",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "scientific",
        "title": "PubMed – Italian SWAL-QOL validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/27444734/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "fois-it",
    "name": "Functional Oral Intake Scale – Italian",
    "acronym": "FOIS-It",
    "version": "Italian",
    "clinicalAreas": [
      "disfagia",
      "deglutizione",
      "alimentazione_orale"
    ],
    "toolType": "clinician_rating_scale",
    "shortDescription": "Scala clinica ordinale per il livello funzionale di assunzione orale.",
    "population": {
      "label": "Adulti; ePROVIDE indica sviluppo/uso adulto",
      "lifeStages": [
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disfagia, in particolare post-stroke"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Cross-Cultural Validation of the Italian Version of FOIS",
      "year": 2018,
      "sampleSize": 227,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "clinician_rating",
      "record_review"
    ],
    "approximateDurationMinutes": null,
    "resultType": "ordinal_global_score",
    "scoringAvailable": true,
    "publisher": "Mapi Research Trust (conditions-of-use registry)",
    "rightsHolder": "Original authors; exact copyright entry not stated by ePROVIDE",
    "officialUrl": "https://eprovide.mapi-trust.org/instruments/functional-oral-intake-scale",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "written permission / agreement; commercial fees may apply",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://eprovide.mapi-trust.org/instruments/functional-oral-intake-scale",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_conditions",
        "title": "ePROVIDE – FOIS conditions of use",
        "url": "https://eprovide.mapi-trust.org/instruments/functional-oral-intake-scale"
      },
      {
        "kind": "scientific",
        "title": "PubMed – Italian FOIS validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/30089299/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "pedi-eat-10-it",
    "name": "Pediatric Eating Assessment Tool-10 – Italian",
    "acronym": "I-PEDI-EAT-10",
    "version": "Italian",
    "clinicalAreas": [
      "feeding",
      "disfagia_pediatrica",
      "deglutizione"
    ],
    "toolType": "caregiver_report",
    "shortDescription": "Questionario caregiver per difficoltà di alimentazione/deglutizione in età pediatrica.",
    "population": {
      "label": "18 mesi–18 anni",
      "lifeStages": [
        "toddler",
        "preschool",
        "school_age",
        "adolescent"
      ],
      "ageMinMonths": 18,
      "ageMaxMonths": 216,
      "targetDescription": "Popolazione pediatrica con e senza problematiche di feeding/deglutizione"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian adaptation and validation of PEDI-EAT-10",
      "year": 2024,
      "sampleSize": 400,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "caregiver_report",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "total_score",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://onlinelibrary.wiley.com/doi/full/10.1111/1460-6984.12986",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "instrument rights for commercial software not clearly published in sources reviewed",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific",
        "title": "Wiley – Italian PEDI-EAT-10 validation",
        "url": "https://onlinelibrary.wiley.com/doi/full/10.1111/1460-6984.12986"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "iddsi-framework-it",
    "name": "International Dysphagia Diet Standardisation Initiative Framework – Italian",
    "acronym": "IDDSI",
    "version": "Framework 2.2 Italian",
    "clinicalAreas": [
      "disfagia",
      "feeding",
      "consistenze",
      "deglutizione"
    ],
    "toolType": "standard_framework",
    "shortDescription": "Framework internazionale per descrivere livelli di consistenza di alimenti e bevande nella gestione della disfagia.",
    "population": {
      "label": "Tutte le età",
      "lifeStages": [
        "infant",
        "toddler",
        "preschool",
        "school_age",
        "adolescent",
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Uso trasversale in disfagia/feeding"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": null,
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": null,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "clinical_framework",
      "reference"
    ],
    "approximateDurationMinutes": null,
    "resultType": "standardized_level_classification",
    "scoringAvailable": true,
    "publisher": "IDDSI",
    "rightsHolder": "IDDSI",
    "officialUrl": "https://www.iddsi.org/standards/framework",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "CC BY-SA 4.0 with IDDSI-specific restriction against derivatives beyond language translation",
      "commercialUse": "allowed_with_conditions",
      "redistribution": "allowed_with_conditions",
      "modification": "restricted_to_language_translation",
      "softwareIntegration": "allowed_with_conditions",
      "licenseUrl": "https://www.iddsi.org/standards/framework",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "open_verified",
    "partnershipStatus": "none",
    "suggestedIntegration": "native_integration_verified",
    "references": [
      {
        "kind": "official",
        "title": "IDDSI Framework",
        "url": "https://www.iddsi.org/standards/framework"
      },
      {
        "kind": "official_translation",
        "title": "IDDSI framework documents / translations",
        "url": "https://www.iddsi.org/standards/framework-plus-resources"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "qab-it",
    "name": "Test Rapido di Valutazione dell’Afasia / Italian Quick Aphasia Battery",
    "acronym": "QAB",
    "version": "Italian QAB 2026",
    "clinicalAreas": [
      "afasia",
      "linguaggio_adulto"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Adattamento italiano ufficiale della Quick Aphasia Battery, batteria breve multidimensionale per afasia acquisita.",
    "population": {
      "label": "Adulti con sospetta o nota afasia; età numerica non specificata nella fonte ufficiale V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Afasia acquisita"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian",
      "multiple"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_adaptation",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": "Test Rapido di Valutazione dell'Afasia – The Quick Aphasia Battery in Italian",
      "year": 2026,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": 15,
    "resultType": "overall_and_subtest_scores",
    "scoringAvailable": true,
    "publisher": "AphasiaLab",
    "rightsHolder": null,
    "officialUrl": "https://www.aphasialab.org/qab/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "Creative Commons Attribution (CC BY) per official QAB site",
      "commercialUse": "allowed",
      "redistribution": "allowed_with_attribution",
      "modification": "allowed_with_attribution",
      "softwareIntegration": "allowed_with_attribution",
      "licenseUrl": "https://www.aphasialab.org/qab/",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "integrated",
    "licenseStatus": "open_verified",
    "partnershipStatus": "none",
    "suggestedIntegration": "native_integration_verified",
    "references": [
      {
        "kind": "official",
        "title": "AphasiaLab – QAB, translations and license",
        "url": "https://www.aphasialab.org/qab/"
      },
      {
        "kind": "scientific_italian",
        "title": "Italian QAB adaptation, Aphasiology 2026",
        "url": "https://www.tandfonline.com/doi/full/10.1080/02687038.2026.2691164"
      },
      {
        "kind": "scientific_original",
        "title": "Original QAB study",
        "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0192773"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "art-aphasia-rapid-test",
    "name": "Aphasia Rapid Test",
    "acronym": "ART",
    "version": "original",
    "clinicalAreas": [
      "afasia",
      "stroke",
      "screening"
    ],
    "toolType": "bedside_screening",
    "shortDescription": "Screening bedside ultrarapido per quantificare la gravità dell'afasia nella fase acuta dello stroke.",
    "population": {
      "label": "Adulti con stroke acuto; età numerica non specificata nella fonte V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Afasia acuta post-stroke"
    },
    "originalLanguage": null,
    "availableLanguages": [
      "English"
    ],
    "italianVersionAvailable": false,
    "italianVersionType": "none",
    "italianEvidence": "D",
    "italianValidation": {
      "reference": null,
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "individual",
      "bedside"
    ],
    "approximateDurationMinutes": 3,
    "resultType": "total_severity_score",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://link.springer.com/article/10.1007/s00415-013-6943-x",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "CC BY for the open-access publication/materials as published; no Italian adaptation",
      "commercialUse": "allowed_with_attribution",
      "redistribution": "allowed_with_attribution",
      "modification": "allowed_with_attribution",
      "softwareIntegration": "allowed_with_attribution",
      "licenseUrl": "https://link.springer.com/article/10.1007/s00415-013-6943-x",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "open_verified",
    "partnershipStatus": "none",
    "suggestedIntegration": "native_integration_candidate",
    "references": [
      {
        "kind": "scientific_primary",
        "title": "Springer – Aphasia Rapid Test",
        "url": "https://link.springer.com/article/10.1007/s00415-013-6943-x"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "aat-it-3",
    "name": "Aachener Aphasie Test – Italian 3",
    "acronym": "AAT-IT-3",
    "version": "3 / Italian 2024",
    "clinicalAreas": [
      "afasia",
      "linguaggio_adulto"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Versione italiana aggiornata dell'Aachen Aphasia Test per valutazione multidimensionale dell'afasia.",
    "population": {
      "label": "Adulti",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone adulte con afasia"
    },
    "originalLanguage": "German",
    "availableLanguages": [
      "German",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Hogrefe – AAT-IT-3",
      "year": 2024,
      "sampleSize": 851,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": 90,
    "resultType": "norm_referenced_profile",
    "scoringAvailable": true,
    "publisher": "Hogrefe",
    "rightsHolder": null,
    "officialUrl": "https://www.hogrefe.com/it/shop/aat-it-3-aachener-aphasie-test.html",
    "officialPurchaseUrl": "https://www.hogrefe.com/it/shop/aat-it-3-aachener-aphasie-test.html",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.hogrefe.com/it/termini-e-condizioni",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Hogrefe – AAT-IT-3",
        "url": "https://www.hogrefe.com/it/shop/aat-it-3-aachener-aphasie-test.html"
      },
      {
        "kind": "rights",
        "title": "Hogrefe Italia – termini e condizioni",
        "url": "https://www.hogrefe.com/it/termini-e-condizioni"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "enpa",
    "name": "Esame Neuropsicologico per l’Afasia",
    "acronym": "ENPA",
    "version": "Italian",
    "clinicalAreas": [
      "afasia",
      "neuropsicologia_del_linguaggio"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana per l'analisi neuropsicologica dei deficit afasici.",
    "population": {
      "label": "Adulti; età numerica non documentata nella fonte V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disturbi afasici"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "ENPA manual / Springer",
      "year": 2001,
      "sampleSize": null,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": null,
    "resultType": "profile_and_normative_scores",
    "scoringAvailable": true,
    "publisher": "Springer",
    "rightsHolder": null,
    "officialUrl": "https://link.springer.com/book/9788847001527",
    "officialPurchaseUrl": "https://link.springer.com/book/9788847001527",
    "rights": {
      "licenseType": "proprietary copyrighted publication/test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://link.springer.com/book/9788847001527",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "publisher",
        "title": "Springer – ENPA",
        "url": "https://link.springer.com/book/9788847001527"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "sand",
    "name": "Screening for Aphasia in NeuroDegeneration",
    "acronym": "SAND",
    "version": "Italian original",
    "clinicalAreas": [
      "afasia",
      "neurodegenerazione",
      "linguaggio_adulto"
    ],
    "toolType": "screening_battery",
    "shortDescription": "Screening italiano per deficit linguistici nelle malattie neurodegenerative, con dati normativi e validazione clinica.",
    "population": {
      "label": "Adulti/anziani; età numerica non fissata nel record V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con sospetta afasia in neurodegenerazione"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian",
      "English"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Clinical validation of SAND in neurodegenerative disease",
      "year": 2018,
      "sampleSize": 205,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": true
    },
    "administrationModes": [
      "individual"
    ],
    "approximateDurationMinutes": null,
    "resultType": "global_and_subtest_scores",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://pubmed.ncbi.nlm.nih.gov/28578483/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "instrument rights not clearly stated in reviewed sources",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific_norms",
        "title": "PubMed – SAND development/normative data",
        "url": "https://pubmed.ncbi.nlm.nih.gov/28578483/"
      },
      {
        "kind": "scientific_validation",
        "title": "PubMed – SAND clinical validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/30352431/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "apacs",
    "name": "Assessment of Pragmatic Abilities and Cognitive Substrates",
    "acronym": "APACS",
    "version": "original Italian",
    "clinicalAreas": [
      "pragmatica_adulto",
      "comunicazione_cognitiva",
      "neuropsicologia"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria italiana per abilità pragmatiche nell'adulto e relativi substrati cognitivi.",
    "population": {
      "label": "Adulti; età numerica non fissata nel record V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Valutazione della pragmatica in adulti sani e popolazioni cliniche"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Arcara & Bambini et al., APACS",
      "year": 2016,
      "sampleSize": 119,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual"
    ],
    "approximateDurationMinutes": 40,
    "resultType": "subtest_profile_and_composite_scores",
    "scoringAvailable": true,
    "publisher": "Academic / NEPLab",
    "rightsHolder": null,
    "officialUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4751735/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "article is open access; separate instrument/software rights not explicitly established",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific_primary",
        "title": "PMC – APACS development and normative data",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4751735/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "apacs-brief",
    "name": "APACS Brief",
    "acronym": "APACS Brief",
    "version": "2025",
    "clinicalAreas": [
      "pragmatica_adulto",
      "comunicazione_cognitiva"
    ],
    "toolType": "brief_screening_battery",
    "shortDescription": "Forma breve dell'APACS per screening pragmatico nell'adulto.",
    "population": {
      "label": "Adulti; età numerica non fissata nel record V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Screening breve di abilità pragmatiche"
    },
    "originalLanguage": "Italian",
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "original_italian",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "APACS Brief: development, normative data and clinical application",
      "year": 2025,
      "sampleSize": 287,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": true
    },
    "administrationModes": [
      "individual"
    ],
    "approximateDurationMinutes": 10,
    "resultType": "brief_composite_score",
    "scoringAvailable": true,
    "publisher": "Academic / NEPLab",
    "rightsHolder": null,
    "officialUrl": "https://www.mdpi.com/2076-328X/15/2/107",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "CC BY-NC-ND 4.0",
      "commercialUse": "forbidden",
      "redistribution": "allowed_noncommercial_unmodified",
      "modification": "forbidden",
      "softwareIntegration": "forbidden",
      "licenseUrl": "https://www.mdpi.com/2076-328X/15/2/107",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "restricted",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "scientific_primary",
        "title": "MDPI – APACS Brief",
        "url": "https://www.mdpi.com/2076-328X/15/2/107"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "fda-2-it",
    "name": "Frenchay Dysarthria Assessment – Second Edition, Italian",
    "acronym": "FDA-2",
    "version": "Italian validation",
    "clinicalAreas": [
      "motor_speech",
      "disartria"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Adattamento italiano della FDA-2 per valutazione strutturata della disartria.",
    "population": {
      "label": "Adulti; lo studio italiano include pazienti e controlli in sei fasce d'età, senza range unico riportato nel record V1",
      "lifeStages": [
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con disartria"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian validation of FDA-2",
      "year": 2023,
      "sampleSize": 181,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual"
    ],
    "approximateDurationMinutes": null,
    "resultType": "profile_and_normative_scores",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9980487/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "original test rights/proprietary status require confirmation for software use",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific_primary",
        "title": "PMC – Italian FDA-2 validation",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9980487/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "aba-2-it",
    "name": "Apraxia Battery for Adults – Second Edition, Italian",
    "acronym": "ABA-2",
    "version": "Italian validation 2026",
    "clinicalAreas": [
      "motor_speech",
      "aprassia_verbale"
    ],
    "toolType": "standardized_battery",
    "shortDescription": "Batteria per aprassia verbale in adolescenti e adulti; adattamento/validazione italiana pubblicata nel 2026.",
    "population": {
      "label": "Adolescenti e adulti",
      "lifeStages": [
        "adolescent",
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Aprassia verbale acquisita"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Italian adaptation and validation of ABA-2",
      "year": 2026,
      "sampleSize": 125,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "paper"
    ],
    "approximateDurationMinutes": 20,
    "resultType": "profile_and_scores",
    "scoringAvailable": true,
    "publisher": "PRO-ED",
    "rightsHolder": "PRO-ED / original authors",
    "officialUrl": "https://proedinc.com/products-9100.html",
    "officialPurchaseUrl": "https://proedinc.com/products-9100.html",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://proedinc.com/products-9100.html",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "PRO-ED – ABA-2",
        "url": "https://proedinc.com/products-9100.html"
      },
      {
        "kind": "scientific_italian",
        "title": "PubMed – Italian ABA-2 validation 2026",
        "url": "https://pubmed.ncbi.nlm.nih.gov/42479198/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "comfor-2-it",
    "name": "Forerunners in Communication – ComFor-2",
    "acronym": "ComFor-2",
    "version": "Italian adaptation 2023",
    "clinicalAreas": [
      "caa",
      "comunicazione",
      "autismo",
      "disabilita_comunicativa_complessa"
    ],
    "toolType": "performance_based_assessment",
    "shortDescription": "Assessment delle forme/precursori della comunicazione utile anche nella pianificazione CAA.",
    "population": {
      "label": "Qualsiasi età cronologica; livello di sviluppo 12–60 mesi",
      "lifeStages": [
        "child",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone con livello di sviluppo comunicativo 12–60 mesi"
    },
    "originalLanguage": null,
    "availableLanguages": [
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "official_adaptation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Hogrefe – ComFor-2 Italian edition",
      "year": 2023,
      "sampleSize": 623,
      "normativeDataAvailable": true,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "individual",
      "performance_based"
    ],
    "approximateDurationMinutes": 60,
    "resultType": "profile_and_level_scores",
    "scoringAvailable": true,
    "publisher": "Hogrefe",
    "rightsHolder": null,
    "officialUrl": "https://www.hogrefe.com/it/shop/forerunners-in-communication.html",
    "officialPurchaseUrl": "https://www.hogrefe.com/it/shop/forerunners-in-communication.html",
    "rights": {
      "licenseType": "proprietary copyrighted test",
      "commercialUse": "permission_required",
      "redistribution": "permission_required",
      "modification": "permission_required",
      "softwareIntegration": "permission_required",
      "licenseUrl": "https://www.hogrefe.com/it/termini-e-condizioni",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "permission_required",
    "partnershipStatus": "none",
    "suggestedIntegration": "partnership_candidate",
    "references": [
      {
        "kind": "official_publisher",
        "title": "Hogrefe – ComFor-2",
        "url": "https://www.hogrefe.com/it/shop/forerunners-in-communication.html"
      },
      {
        "kind": "rights",
        "title": "Hogrefe Italia – termini e condizioni",
        "url": "https://www.hogrefe.com/it/termini-e-condizioni"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "communication-matrix",
    "name": "Communication Matrix",
    "acronym": null,
    "version": "current web assessment",
    "clinicalAreas": [
      "caa",
      "comunicazione_precoce",
      "disabilita_comunicativa_complessa"
    ],
    "toolType": "communication_profile",
    "shortDescription": "Profilo di comunicazione per persone ai livelli iniziali di comunicazione, disponibile come servizio web ufficiale.",
    "population": {
      "label": "Tutte le età quando il livello comunicativo è precoce/iniziale",
      "lifeStages": [
        "child",
        "adolescent",
        "adult",
        "older_adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Persone che comunicano a livelli iniziali, anche con disabilità complesse"
    },
    "originalLanguage": "English",
    "availableLanguages": [
      "English",
      "multiple"
    ],
    "italianVersionAvailable": null,
    "italianVersionType": "unknown",
    "italianEvidence": "C",
    "italianValidation": {
      "reference": "Italian formal validation/version not confirmed in the two source reports",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "caregiver_or_clinician_report",
      "web"
    ],
    "approximateDurationMinutes": null,
    "resultType": "communication_profile",
    "scoringAvailable": true,
    "publisher": "Communication Matrix / Design to Learn",
    "rightsHolder": "Charity Rowland (copyright notice on service)",
    "officialUrl": "https://www.communicationmatrix.org/AboutUs",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "copyrighted web service; no explicit commercial redistribution/software license found",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": "https://www.communicationmatrix.org/AboutUs",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "external",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "external_result_recording",
    "references": [
      {
        "kind": "official",
        "title": "Communication Matrix – About",
        "url": "https://www.communicationmatrix.org/AboutUs"
      },
      {
        "kind": "official",
        "title": "Communication Matrix – Assessment",
        "url": "https://www.communicationmatrix.org/Matrix"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "i-omes",
    "name": "Orofacial Myofunctional Evaluation with Scores – Italian",
    "acronym": "I-OMES",
    "version": "Italian",
    "clinicalAreas": [
      "oro_miofunzionale",
      "funzioni_orofacciali"
    ],
    "toolType": "clinician_rating_protocol",
    "shortDescription": "Adattamento italiano di un protocollo strutturato con punteggi per valutazione miofunzionale orofacciale.",
    "population": {
      "label": "Età numerica non fissata nel record V1",
      "lifeStages": [
        "child",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Soggetti con e senza disordini miofunzionali orofacciali"
    },
    "originalLanguage": "Portuguese (Brazil)",
    "availableLanguages": [
      "Portuguese",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "validated_translation",
    "italianEvidence": "A",
    "italianValidation": {
      "reference": "Validity and reliability of the Italian OMES",
      "year": 2018,
      "sampleSize": 201,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": null
    },
    "administrationModes": [
      "clinician_observation",
      "performance_based"
    ],
    "approximateDurationMinutes": null,
    "resultType": "domain_and_total_scores",
    "scoringAvailable": true,
    "publisher": null,
    "rightsHolder": null,
    "officialUrl": "https://pubmed.ncbi.nlm.nih.gov/29847818/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "instrument reuse/software rights not clearly established in reviewed sources",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": null,
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "scientific_validation",
        "title": "PubMed – Italian OMES validation",
        "url": "https://pubmed.ncbi.nlm.nih.gov/29847818/"
      },
      {
        "kind": "scientific_adaptation",
        "title": "PubMed – Italian adaptation / normal scores study",
        "url": "https://pubmed.ncbi.nlm.nih.gov/26691622/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  },
  {
    "id": "mbgr-it",
    "name": "MBGR Protocollo di Valutazione Miofunzionale Oro-Facciale – Italian",
    "acronym": "MBGR",
    "version": "Italian translation/adaptation",
    "clinicalAreas": [
      "oro_miofunzionale",
      "funzioni_orofacciali"
    ],
    "toolType": "clinical_protocol",
    "shortDescription": "Protocollo esteso di valutazione miofunzionale orofacciale disponibile in traduzione/adattamento italiano.",
    "population": {
      "label": "Età numerica non verificata",
      "lifeStages": [
        "child",
        "adolescent",
        "adult"
      ],
      "ageMinMonths": null,
      "ageMaxMonths": null,
      "targetDescription": "Valutazione miofunzionale oro-facciale"
    },
    "originalLanguage": "Portuguese (Brazil)",
    "availableLanguages": [
      "Portuguese",
      "Italian"
    ],
    "italianVersionAvailable": true,
    "italianVersionType": "translated_adaptation",
    "italianEvidence": "B",
    "italianValidation": {
      "reference": "Formal Italian psychometric validation not identified in the source reports",
      "year": null,
      "sampleSize": null,
      "normativeDataAvailable": false,
      "italianCutoffAvailable": false
    },
    "administrationModes": [
      "clinician_observation",
      "performance_based"
    ],
    "approximateDurationMinutes": null,
    "resultType": "structured_clinical_profile",
    "scoringAvailable": true,
    "publisher": "SMOF Italia (Italian dissemination)",
    "rightsHolder": null,
    "officialUrl": "https://www.smofitalia.it/mbgr-protocollo-di-valutazione-miofunzionale-oro-facciale/",
    "officialPurchaseUrl": null,
    "rights": {
      "licenseType": "downloadable protocol; no explicit commercial SaaS license found",
      "commercialUse": "unknown",
      "redistribution": "unknown",
      "modification": "unknown",
      "softwareIntegration": "unknown",
      "licenseUrl": "https://www.smofitalia.it/mbgr-protocollo-di-valutazione-miofunzionale-oro-facciale/",
      "lastCheckedDate": "2026-10-02"
    },
    "integrationStatus": "catalog_only",
    "licenseStatus": "unclear",
    "partnershipStatus": "none",
    "suggestedIntegration": "catalog_only",
    "references": [
      {
        "kind": "italian_source",
        "title": "SMOF Italia – MBGR",
        "url": "https://www.smofitalia.it/mbgr-protocollo-di-valutazione-miofunzionale-oro-facciale/"
      }
    ],
    "catalogReviewStatus": "reviewed"
  }
] as const;

export const clinicalToolsV1Meta = {
  "catalog": "Strumenti clinici ARMONIA",
  "version": "V1",
  "lastCheckedDate": "2026-10-02",
  "recordCount": 38,
  "italianEvidenceLegend": {
    "A": "Versione italiana con validazione/norme robuste o strumento originale italiano standardizzato con documentazione forte.",
    "B": "Versione italiana ufficiale/adattata o evidenza italiana utile ma psicometria/norme incomplete o non pienamente confermate.",
    "C": "Uso italiano documentato o evidenza limitata; versione italiana/validazione non pienamente chiarita.",
    "D": "Nessuna versione italiana verificata nel consolidamento."
  },
  "editorialRule": "Catalog presence does not imply native integration. Null/unknown is preserved when a datum was not documented.",
  "reconciliation": {
    "sourceA": "Ricerca orientata a open/public-domain/CC e riutilizzabilità commerciale in SaaS.",
    "sourceB": "Censimento ampio di 98 strumenti/famiglie disponibili o usati nella logopedia italiana, inclusi proprietari e non integrabili.",
    "A_only_key": [
      "Quick Aphasia Battery / Italian QAB",
      "Aphasia Rapid Test (ART)",
      "CEECCA Questionnaire",
      "Brief Executive Language Screen (BELS)",
      "Cyprus Aphasia Screening Test (CAST)",
      "Communication Development Report (CDR)",
      "SS-QOL-17"
    ],
    "A_only_disposition": {
      "Quick Aphasia Battery / Italian QAB": "promosso a V1",
      "Aphasia Rapid Test (ART)": "promosso a V1 come internazionale/open, senza fingere una versione italiana",
      "CEECCA Questionnaire": "needs_review",
      "Brief Executive Language Screen (BELS)": "needs_review",
      "Cyprus Aphasia Screening Test (CAST)": "needs_review",
      "Communication Development Report (CDR)": "needs_review",
      "SS-QOL-17": "needs_review"
    },
    "duplicates_or_same_families": [
      "M-CHAT-R/F",
      "EAT-10 / I-EAT-10",
      "FOIS / FOIS-It",
      "CAPE-V / CAPE-V italiano",
      "VHI / VHI italiano",
      "VHI-10 / VHI-10 italiano",
      "MacArthur-Bates CDI ↔ PVB (famiglia/adattamento italiano, non record identici)"
    ],
    "main_discordances_resolved": [
      "Open access dell’articolo non equivale a licenza open dello strumento.",
      "TFPI: articolo open, ma licenza commerciale del test/stimoli non verificata → licenseStatus unclear.",
      "APACS originale: articolo open, ma diritti autonomi del test non sufficientemente espliciti → unclear.",
      "APACS Brief: CC BY-NC-ND 4.0 → restricted, non nativo in SaaS commerciale.",
      "ICS: licenza NonCommercial/NoDerivatives → restricted, non nativo in SaaS commerciale.",
      "IDDSI: CC BY-SA 4.0 ma con regola ufficiale che vieta derivazioni oltre la traduzione → open_verified con condizioni, non 'liberamente modificabile'.",
      "FOIS: accesso gratuito non significa uso commerciale libero; ePROVIDE richiede permesso scritto/accordo e può applicare fee commerciali.",
      "EAT-10: copyright/trademark Nestlé e licensing Mapi → permission_required.",
      "QAB: sito ufficiale esplicita CC Attribution e include l’adattamento italiano 2026 → open_verified."
    ]
  },
  "needsReview": [
    {
      "name": "CEECCA Questionnaire",
      "sourceReport": "A_only",
      "reason": "Licenza dell’articolo/strumento indicata come CC BY nella ricerca A, ma non è stata verificata una versione italiana; rilevanza immediata nella pratica italiana inferiore rispetto alla shortlist. Conservare per una futura scheda internazionale, senza traduzione automatica.",
      "sources": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC8619169/",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC10001674/"
      ]
    },
    {
      "name": "Brief Executive Language Screen (BELS)",
      "sourceReport": "A_only",
      "reason": "Materiali ufficiali disponibili e studio open, ma nessuna versione italiana verificata e presenza/uso di materiale tipo Cookie Theft in alcune condizioni rende necessario un audit puntuale dei singoli stimoli prima di qualsiasi integrazione.",
      "sources": [
        "https://qbi.uq.edu.au/brief-executive-language-screen",
        "https://www.mdpi.com/2076-3425/11/3/353"
      ]
    },
    {
      "name": "Cyprus Aphasia Screening Test (CAST)",
      "sourceReport": "A_only",
      "reason": "Strumento recente greco-cipriota con articolo CC BY, ma nessuna versione italiana verificata; prima del catalogo italiano servono verifica dei materiali completi e razionale editoriale per l’uso in Italia.",
      "sources": [
        "https://www.mdpi.com/2076-3425/16/1/32"
      ]
    },
    {
      "name": "Communication Development Report (CDR)",
      "sourceReport": "A_only",
      "reason": "Interessante strumento parent-report 7–30 mesi, ma la versione studiata è greca; manca versione italiana verificata e la licenza ShareAlike richiede un’analisi implementativa specifica.",
      "sources": [
        "https://ejournals.epublishing.ekt.gr/index.php/psychology/article/view/23509/0"
      ]
    },
    {
      "name": "SS-QOL-17",
      "sourceReport": "A_only",
      "reason": "La forma breve è pubblicata in un contesto CC BY, ma deriva dallo SS-QOL originale indicato come copyrighted: serve conferma scritta che la licenza della forma abbreviata copra davvero gli item derivati e l’uso commerciale.",
      "sources": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC9741031/",
        "https://cde.nlm.nih.gov/formView?tinyId=XkFGLkrBYx"
      ]
    },
    {
      "name": "VCAA/VCCA – Valutazione della Comunicazione Aumentativa/Alternativa",
      "sourceReport": "B_only",
      "reason": "Rilevanza storica italiana documentata, ma disponibilità editoriale corrente, pagina ufficiale e diritti non sono sufficientemente chiari per una scheda V1 già 'reviewed'.",
      "sources": [
        "https://books.google.com/books/about/VCCA_Valutazione_della_comunicazione_aum.html?id=qqT78TKinlMC"
      ]
    },
    {
      "name": "PFLI – Profilo Fonetico-Fonologico",
      "sourceReport": "B_only",
      "reason": "Uso storico italiano, ma distribuzione corrente e licenza non abbastanza chiare; mantenere fuori dal V1 finché non si identifica una fonte primaria editoriale/diritti.",
      "sources": [
        "https://www.mdpi.com/2226-471X/10/1/15"
      ]
    },
    {
      "name": "GRBAS/GIRBAS",
      "sourceReport": "B_only",
      "reason": "Metodo di rating clinicamente diffuso, ma non è stata trovata una dichiarazione primaria affidabile di public domain/licenza commerciale della scheda; evitare di presentare un modulo ARMONIA come 'GRBAS ufficiale'.",
      "sources": []
    },
    {
      "name": "GUSS-ITA",
      "sourceReport": "B_only",
      "reason": "Il censimento B conteneva un riferimento non risolvibile/placeholder; prima dell’ingresso V1 vanno sostituiti con fonte primaria della versione italiana e documento chiaro su autorizzazione/diritti.",
      "sources": []
    },
    {
      "name": "DDT-IT / I-IT-MAIS",
      "sourceReport": "B_only",
      "reason": "Nel censimento B le fonti erano placeholder non risolvibili e l’area è adiacente alla logopedia generale; richiedono revisione specialistica separata.",
      "sources": []
    }
  ]
} as const;
