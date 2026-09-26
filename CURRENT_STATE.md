# Stato corrente di Armonia

Fotografia ricavata dal repository al 26 settembre 2026.

## Stato Git rilevato prima dell'intervento corrente

- Branch: `main`, 7 commit locali avanti rispetto a `origin/main`; HEAD iniziale `ccc5db3` — “improve clinical anamnesis experience”.
- Il repository era pulito prima dell'intervento V2 cloud corrente.

## Funzionalità implementate

- Autenticazione Supabase con email/password, sessione persistente e logout in modalità cloud.
- Pagine pubbliche `/about` e `/privacy`, accessibili senza sessione anche in modalità cloud.
- La shell applicativa ha una navigazione mobile completa: la barra rapida conserva le cinque aree quotidiane e un menu laterale accessibile espone tutte le sezioni, incluse Impostazioni, account e logout. I layout condivisi adottano touch target, intestazioni, azioni form e modali adattive per viewport da 360 px, senza creare una seconda app mobile.
- Profilo modificabile e persistente.
- Logo professionale configurabile dalle Impostazioni, con anteprima, sostituzione sicura, rimozione confermata e fallback Armonia. PNG/JPEG/WebP fino a 2 MB vengono ridimensionati proporzionalmente entro 1200×1200 e normalizzati in WebP.
- CRUD pazienti e scheda con appuntamenti, obiettivi, materiali e timeline.
- Calendario interattivo con viste Mese, Settimana e Agenda, navigazione e CRUD appuntamenti.
- Creazione di appuntamenti ricorrenti settimanali con data finale inclusiva, occorrenze autonome e modifica/eliminazione individuale.
- Dashboard Oggi aggiornata dallo stato condiviso del `DataProvider`.
- Separazione degli appuntamenti odierni in “Da fare oggi” e “Completati oggi” tramite `Session.appointmentId`.
- CRUD sedute, collegamento opzionale all'appuntamento, obiettivi e materiali.
- Registrazione retroattiva delle sedute con data effettiva, ordinamento cronologico e controllo duplicati per appuntamento.
- Visualizzazione del campo relativo alla prossima seduta nella scheda paziente e nel flusso successivo.
- Gestione degli obiettivi con stato e progresso.
- Libreria materiali con upload, apertura, modifica, eliminazione, ricerca, filtri, preferiti e associazioni. La V2 cloud è implementata localmente con quota predefinita di 1 GB, limite di 20 MB/file, whitelist PDF/PNG/JPEG/MP3/M4A/WAV/DOCX, controllo del contenuto reale, audio interno, DOCX download-only e link esterni quota-free. Il nuovo upload usa prepare autenticato, prenotazione atomica, signed upload diretto a Storage e finalize server; la modalità locale IndexedDB resta invariata.
- Persistenza locale con `localStorage` e IndexedDB.
- Persistenza cloud tramite repository Supabase e Storage privato con signed URL.
- Sincronizzazione unidirezionale Armonia → Google Calendar per creazione, modifica ed eliminazione.
- La coda Google nel browser processa ogni elemento dello snapshot iniziale in modo indipendente: gli errori temporanei restano pendenti senza bloccare le operazioni successive. Gli `upsert` riferiti ad appuntamenti non più esistenti vengono riconciliati come cancellazioni idempotenti tramite l'eventuale mapping server-side.
- Gli errori del token endpoint Google espongono soltanto il codice OAuth sicuro o lo status HTTP. Un fallimento globale di refresh interrompe gli ulteriori tentativi nello stesso flush senza rimuovere le operazioni pendenti; gli errori relativi a un singolo evento continuano invece a non bloccare gli altri elementi.
- In caso di errore OAuth terminale, le Impostazioni offrono una riconnessione conservativa distinta da “Scollega”. Il callback conserva `calendarId` e preferenze, verifica l'accesso al calendario esistente con le nuove credenziali e salva solo i nuovi token; non crea calendari sostitutivi, non cancella la coda e non avvia automaticamente la sincronizzazione.
- La coda Google legacy mantiene la chiave e il formato esistenti, ma flush e mutazioni sono coordinati tra tab tramite Web Locks con lease locale di fallback. “Sincronizza ora” elabora soltanto le operazioni pendenti; la riaccodatura completa è un'azione secondaria confermata. Il runner single-flight esegue un passaggio successivo quando arriva nuovo lavoro e i parametri OAuth `connected`/`reconnected` vengono consumati una sola volta e rimossi dall'URL.
- Preferenze Google per formato del titolo e reminder, con stato connessione nelle Impostazioni.
- È implementato localmente il Calendario ARMONIA sottoscrivibile: API autenticate per stato, attivazione, formato titolo, rotazione e disattivazione; route pubblica ICS protetta da bearer token; generazione UTC con ETag e finestra ultimi 90 giorni + futuro. Nelle Impostazioni la nuova sezione Calendari affianca, senza modificarla, la card Google a un accordion ARMONIA con attivazione, privacy del titolo, copia link, apertura Apple Calendar, istruzioni sintetiche, rotazione e disattivazione. In modalità locale il feed resta inattivo e non viene interrogato. La UI è ancora soltanto locale e non è stata pubblicata.
- L'infrastruttura dormiente per la futura outbox Google server-side è presente in produzione: la migration additiva `011`, applicata manualmente il 25/09/2026, estende i link evento con versionamento, retry e lease e aggiunge primitive server-only di claim/complete/retry/fail, ma non crea trigger sugli appuntamenti. I trigger atomici sono rimandati a una futura `012` da coordinare con il cutover; il worker server è disabilitato, il cron non è configurato e la sincronizzazione browser legacy resta attiva e autorevole.
- Statistiche di base su sedute, pazienti e obiettivi.
- Envelope locale `schemaVersion: 1`, con migrazione sicura del precedente `AppData` non versionato e protezione da JSON corrotti o versioni future.
- Tipi e payload V1 per percorsi clinici opzionali e valutazioni iniziali `language_communication`.
- Validazione runtime minima e CRUD locale di percorsi e valutazioni.
- Repository Supabase clinico predisposto per CRUD di percorsi e valutazioni, correzione esplicita, associazione Goal/percorso e caricamento cloud; le nuove operazioni aggiornano lo stato UI solo dopo una scrittura cloud confermata.
- Navigazione interna della scheda paziente con Panoramica, Percorso clinico e Timeline.
- Percorso clinico locale opzionale con stato vuoto, creazione, chiusura non distruttiva e consultazione dei percorsi storici.
- Wizard locale in sei passaggi per la prima valutazione Linguaggio e comunicazione, con autosave debounced, ripresa delle bozze, test multipli e completamento in sola lettura.
- Gli autosave delle valutazioni cliniche sono serializzati per istanza del wizard: una scrittura successiva attende la precedente, gli errori non bloccano definitivamente la coda e “Salva e chiudi”/completamento attendono il salvataggio dell'ultimo draft corrente.
- Sono presenti le fondamenta applicative della Clinical Assessment V2: union discriminata tramite `schemaVersion`, payload modulare, registry dei moduli e dispatch interno V1/V2. “Nuova valutazione” richiede soltanto tipo e data clinica, crea una bozza V2 senza moduli e apre il wizard dal primo passaggio “Motivo dell’accesso” sia in locale sia in cloud. Tutti i sei passaggi sono compilabili e salvabili anche con `modules: []`; il completamento richiede almeno un’area clinica. Il registry comprende dodici moduli v1 selezionabili, con validazione runtime e adapter di stampa. Autosave debounced, coda FIFO, completamento, sola lettura, correzione esplicita e stampa operano sull’intero draft multi-modulo. Le valutazioni V1 storiche restano invariate e continuano ad aprirsi con wizard e renderer V1 tramite dispatch su `schemaVersion`; non esiste conversione V1→V2. Il codice locale supporta ora create, load, autosave, completamento e correzione V2 tramite Supabase, ma questa versione non è ancora presente su Vercel perché non è stato eseguito push o deploy.
- L’anamnesi V2 usa un registry di sezioni attivabili e salva esclusivamente i testi documentati in `anamnesis.sections`. La data di nascita, confrontata con la data clinica, determina soltanto l’ordine dei suggerimenti UI per fascia d’età: nessuna sezione viene attivata, nascosta o compilata automaticamente e l’intero registry resta sempre disponibile. Il precedente formato locale a sei campi rimane valido in lettura ed è normalizzato conservativamente nel nuovo formato alla modifica successiva; stampa e ordine canonico usano lo stesso registry.
- I campi elenco del wizard clinico (lingue, professionisti, punti di forza e difficoltà) supportano realmente una voce per riga e mantengono il contenuto attraverso autosave, cambio passaggio e refresh.
- Le valutazioni completate espongono una stampa A4 professionale con branding, dati del professionista e del paziente, titolo del percorso, sezioni numerate, test multipli, footer e contenuto clinico separato dai controlli del wizard; le bozze non sono stampabili. Codici, array e multilinea vengono trasformati in etichette e liste leggibili, mentre le sezioni vuote sono omesse.
- I percorsi attivi possono essere corretti nel titolo e nella data iniziale; un percorso può essere eliminato soltanto quando non contiene valutazioni.
- Le valutazioni V1 e V2 possono essere eliminate singolarmente sia in bozza sia dopo il completamento; le completed restano in sola lettura e modificabili soltanto tramite correzione esplicita, mentre l’eliminazione amministrativa è protetta dalla conferma testuale `ELIMINA` e non rimuove percorso, paziente, sedute o obiettivi.
- Gli obiettivi esistenti possono essere collegati o scollegati dal percorso attivo dello stesso paziente tramite `Goal.clinicalPathwayId`; la chiusura conserva il collegamento storico e i percorsi chiusi sono in sola lettura per queste associazioni. Il mapping cloud della colonna nullable è predisposto dalla migration `008` non eseguita.
- Il form Registra seduta propone prima gli obiettivi del percorso attivo e poi gli obiettivi attivi non associati, continuando a salvare la selezione esclusivamente in `Session.goalIds`/`session_goals`.
- La Timeline del paziente aggrega sedute e valutazioni tramite `PatientTimelineItem`, ordinando per data effettiva/clinica e `createdAt`, senza introdurre una tabella timeline.

