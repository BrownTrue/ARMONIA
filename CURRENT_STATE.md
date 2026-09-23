# Stato corrente di Armonia

Fotografia ricavata dal repository al 23 settembre 2026.

## Stato Git rilevato prima della documentazione

- Branch: `main`, con il commit locale `0b5588c` non ancora presente su `origin/main` al momento del controllo iniziale di questo intervento.
- Nessuna modifica non committata era presente al momento del controllo iniziale.
- Ultimo commit: `0b5588c` — “Aggiunge documentazione di continuita progetto”.
- Commit precedenti rilevanti: `8d35adb` — Dashboard Oggi; `1548997` — Google Calendar e sedute retroattive; `6ce4d3e` — MVP cloud stabile.

## Funzionalità implementate

- Autenticazione Supabase con email/password, sessione persistente e logout in modalità cloud.
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

## Architettura rilevante

- `components/data-provider.tsx` mantiene lo stato condiviso e instrada le operazioni al provider locale o Supabase.
- `lib/supabase/repository.ts` traduce fra tipi applicativi e righe Supabase, incluse le relazioni.
- `Session.appointmentId` corrisponde a `sessions.appointment_id` ed è la fonte dello stato completato di un appuntamento.
- `Appointment.recurrenceSeriesId` corrisponde a `appointments.recurrence_series_id`; è nullable per gli appuntamenti storici e raggruppa occorrenze che mantengono ID autonomi.
- `lib/recurrence.ts` genera le date settimanali con aritmetica UTC sulla sola data, evitando slittamenti dovuti al cambio di fuso o ora legale.
- La Dashboard Oggi usa `lib/today-dashboard.ts` per partizionare gli appuntamenti odierni non annullati.
- La sincronizzazione Google è avviata dalle mutazioni degli appuntamenti; in modalità cloud token e operazioni sensibili restano server-side.
- I file locali dei materiali usano IndexedDB; in cloud usano il bucket privato `therapy-materials`.

## Stato dello schema e migration presenti

- `001_initial_schema.sql`: schema iniziale, enum, tabelle applicative, relazioni, RLS, policy e bucket privato dei materiali.
- `002_profile_fields.sql`: campi aggiuntivi del profilo e trigger di creazione/aggiornamento profilo utente.
- `003_grants.sql`: privilegi per il ruolo `authenticated` sulle tabelle applicative.
- `004_google_calendar_production.sql`: tabelle additive per connessione Google cifrata e link appuntamento/evento, indici, RLS e revoca dell'accesso diretto ai ruoli browser.
- `005_weekly_recurring_appointments.sql`: colonna nullable `appointments.recurrence_series_id` e indice parziale per utente/serie; conserva RLS e grant esistenti.

La presenza delle migration nel repository non dimostra che siano state applicate a uno specifico ambiente Supabase. Prima di interventi cloud occorre verificare separatamente lo stato dell'ambiente interessato.

## Limiti noti e verificabili

- La sincronizzazione Google è volutamente solo Armonia → Google; le modifiche effettuate in Google non aggiornano Armonia.
- Per le serie ricorrenti sono disponibili solo creazione settimanale e modifica/eliminazione della singola occorrenza; non sono ancora presenti operazioni “questo e successivi” o “intera serie”.
- La copertura automatica è limitata ai casi della ricorrenza, alle operazioni individuali e alla relazione appuntamento/seduta nella Dashboard; non è presente una suite completa dei flussi applicativi.
- Il README elenca le migration fino alla `003`, mentre nel repository sono presenti anche la `004` e la `005`; inoltre non documenta l'intera configurazione server-side Google per Vercel.
- Il repository da solo non consente di verificare stato del deploy Vercel, variabili configurate o migration effettivamente applicate in produzione.

## Ultime modifiche importanti

- La Dashboard Oggi non lascia più tra gli appuntamenti da fare quelli che hanno già una seduta collegata e mostra separatamente i completati.
- È stata aggiunta la registrazione retroattiva delle sedute preservando data reale e collegamento all'appuntamento.
- È stata aggiunta la sincronizzazione Google Calendar e la struttura server-side prevista per persisterla in modalità cloud.
- Sono state aggiunte serie settimanali materializzate come appuntamenti indipendenti, con riferimento comune nullable e sincronizzazione Google separata per occorrenza.
