# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

## Priorità alta

- Prima di abilitare Clinical Assessment V2 in cloud, decidere e revisionare il ruolo SQL di `clinical_assessments.module_type`; predisporre poi una migration additiva che preservi il significato V1, abiliti `schema_version = 2` e i nuovi `assessment_type`, senza backfill dei record storici.

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Prima di usare gli appuntamenti ricorrenti in modalità cloud, applicare manualmente e con autorizzazione `005_weekly_recurring_appointments.sql` nell'ambiente interessato.
- Aggiornare il README affinché includa le migration `004` e `005` e la configurazione server-side richiesta da Google Calendar su Vercel.
- Revisionare con attenzione e poi applicare manualmente, nell'ordine, `006_clinical_pathways.sql`, `007_clinical_assessments.sql` e `008_goals_clinical_pathway.sql` prima di pubblicare il codice cloud clinico. Le migration sono state create ma non eseguite.
- Dopo l'applicazione manuale delle migration, collaudare il Percorso clinico cloud con dati sintetici in un ambiente sicuro prima del deploy sui dati reali.
- Revisionare e applicare manualmente `009_professional_branding_storage.sql` prima di pubblicare il supporto cloud al logo professionale, quindi verificarlo con un account di collaudo.
- Eseguire il security hardening Supabase già rimandato: revisionare i privilegi `EXECUTE` delle funzioni `SECURITY DEFINER`, attivare Leaked Password Protection e rieseguire il Security Advisor. Non intervenire sui warning senza una revisione dedicata.

## Miglioramenti

- Introdurre un namespace per utente per coda, mapping e stato Google conservati nel browser, definendo prima una migrazione esplicita e non distruttiva della coda legacy già esistente.
- Estendere i test automatici oltre la copertura attuale di ricorrenze, operazioni individuali e partizione Dashboard: CRUD principali, registrazione retroattiva e flussi UI completi.
- Ampliare i test UI automatici del Percorso clinico; i test sintetici attuali coprono versionamento locale, vincoli dei percorsi, test multipli e ciclo draft/completed, mentre i flussi UI sono stati verificati manualmente in locale.

## Idee future

- Aggiungere, dopo una progettazione completa e sicura, le operazioni sulle serie “questo e successivi” e “intera serie”.
- Valutare uno storico revisioni delle valutazioni cliniche completate, con audit log, autore e confronto tra versioni; l’MVP attuale sovrascrive la versione precedente durante una correzione esplicita.