## Architettura rilevante

- `components/data-provider.tsx` mantiene lo stato condiviso e instrada le operazioni al provider locale o Supabase.
- `components/auth-gate.tsx` protegge le route operative e consente esplicitamente `/login`, `/about` e `/privacy` senza sessione.
- `lib/supabase/repository.ts` traduce fra tipi applicativi e righe Supabase, incluse le relazioni.
- `Session.appointmentId` corrisponde a `sessions.appointment_id` ed è la fonte dello stato completato di un appuntamento.
- `Appointment.recurrenceSeriesId` corrisponde a `appointments.recurrence_series_id`; è nullable per gli appuntamenti storici e raggruppa occorrenze che mantengono ID autonomi.
- `lib/recurrence.ts` genera le date settimanali con aritmetica UTC sulla sola data, evitando slittamenti dovuti al cambio di fuso o ora legale.
- La Dashboard Oggi usa `lib/today-dashboard.ts` per partizionare gli appuntamenti odierni non annullati.
- La sincronizzazione Google è avviata dalle mutazioni degli appuntamenti; in modalità cloud token e operazioni sensibili restano server-side.
- I file locali dei materiali usano IndexedDB; in cloud usano il bucket privato `therapy-materials`.
- Il logo professionale non è incluso in `AppData`: in locale usa l'object store IndexedDB `branding` nello stesso database dei materiali, senza alterare lo store `files`; in cloud usa il path deterministico privato `{user_id}/logo.webp` nel bucket `professional-branding` previsto dalla migration `009` non eseguita.
- `lib/data/local-store.ts` mantiene la chiave `armonia-demo-v2`, distingue il formato legacy dall'envelope V1 e impedisce la sovrascrittura automatica di dati corrotti o provenienti da versioni future.
- `lib/clinical/` contiene tipi, factory, validazione e regole condivise del Percorso clinico; `lib/supabase/clinical-repository.ts` le riutilizza per la persistenza cloud e il `DataProvider` seleziona il provider senza differenze per la UI.
- `components/clinical/` contiene la dashboard opzionale del percorso e il wizard specifico della valutazione V1; non è stato introdotto un motore universale di questionari.
- `components/clinical/assessment-summary.tsx` genera il riepilogo leggibile usato esclusivamente per la stampa delle valutazioni completate; le regole `@media print` nascondono la shell e i controlli applicativi.
- Le correzioni di una valutazione completata usano un’operazione locale distinta dall’autosave delle bozze, mantengono `status: completed`, `patientId`, `clinicalPathwayId`, `schemaVersion` e `createdAt`, e aggiornano `updatedAt`.
- `lib/clinical/goals.ts` applica le regole locali di associazione Goal/percorso; `lib/clinical/timeline.ts` costruisce una proiezione discriminata ed estendibile di sedute e valutazioni.

