# Stato corrente di Armonia

Fotografia ricavata dal repository al 24 settembre 2026.

## Stato Git rilevato prima dell'intervento corrente

- Branch: `main`, allineato a `origin/main` sul commit `f211883` — “Aggiunge pagine pubbliche privacy e informazioni”.
- Il repository era pulito prima dell'implementazione locale dell'infrastruttura del Percorso clinico.

## Funzionalità implementate

- Autenticazione Supabase con email/password, sessione persistente e logout in modalità cloud.
- Pagine pubbliche `/about` e `/privacy`, accessibili senza sessione anche in modalità cloud.
- Profilo modificabile e persistente.
- CRUD pazienti e scheda con appuntamenti, obiettivi, materiali e timeline.
- Calendario interattivo con viste Mese, Settimana e Agenda, navigazione e CRUD appuntamenti.
- Creazione di appuntamenti ricorrenti settimanali con data finale inclusiva, occorrenze autonome e modifica/eliminazione individuale.
- Dashboard Oggi aggiornata dallo stato condiviso del `DataProvider`.
- Separazione degli appuntamenti odierni in “Da fare oggi” e “Completati oggi” tramite `Session.appointmentId`.
- CRUD sedute, collegamento opzionale all'appuntamento, obiettivi e materiali.
- Registrazione retroattiva delle sedute con data effettiva, ordinamento cronologico e controllo duplicati per appuntamento.
- Visualizzazione del campo relativo alla prossima seduta nella scheda paziente e nel flusso successivo.
- Gestione degli obiettivi con stato e progresso.
- Libreria materiali con upload, apertura, modifica, eliminazione, ricerca, filtri, preferiti e associazioni.
- Persistenza locale con `localStorage` e IndexedDB.
- Persistenza cloud tramite repository Supabase e Storage privato con signed URL.
- Sincronizzazione unidirezionale Armonia → Google Calendar per creazione, modifica ed eliminazione.
- Preferenze Google per formato del titolo e reminder, con stato connessione nelle Impostazioni.
- Statistiche di base su sedute, pazienti e obiettivi.
- Envelope locale `schemaVersion: 1`, con migrazione sicura del precedente `AppData` non versionato e protezione da JSON corrotti o versioni future.
- Tipi e payload V1 per percorsi clinici opzionali e valutazioni iniziali `language_communication`.
- Validazione runtime minima e CRUD locale di percorsi e valutazioni.
- Repository Supabase clinico predisposto per CRUD di percorsi e valutazioni, correzione esplicita, associazione Goal/percorso e caricamento cloud; le nuove operazioni aggiornano lo stato UI solo dopo una scrittura cloud confermata.
- Navigazione interna della scheda paziente con Panoramica, Percorso clinico e Timeline.
- Percorso clinico locale opzionale con stato vuoto, creazione, chiusura non distruttiva e consultazione dei percorsi storici.
- Wizard locale in sei passaggi per la prima valutazione Linguaggio e comunicazione, con autosave debounced, ripresa delle bozze, test multipli e completamento in sola lettura.
- I campi elenco del wizard clinico (lingue, professionisti, punti di forza e difficoltà) supportano realmente una voce per riga e mantengono il contenuto attraverso autosave, cambio passaggio e refresh.
- Le valutazioni completate espongono una stampa nativa con riepilogo A4 dedicato, sezioni non vuote, etichette leggibili e contenuto clinico separato dai controlli del wizard; le bozze non sono stampabili.
- I percorsi attivi possono essere corretti nel titolo e nella data iniziale; un percorso può essere eliminato soltanto quando non contiene valutazioni.
- Le bozze possono essere eliminate singolarmente. Le valutazioni completate restano normalmente in sola lettura, ma dispongono di una modalità esplicita di correzione senza autosave e di un’eliminazione protetta dalla conferma testuale `ELIMINA`.
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
- `006_clinical_pathways.sql`: **creata ma non eseguita**; tabella dei percorsi, vincoli di appartenenza, massimo un percorso attivo, RLS e grant `authenticated`.
- `007_clinical_assessments.sql`: **creata ma non eseguita**; valutazioni V1 collegate al percorso, JSONB validato a runtime, RLS e grant `authenticated`.
- `008_goals_clinical_pathway.sql`: **creata ma non eseguita**; collegamento nullable e coerente per proprietario/paziente tra Goal e percorso, senza backfill.

La presenza delle migration nel repository non dimostra che siano state applicate a uno specifico ambiente Supabase. Prima di interventi cloud occorre verificare separatamente lo stato dell'ambiente interessato.

## Limiti noti e verificabili

- La sincronizzazione Google è volutamente solo Armonia → Google; le modifiche effettuate in Google non aggiornano Armonia.
- Per le serie ricorrenti sono disponibili solo creazione settimanale e modifica/eliminazione della singola occorrenza; non sono ancora presenti operazioni “questo e successivi” o “intera serie”.
- La copertura automatica è limitata ai casi della ricorrenza, alle operazioni individuali e alla relazione appuntamento/seduta nella Dashboard; non è presente una suite completa dei flussi applicativi.
- Il supporto cloud del Percorso clinico è soltanto predisposto e non è pubblicabile finché le migration `006`–`008` non vengono revisionate ed eseguite manualmente nell'ambiente corretto.
- Il repository cloud presuppone la presenza contemporanea delle tre migration: pubblicarlo prima renderebbe incompleto il caricamento cloud e le scritture cliniche.
- Nell’MVP una correzione salvata sovrascrive la versione precedente della valutazione completata; non esistono ancora storico revisioni, audit log, autore o confronto tra versioni.
- Il README elenca le migration fino alla `003`, mentre nel repository sono presenti anche la `004` e la `005`; inoltre non documenta l'intera configurazione server-side Google per Vercel.
- Il repository da solo non consente di verificare stato del deploy Vercel, variabili configurate o migration effettivamente applicate in produzione.

## Ultime modifiche importanti

- Sono state preparate, senza eseguirle, le migration additive `006`–`008` e l'integrazione Supabase del Percorso clinico, mantenendo invariata la modalità locale e la UI.

- La Dashboard Oggi non lascia più tra gli appuntamenti da fare quelli che hanno già una seduta collegata e mostra separatamente i completati.
- È stata aggiunta la registrazione retroattiva delle sedute preservando data reale e collegamento all'appuntamento.
- È stata aggiunta la sincronizzazione Google Calendar e la struttura server-side prevista per persisterla in modalità cloud.
- Sono state aggiunte serie settimanali materializzate come appuntamenti indipendenti, con riferimento comune nullable e sincronizzazione Google separata per occorrenza.
