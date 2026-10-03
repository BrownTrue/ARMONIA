# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

- Collaudare manualmente Statistiche V2 su desktop e mobile verificando periodi, KPI, grafico, prestazioni, Agenda, Pazienti, sintesi Economia e intervalli senza sedute. L'implementazione non introduce migration e non usa dati clinici per stimare outcome.

## Priorità alta

- Collaudare manualmente la Validation UX P1 su nuovo/modifica Paziente, dati amministrativi, nuovo/modifica Appuntamento e ricorrenza, Sedi e Prestazioni, verificando errori inline, scroll/focus al primo campo e distinzione dai fallimenti server.
- Collaudare manualmente la Validation UX P1 su nuova/modifica Seduta, apertura/modifica/chiusura Percorso clinico, Obiettivi e creazione Valutazione: verificare errori inline, riepilogo del form lungo, focus al primo campo, conferme applicative di cancellazione e mancata rimozione ottimistica in caso di errore.
- Collaudare manualmente la Validation UX P1 Economia: incasso senza paziente/data/importo valido, allocazioni di riga e somma oltre l'incasso, focus del primo errore, fallimento server distinto e annullamento Payment tramite conferma applicativa.
- Collaudare manualmente la Validation UX P1 Materiali e Laboratorio: titolo/link/file e fallimenti server distinti; CTA incomplete spiegate; salvataggio per paziente; modifica/eliminazione Ricette, Modelli e Schede; assegnazione a casa e duplicazione con stati di attesa ed errori visibili.

- Collaudare manualmente la validazione contestuale di Clinical Assessment V2 su desktop e mobile: completamento con data o area mancante, warning nello stepper, navigazione/focus, correzione e successivo completamento. Autosave e QAB restano invariati.

- Se le disconnessioni ricompaiono, recuperare prima di modificare le impostazioni Supabase il buffer diagnostico temporaneo con `JSON.parse(sessionStorage.getItem("armonia-auth-diagnostics-v1") || "[]")` e analizzare gli eventi auth/bootstrap. Persistenza e auto-refresh Supabase non sono stati modificati.

- Eseguire in un intervento separato l'hardening dei privilegi non necessari `TRUNCATE`, `REFERENCES` e `TRIGGER` rilevati su `public.sessions`, dopo aver completato l'audit ACL; non fa parte del collaudo funzionale E1.

- Verificare e documentare separatamente la regione effettiva delle Vercel Functions e valutare la configurazione in una regione UE coerente con i requisiti privacy del progetto.
- Valutare in una fase architetturale dedicata quali flussi sanitari oggi processati dalle Vercel Functions possano essere ridotti, mantenendo sicurezza, autenticazione e funzionalità server-only. L'audit data-flow e l'hardening cache/logging sono completati.
- Collaudare manualmente con un account e appuntamenti sintetici la UI Calendario ARMONIA e il feed ICS dopo un futuro deploy esplicitamente autorizzato. Migration `013`, postflight e configurazione della chiave Production sono completati; UI e codice restano non pubblicati.

- Preparare separatamente una futura migration `012` che attivi i trigger atomici soltanto insieme al cutover controllato; la `011` è già applicata in produzione ma resta passiva e senza trigger. Collaudare il processore con un singolo account sintetico prima di configurare il cron Supabase ogni 2 minuti o disattivare la coda browser cloud.
- Completare in una fase successiva il rollout Google server-side: riconciliazione ultimi 90 giorni e appuntamenti futuri, transizione sicura della coda legacy, stato UI server-side e semantica conservativa di scollegamento. Il cron e il cutover non sono ancora implementati.

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Prima di usare gli appuntamenti ricorrenti in modalità cloud, applicare manualmente e con autorizzazione `005_weekly_recurring_appointments.sql` nell'ambiente interessato.
- Aggiornare il README affinché includa le migration `004` e `005` e la configurazione server-side richiesta da Google Calendar su Vercel.
- Verificare separatamente lo stato della migration `008_goals_clinical_pathway.sql` prima di collaudare in cloud l'associazione tra obiettivi e percorso.
- Valutare in una fase futura e separata se il modello dati debba offrire un collegamento diretto seduta/percorso; P4 non lo introduce e continua a usare esclusivamente le relazioni certe tramite `session_goals`.
- Collaudare manualmente Clinical Assessment V2 cloud con dati sintetici in un ambiente sicuro prima di autorizzare push/deploy del codice locale aggiornato.
- Revisionare e applicare manualmente `009_professional_branding_storage.sql` prima di pubblicare il supporto cloud al logo professionale, quindi verificarlo con un account di collaudo.
- Eseguire il security hardening Supabase già rimandato: revisionare i privilegi `EXECUTE` delle funzioni `SECURITY DEFINER`, attivare Leaked Password Protection e rieseguire il Security Advisor. Non intervenire sui warning senza una revisione dedicata.

## Miglioramenti

- Estendere “Modulistica e handout” soltanto in un workstream dedicato: le attestazioni di presenza e di percorso sono placeholder non interattivi; compilazione, dati professionali e generazione documenti non fanno parte della Fase 1.

- Valutare separatamente in un futuro task UX gli avatar paziente illustrati; non fanno parte di A1A/A1B.

- Valutare una chiara azione “Elimina seduta” nella scheda paziente, protetta da conferma e con gestione sicura delle relazioni; non fa parte di E1.
- E2A è chiusa: migration `020_payments_allocations_foundation.sql` applicata manualmente in produzione con preflight e postflight PASS, senza backfill. Mantenere separato l'eventuale hardening dei privilegi ereditati dai default privileges Supabase.
- E2B è implementata e collaudata manualmente in locale: “Incassa” opera sulla singola prestazione, mentre “Registra incasso” resta il flusso generale per anticipi, entrate extra o pagamenti cumulativi e non crea automaticamente una Session. Nessuna funzione fiscale fa parte di E2B.
- Definire prima del lancio il flusso esplicito di cancellazione completa o anonimizzazione di un account con storico economico. E2A blocca intenzionalmente l'hard delete dell'utente Auth quando esistono Payment e non implementa ancora tale workflow.