## Stato dello schema e migration presenti

- `001_initial_schema.sql`: schema iniziale, enum, tabelle applicative, relazioni, RLS, policy e bucket privato dei materiali.
- `002_profile_fields.sql`: campi aggiuntivi del profilo e trigger di creazione/aggiornamento profilo utente.
- `003_authenticated_grants.sql`: privilegi per il ruolo `authenticated` sulle tabelle applicative esistenti al momento della migration.
- `004_google_calendar_production.sql`: tabelle additive per connessione Google cifrata e link appuntamento/evento, indici, RLS e revoca dell'accesso diretto ai ruoli browser.
- `005_weekly_recurring_appointments.sql`: colonna nullable `appointments.recurrence_series_id` e indice parziale per utente/serie; conserva RLS e grant esistenti.
- `006_clinical_pathways.sql`: tabella dei percorsi, vincoli di appartenenza, massimo un percorso attivo, RLS e grant `authenticated`; la tabella è presente nell'ambiente di produzione verificato.
- `007_clinical_assessments.sql`: valutazioni V1 collegate al percorso, JSONB validato a runtime, RLS e grant `authenticated`; la tabella contiene le 5 V1 verificate prima/dopo la migration `010`.
- `008_goals_clinical_pathway.sql`: collegamento nullable e coerente per proprietario/paziente tra Goal e percorso, senza backfill; lo stato di applicazione non è stato verificato in questo intervento.
- `009_professional_branding_storage.sql`: **creata ma non eseguita**; bucket privato per il logo professionale e policy Storage limitate al solo `{auth.uid()}/logo.webp`.
- `010_clinical_assessments_v2.sql`: registrazione esatta della modifica applicata manualmente al database reale il 25/09/2026; rende `module_type` nullable e vincola in modo discriminato V1 (`language_communication`/`initial`) e V2 (`module_type = null`, quattro tipi di valutazione). Dopo l'applicazione risultavano 5 righe V1, 0 V2, nessun dato modificato e constraint validato.
- `011_google_calendar_server_outbox.sql`: **applicata manualmente in produzione il 25/09/2026**; estende `google_calendar_event_links` con `operation_version`, pianificazione tentativi, lease e classificazione degli errori e aggiunge le quattro funzioni server-side di claim/complete/retry/fail. Le verifiche post-migration riportano 93 link totali, tutti con `google_event_id`: 90 `synced`, 3 errori legacy, 0 `pending` e 0 `syncing`. Su `public.appointments` non risultano trigger non interni, quindi l'infrastruttura resta dormiente; la registrazione atomica delle mutazioni è rimandata a una futura `012`, non ancora creata né applicata.
- `013_calendar_feed_subscriptions.sql`: **applicata manualmente in produzione e verificata con postflight**; tabella presente con 0 subscription iniziali, RLS attiva, nessun `SELECT` per `anon`/`authenticated`, privilegi CRUD per `service_role`, indice `appointments_user_starts_at_idx` e constraint `title_format` presenti. Non ha modificato righe cliniche o Google. Il controllo preflight sui dati ha rilevato 0 collegamenti appointment/patient tra utenti diversi. `CALENDAR_FEED_ENCRYPTION_KEY` è configurata su Vercel Production; il valore non è registrato nel repository.
- `014_therapeutic_library_storage_foundation.sql`: **applicata manualmente in produzione con postflight PASS**; tabelle quota/reservation con RLS, nessun privilegio browser e otto funzioni `SECURITY DEFINER` con `search_path = pg_catalog, public` ed `EXECUTE` solo `service_role`. L'account esistente è inizializzato con quota `1073741824`, utilizzo verificato `152816` byte e `reserved_bytes = 0`; non risultano reservation attive. L'unico materiale Storage esistente misura `152816` byte e coincide fra DB e Storage.
- `015_therapeutic_library_storage_enforcement.sql`: **creata localmente e non applicata**; sarà il cutover successivo che imposta limite/MIME del bucket privato, rimuove le mutazioni Storage dirette dal browser e lascia ad `authenticated` soltanto `SELECT` su `materials`. Attualmente `therapy-materials` conserva le vecchie policy, `file_size_limit` e `allowed_mime_types` sono ancora null.

