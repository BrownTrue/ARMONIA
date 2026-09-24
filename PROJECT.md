# Armonia

## Scopo

Armonia è una web app per la gestione dell'attività di una logopedista. Riunisce pazienti, appuntamenti, sedute, obiettivi terapeutici e materiali in un'interfaccia unica, con particolare attenzione alla persistenza dei dati, alla privacy e alla continuità del lavoro quotidiano.

## Stack tecnologico

- Next.js 15 con App Router
- React 19 e TypeScript
- Tailwind CSS
- Supabase tramite `@supabase/supabase-js` e `@supabase/ssr`
- Deploy previsto su Vercel
- Google Calendar API per la sincronizzazione unidirezionale degli appuntamenti

## Struttura principale

- `app/`: pagine, layout e route API; include Oggi, Pazienti, Calendario, Sedute, Materiali, Statistiche, Impostazioni, Login e le pagine pubbliche Informazioni e Privacy.
- `components/data-provider.tsx`: API dati condivisa dalla UI e selezione fra provider locale e Supabase.
- `components/`: shell applicativa e moduli riutilizzabili per form, modali, autenticazione e appuntamenti.
- `lib/supabase/`: client browser/server e repository Supabase.
- `lib/data/`: lettura, normalizzazione e versionamento dello stato locale.
- `lib/clinical/`: tipi, payload versionati, validazione runtime e operazioni locali del dominio clinico.
- `lib/google-calendar/`: configurazione, API Google, sincronizzazione e token store.
- `lib/today-dashboard.ts`: classificazione degli appuntamenti odierni in da fare e completati.
- `supabase/migrations/`: schema e modifiche additive del database.

## Modalità dati

Armonia supporta due modalità tramite `NEXT_PUBLIC_DATA_MODE`:

- **Locale**: i dati applicativi persistono in `localStorage` tramite un envelope versionato; il formato storico non versionato viene migrato in lettura senza perdere le collezioni esistenti. I file dei materiali sono conservati in IndexedDB. È presente un archivio locale separato per la connessione Google usata nello sviluppo.
- **Supabase**: autenticazione, entità applicative e relazioni sono gestite da Supabase; i file sono nel bucket privato `therapy-materials` e vengono aperti tramite signed URL. La connessione Google usa un token store server-side persistente.

Il `DataProvider` espone alla UI le stesse operazioni in entrambe le modalità. Supabase è attivo solo quando la configurazione pubblica è presente e la modalità non è impostata su `local`.

## Autenticazione e profilo

In modalità cloud l'accesso usa email e password Supabase, con sessione persistente e logout. Le route operative sono protette da `AuthGate`; `/about`, `/privacy` e `/login` sono pubbliche. Il profilo comprende nome, cognome, professione, email e studio/centro ed è persistente nel provider attivo.

## Funzionalità

### Pazienti

Creazione, ricerca, consultazione, modifica ed eliminazione. La scheda paziente è organizzata nelle sezioni Panoramica, Percorso clinico e Sedute, preservando contatti, prossimo appuntamento, obiettivi e timeline delle sedute.

### Appuntamenti e calendario

Gli appuntamenti supportano creazione, consultazione, modifica ed eliminazione. È possibile creare serie settimanali fino a una data inclusiva: ogni occorrenza è un normale appuntamento con ID proprio e un riferimento nullable comune alla serie. Modifica ed eliminazione agiscono sulla singola occorrenza. La pagina Calendario offre viste Mese, Settimana e Agenda usando la stessa sorgente dati. La vista scelta è memorizzata localmente. Gli appuntamenti alimentano anche la Dashboard Oggi.

### Sedute

Le sedute possono essere create manualmente o a partire da un appuntamento, poi consultate, modificate o eliminate dalla timeline del paziente. Possono essere collegate a obiettivi e materiali e includono il piano per la seduta successiva.

La registrazione retroattiva conserva la data effettiva scelta. Il collegamento `appointmentId` impedisce di creare due sedute per lo stesso appuntamento e permette di modificare quella già registrata.

### Dashboard Oggi

La dashboard usa il collegamento reale tra appuntamenti e sedute. Gli appuntamenti odierni senza seduta sono mostrati in “Da fare oggi”; quelli con una seduta collegata in “Completati oggi”. L'appuntamento resta nello storico e nel calendario.

### Obiettivi

Gli obiettivi sono gestiti nella scheda paziente con stato, progresso e collegamento alle sedute.

### Percorso clinico

In modalità locale la scheda paziente consente di avviare e chiudere percorsi clinici opzionali, consultare i percorsi storici e compilare una prima valutazione guidata `language_communication`. Il wizard usa sei passaggi, autosave debounced, ripresa delle bozze e completamento esplicito con successiva sola lettura. Include tipi applicativi, payload strutturato V1, validazione runtime e protezione da percorsi attivi duplicati. Non sono ancora presenti persistenza Supabase, migration, collegamento strutturato agli obiettivi o timeline clinica aggregata.

### Materiali

La libreria supporta upload, apertura, modifica dei metadati, eliminazione, ricerca, filtri e preferiti. I materiali possono essere associati a pazienti e sedute. In cloud i file sono privati e accessibili tramite URL temporanei firmati.

### Google Calendar

La sincronizzazione è unidirezionale da Armonia a Google Calendar per creazione, modifica ed eliminazione degli appuntamenti. Ogni occorrenza di una serie viene sincronizzata come evento Google separato tramite il proprio appointment ID, non come evento ricorrente Google. Armonia rimane la fonte principale; le modifiche manuali su Google non vengono importate.

OAuth richiede accesso offline e un refresh token. Viene usato un calendario secondario dedicato chiamato “Armonia” con scope `calendar.app.created`. Gli eventi sono privati e occupati, senza invitati o descrizione clinica; titolo e reminder sono configurabili nelle Impostazioni.

In locale i token sono conservati nel token store di sviluppo. In cloud sono previsti token cifrati e link di sincronizzazione nelle tabelle dedicate, accessibili solo server-side.

### Statistiche

È presente una pagina con conteggi di sedute, pazienti attivi, obiettivi raggiunti e andamento recente.

## Supabase e deployment

Lo schema include profili, pazienti, appuntamenti, sedute, obiettivi, materiali e tabelle di relazione. RLS e policy isolano i dati per utente. Il bucket `therapy-materials` è privato.

Il repository contiene configurazione e istruzioni per il deploy su Vercel. Lo stato effettivo del deployment e delle migration applicate nei singoli ambienti non è deducibile dal solo repository e deve essere verificato prima di interventi cloud.

## Principi architetturali

- Una sola API dati condivisa dalla UI, con implementazioni locale e Supabase.
- Armonia è la fonte principale degli appuntamenti anche quando Google Calendar è collegato.
- Persistenza locale completa per lo sviluppo senza Supabase.
- Operazioni cloud protette da autenticazione, RLS e isolamento per utente.
- File privati aperti tramite URL temporanei, non tramite link pubblici permanenti.
- Modifiche al database additive e retrocompatibili, applicate manualmente.