- Pianificare il restyling UX/UI generale pre-lancio, includendo tipografia, densità, dimensioni delle card, spacing, header, avatar, sistema colori definitivo e micro-interazioni. Il workspace paziente P1–P4 è concluso e non richiede ulteriori rifiniture nel blocco corrente.
- Introdurre un namespace per utente per coda, mapping e stato Google conservati nel browser, definendo prima una migrazione esplicita e non distruttiva della coda legacy già esistente.
- Estendere i test automatici oltre la copertura attuale di ricorrenze, operazioni individuali e partizione Dashboard: CRUD principali, registrazione retroattiva e flussi UI completi.
- Ampliare i test UI automatici del Percorso clinico; i test sintetici attuali coprono versionamento locale, vincoli dei percorsi, test multipli e ciclo draft/completed, mentre i flussi UI sono stati verificati manualmente in locale.

## Idee future

- Italian QAB è il primo strumento clinico nativo ed è pronto per il collaudo manuale nel Percorso clinico; mantenere `docs/qab-it-clinical-review.md` come review pack clinico-editoriale. Gli altri 37 strumenti restano invariati. Prima di ulteriori integrazioni native verificare separatamente diritti su item, scoring, attribuzione e uso software; IDDSI resta scheda catalogo. Valutare partnership e disclosure solo quando esisterà un caso reale.

- `026_exercise_recipes.sql`, `027_worksheet_templates.sql` e `028_patient_worksheets.sql` sono applicate; Schede paziente V1 è online. Il Laboratorio generale può ora salvare una nuova scheda scegliendo un paziente, mentre il contesto paziente e l'update sullo stesso ID restano preservati. Revisionare e applicare manualmente `029_patient_worksheet_home_assignment.sql`, poi collaudare in cloud badge, assegnazione, rimozione e duplicazione non assegnata.
- L'assegnazione a casa V1 resta un semplice timestamp facoltativo sulla `PatientWorksheetV1`. Scadenze, completamento, reminder, consegna, scoring e un eventuale dominio Homework completo richiederanno un workstream futuro separato, solo se necessario. Audio, scene, sequenze visive ricche e rappresentazioni alternative restano evoluzioni future.
- La promozione controllata del corpus Banca Contenuti Round 2 è completata. Restano pendenti cinque coppie: i merge `rana`/`lana`, `gatto`/`fatto`, `foglia`/`voglia`, `treno`/`freno` e la geminazione `fato`/`fatto`; promuoverle soltanto dopo la revisione delle rispettive parole storiche draft. Le future espansioni devono continuare a usare la coda separata, privilegiare i fonemi con copertura illustrata più scarsa (`dz`, `ɲ`, `ts`, `w`, `ʃ`) e prevedere revisione lessicale umana per ogni non-parola.
- Per espandere `SequenceContent`, progettare in un workstream Asset separato scene e sequenze narrative dedicate; non forzare gli attuali asset-oggetto in sequenze narrative artificiali.
- Revisionare in futuro `noun_zebra_001`, unico record fonologico ancora `needs_review`. La prima coda di 108 candidati è stata revisionata e promossa; per nuovi asset continuare a usare il tooling editoriale locale senza derivare IPA, fonemi, cluster, geminate o posizioni dall'ortografia in modo automatico.

- E3A è chiusa: le migration 022 e 023 sono applicate e la diagnostica finale semplice ha validato direttamente policy, CHECK e guardie strutturali senza rilevare variazioni dei dati preesistenti. I vecchi postflight testuali possono produrre falsi negativi e sono sostituiti, per la verifica conclusiva, da `023_final_simple_diagnostic.sql`.
- E3C-A è chiusa: la migration `024` è applicata e validata in produzione; numerazione annuale, tentativi persistenti, lock/controllo anti-doppia-Session, guardie RLS, bucket privato e primitive server-only di finalize/void sono attivi.
- E3C-B è implementata localmente e non committata: route Node autenticate, renderer A4, copia immutabile del logo, upload verificato, signed download e voiding usano le primitive E3C-A e mantengono i retry sullo stesso tentativo.
- E3C-C/E3C.1 sono implementate localmente: la UI espone emissione one-step anche da nuovo proforma, conferma e retry sulla stessa draft, storico issued/voided in sola lettura, PDF privato tramite URL temporaneo e annullamento con motivo obbligatorio. Eseguire nuovamente il collaudo end-to-end prima di chiudere E3C; verificare in particolare emissione diretta, diagnostica degli stadi, conflitto Session, retry, numero/data server, PDF con/senza logo e nuova eleggibilità dopo void. Restano fuori fatturazione elettronica, SDI, Sistema TS, IVA/bollo automatici, PEC, email e pagamenti online.

- Aggiungere, dopo una progettazione completa e sicura, le operazioni sulle serie “questo e successivi” e “intera serie”.
- Valutare uno storico revisioni delle valutazioni cliniche completate, con audit log, autore e confronto tra versioni; l’MVP attuale sovrascrive la versione precedente durante una correzione esplicita.
## Export dati

- [x] User Data Export V1 client-side (CSV/JSON/ZIP, senza binari Storage e senza migration).
- [ ] Valutare separatamente un futuro backup/restore infrastrutturale; non fa parte dell'export V1.