La presenza delle migration nel repository non dimostra che siano state applicate a uno specifico ambiente Supabase. Prima di interventi cloud occorre verificare separatamente lo stato dell'ambiente interessato.

## Limiti noti e verificabili

- La sincronizzazione Google è volutamente solo Armonia → Google; le modifiche effettuate in Google non aggiornano Armonia.
- La coda Google locale usa ancora una chiave legacy non associata allo user ID. Il namespace per utente è rimandato perché le operazioni già presenti non possono essere attribuite retroattivamente con certezza senza una strategia di migrazione esplicita.
- Per le serie ricorrenti sono disponibili solo creazione settimanale e modifica/eliminazione della singola occorrenza; non sono ancora presenti operazioni “questo e successivi” o “intera serie”.
- La copertura automatica è limitata ai casi della ricorrenza, alle operazioni individuali e alla relazione appuntamento/seduta nella Dashboard; non è presente una suite completa dei flussi applicativi.
- Il supporto V2 cloud è implementato soltanto nel codice locale e richiede ancora un collaudo manuale con dati sintetici; la produzione Vercel continua a eseguire il codice precedente finché non avverrà un push/deploy esplicitamente autorizzato.
- Lo stato della migration `008` deve essere verificato separatamente prima di collaudare in cloud l'associazione Goal/percorso.
- Il logo cloud resta sul fallback Armonia finché la migration `009` non viene applicata manualmente; il codice branding non deve essere pubblicato prima della migration.
- Nell’MVP una correzione salvata sovrascrive la versione precedente della valutazione completata; non esistono ancora storico revisioni, audit log, autore o confronto tra versioni.
- Il README elenca le migration fino alla `003`, mentre nel repository sono presenti anche la `004` e la `005`; inoltre non documenta l'intera configurazione server-side Google per Vercel.
- Il repository da solo non consente di verificare stato del deploy Vercel, variabili configurate o migration effettivamente applicate in produzione.
- Il processore Google server-side è dormiente e disabilitato; non esiste ancora alcun cron, la migration `012` non è stata creata o applicata e non è stato effettuato il cutover dalla sincronizzazione browser legacy.
- Il Calendario ARMONIA sottoscrivibile ha infrastruttura database e chiave server predisposte in produzione, ma la UI e il backend locali correnti non sono ancora stati pubblicati; non risultano subscription create al postflight della migration `013`.
- Il nuovo codice della Libreria terapeutica V2 non è ancora pubblicato: la produzione è nello stato intermedio sicuro con `014` applicata e `015` non applicata. Le vecchie policy Storage restano attive fino al deploy controllato e al cloud test del nuovo flusso; solo dopo il collaudo potrà essere valutata la `015`. L'audit di reconciliation è report-only, pagina l'intero dataset DB e percorre ricorsivamente il namespace Storage. Le reservation scadute o con cleanup fallito mantengono i byte prenotati.

## Ultime modifiche importanti

- La migration `011` è stata applicata manualmente in produzione il 25/09/2026 e verificata senza trigger su `appointments`: colonne e primitive server-side sono presenti, mentre worker, cron e cutover restano disabilitati.
- È stata registrata nel repository la migration `010`, già applicata manualmente in produzione il 25/09/2026. Il repository Supabase locale ora mappa e valida liste miste V1/V2; le nuove valutazioni cloud sono V2 e le V1 esistenti restano invariate, senza conversione.
- La stampa delle valutazioni completate è stata ridisegnata come documento A4 e predisposta per ricevere in futuro un `logoSrc` professionale opzionale, senza modificare profilo o persistenza.

- La Dashboard Oggi non lascia più tra gli appuntamenti da fare quelli che hanno già una seduta collegata e mostra separatamente i completati.
- È stata aggiunta la registrazione retroattiva delle sedute preservando data reale e collegamento all'appuntamento.
- È stata aggiunta la sincronizzazione Google Calendar e la struttura server-side prevista per persisterla in modalità cloud.
- Sono state aggiunte serie settimanali materializzate come appuntamenti indipendenti, con riferimento comune nullable e sincronizzazione Google separata per occorrenza.
