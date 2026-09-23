# Armonia — Regole permanenti per gli agenti

Queste regole si applicano a qualunque agente lavori in questo repository.

## Prima di iniziare

- Leggere `PROJECT.md`, `CURRENT_STATE.md` e `TODO.md` prima di modifiche significative.
- Eseguire `git status` e prendere nota delle modifiche locali già presenti.
- Analizzare il codice e le migration esistenti prima di implementare o correggere una funzione.
- Consultare il log Git recente quando serve ricostruire decisioni o modifiche precedenti.
- Non sovrascrivere, scartare o includere in interventi non correlati modifiche locali già presenti.

## Sicurezza di dati e database

- Non cancellare, resettare o alterare dati esistenti senza una richiesta esplicita e circoscritta.
- Non eseguire wipe o reset del database e non ricreare tabelle già popolate.
- Per Supabase usare migration retrocompatibili e preferibilmente additive.
- Creare le migration quando richiesto, ma non eseguirle automaticamente.
- Prima di modificare Supabase, controllare schema, tipi, foreign key, indici, `GRANT`, RLS, policy e migration precedenti.
- Preservare RLS, autenticazione e isolamento dei dati per utente.
- Non usare mai chiavi server o service role nel browser.
- Non inserire secret, API key, token, credenziali o dati personali/clinici nei file Markdown o nel repository.
- Non modificare `.env.local` senza una richiesta esplicita.

## Invarianti funzionali da preservare

- Preservare pazienti, appuntamenti, sedute, obiettivi, materiali e relative associazioni già esistenti.
- Preservare il collegamento reale fra seduta e appuntamento: `Session.appointmentId` nell'applicazione corrisponde a `sessions.appointment_id` nel database.
- Preservare la registrazione retroattiva delle sedute con la data effettiva scelta, il corretto ordinamento cronologico e la protezione dai duplicati per appuntamento.
- Preservare la logica della Dashboard Oggi: appuntamenti collegati a una seduta sono nei “Completati oggi”; gli altri sono nei “Da fare oggi”. Eliminando la seduta, l'appuntamento deve tornare tra quelli da fare.
- Preservare l'integrazione unidirezionale Google Calendar: Armonia è la fonte principale e sincronizza creazione, modifica ed eliminazione verso Google.
- Non inserire dati clinici negli eventi Google. Mantenere descrizione vuota, evento privato, stato occupato e nessun invitato.
- Preservare entrambe le modalità dati: locale con `localStorage`/IndexedDB e cloud con Supabase.
- Non introdurre una seconda fonte dati parallela per appuntamenti o altre entità gestite dal `DataProvider`.

## Consegna e documentazione

- Non fare push su GitHub e non eseguire deploy Vercel senza richiesta esplicita.
- Non eseguire commit automaticamente salvo richiesta esplicita.
- Verificare le modifiche in proporzione al rischio e dichiarare con precisione ciò che non è stato testato.
- Aggiornare `CURRENT_STATE.md` dopo modifiche significative, descrivendo lo stato corrente e non una cronologia infinita.
- Aggiornare `TODO.md` quando un'attività nota viene completata, aggiunta o cambia priorità.
- Aggiornare `PROJECT.md` solo quando cambiano caratteristiche o principi strutturali del progetto.

