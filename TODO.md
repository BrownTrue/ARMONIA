# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

## Priorità alta

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Aggiornare il README affinché includa la migration `004` e la configurazione server-side richiesta da Google Calendar su Vercel.

## Miglioramenti

- Introdurre test automatici per i flussi critici oggi non coperti da una suite nel repository: CRUD principali, collegamento appuntamento/seduta, registrazione retroattiva e partizione “Da fare oggi”/“Completati oggi”.

## Idee future

- Progettare e implementare gli appuntamenti ricorrenti senza alterare gli appuntamenti e le sedute esistenti.

