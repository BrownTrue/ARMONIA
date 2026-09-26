# Attività note

Questo elenco contiene solo attività risultanti dallo stato attuale del repository o già esplicitamente previste per Armonia.

## Priorità alta

- Eseguire un deploy controllato del nuovo codice Libreria terapeutica V2, ora che la `014` è applicata e il postflight è positivo, quindi collaudare con dati sintetici idempotenza finalize, concorrenza quota, signed upload, download e delete contabilizzato. Il nuovo codice non è ancora pubblicato.
- Solo dopo il collaudo cloud del flusso V2, revisionare e applicare separatamente la migration `015` di enforcement. Fino ad allora le vecchie policy del bucket restano attive e `file_size_limit`/`allowed_mime_types` non sono configurati.
- Collaudare manualmente con un account e appuntamenti sintetici la UI Calendario ARMONIA e il feed ICS dopo un futuro deploy esplicitamente autorizzato. Migration `013`, postflight e configurazione della chiave Production sono completati; UI e codice restano non pubblicati.

- Preparare separatamente una futura migration `012` che attivi i trigger atomici soltanto insieme al cutover controllato; la `011` è già applicata in produzione ma resta passiva e senza trigger. Collaudare il processore con un singolo account sintetico prima di configurare il cron Supabase ogni 2 minuti o disattivare la coda browser cloud.
- Completare in una fase successiva il rollout Google server-side: riconciliazione ultimi 90 giorni e appuntamenti futuri, transizione sicura della coda legacy, stato UI server-side e semantica conservativa di scollegamento. Il cron e il cutover non sono ancora implementati.

- Verificare, prima di attivare Google Calendar in un ambiente cloud, se `004_google_calendar_production.sql` è stata applicata in quell'ambiente e se le variabili server necessarie sono configurate. La verifica e l'eventuale esecuzione devono essere manuali e autorizzate.
- Prima di usare gli appuntamenti ricorrenti in modalità cloud, applicare manualmente e con autorizzazione `005_weekly_recurring_appointments.sql` nell'ambiente interessato.
- Aggiornare il README affinché includa le migration `004` e `005` e la configurazione server-side richiesta da Google Calendar su Vercel.
- Verificare separatamente lo stato della migration `008_goals_clinical_pathway.sql` prima di collaudare in cloud l'associazione tra obiettivi e percorso.
- Collaudare manualmente Clinical Assessment V2 cloud con dati sintetici in un ambiente sicuro prima di autorizzare push/deploy del codice locale aggiornato.
- Revisionare e applicare manualmente `009_professional_branding_storage.sql` prima di pubblicare il supporto cloud al logo professionale, quindi verificarlo con un account di collaudo.
- Eseguire il security hardening Supabase già rimandato: revisionare i privilegi `EXECUTE` delle funzioni `SECURITY DEFINER`, attivare Leaked Password Protection e rieseguire il Security Advisor. Non intervenire sui warning senza una revisione dedicata.

## Miglioramenti

- Introdurre un namespace per utente per coda, mapping e stato Google conservati nel browser, definendo prima una migrazione esplicita e non distruttiva della coda legacy già esistente.
- Estendere i test automatici oltre la copertura attuale di ricorrenze, operazioni individuali e partizione Dashboard: CRUD principali, registrazione retroattiva e flussi UI completi.
- Ampliare i test UI automatici del Percorso clinico; i test sintetici attuali coprono versionamento locale, vincoli dei percorsi, test multipli e ciclo draft/completed, mentre i flussi UI sono stati verificati manualmente in locale.

## Idee future

- Aggiungere, dopo una progettazione completa e sicura, le operazioni sulle serie “questo e successivi” e “intera serie”.
- Valutare uno storico revisioni delle valutazioni cliniche completate, con audit log, autore e confronto tra versioni; l’MVP attuale sovrascrive la versione precedente durante una correzione esplicita.
