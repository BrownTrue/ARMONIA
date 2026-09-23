# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

## Priorità alta

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Prima di usare gli appuntamenti ricorrenti in modalità cloud, applicare manualmente e con autorizzazione `005_weekly_recurring_appointments.sql` nell'ambiente interessato.
- Aggiornare il README affinché includa le migration `004` e `005` e la configurazione server-side richiesta da Google Calendar su Vercel.

## Miglioramenti

- Estendere i test automatici oltre la copertura attuale di ricorrenze, operazioni individuali e partizione Dashboard: CRUD principali, registrazione retroattiva e flussi UI completi.

## Idee future

- Aggiungere, dopo una progettazione completa e sicura, le operazioni sulle serie “questo e successivi” e “intera serie”.
