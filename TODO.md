# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

## Priorità alta

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Prima di usare gli appuntamenti ricorrenti in modalità cloud, applicare manualmente e con autorizzazione `005_weekly_recurring_appointments.sql` nell'ambiente interessato.
- Aggiornare il README affinché includa le migration `004` e `005` e la configurazione server-side richiesta da Google Calendar su Vercel.
- Proseguire il Percorso clinico per fasi controllate con collegamento minimo agli obiettivi esistenti e timeline aggregata, preservando il wizard locale già implementato.
- Solo dopo la validazione completa in modalità locale, progettare e revisionare le migration additive e il repository Supabase del Percorso clinico; non applicarli automaticamente.

## Miglioramenti

- Estendere i test automatici oltre la copertura attuale di ricorrenze, operazioni individuali e partizione Dashboard: CRUD principali, registrazione retroattiva e flussi UI completi.
- Ampliare i test UI automatici del Percorso clinico; i test sintetici attuali coprono versionamento locale, vincoli dei percorsi, test multipli e ciclo draft/completed, mentre i flussi UI sono stati verificati manualmente in locale.

## Idee future

- Aggiungere, dopo una progettazione completa e sicura, le operazioni sulle serie “questo e successivi” e “intera serie”.
- Valutare uno storico revisioni delle valutazioni cliniche completate, con audit log, autore e confronto tra versioni; l’MVP attuale sovrascrive la versione precedente durante una correzione esplicita.
