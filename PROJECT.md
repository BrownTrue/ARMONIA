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

- `app/`: pagine, layout e route API; include Oggi, Pazienti, Calendario, Sedute, Risorse, Materiali, Economia, Statistiche, Impostazioni, Login e le pagine pubbliche Informazioni e Privacy.
- `components/data-provider.tsx`: API dati condivisa dalla UI e selezione fra provider locale e Supabase.
- `components/`: shell applicativa e moduli riutilizzabili per form, modali, autenticazione e appuntamenti.
- `lib/supabase/`: client browser/server e repository Supabase.
- `lib/data/`: lettura, normalizzazione e versionamento dello stato locale.
- `lib/clinical/`: tipi, payload versionati, validazione runtime e operazioni locali del dominio clinico.
- `lib/google-calendar/`: configurazione, API Google, sincronizzazione e token store.
- `lib/privacy/`: diagnostica server-side sanitizzata e verifiche automatiche delle policy privacy applicative.
- `lib/today-dashboard.ts`: classificazione degli appuntamenti odierni in da fare e completati.
- `supabase/migrations/`: schema e modifiche additive del database.

Su mobile la navigazione primaria usa una bottom bar con Oggi, Calendario, Pazienti, Risorse e Altro. “Altro” apre un bottom sheet con le sole destinazioni secondarie reali — Economia, Statistiche e Impostazioni — insieme alle azioni account; la navigazione desktop resta separata e completa.

## Modalità dati

Armonia supporta due modalità tramite `NEXT_PUBLIC_DATA_MODE`:

- **Locale**: i dati applicativi persistono in `localStorage` tramite un envelope versionato; il formato storico non versionato viene migrato in lettura senza perdere le collezioni esistenti. I file dei materiali e il logo professionale sono conservati in object store IndexedDB separati. È presente un archivio locale separato per la connessione Google usata nello sviluppo.
- **Supabase**: autenticazione, entità applicative e relazioni sono gestite da Supabase; i file sono nel bucket privato `therapy-materials` e il logo professionale usa il bucket privato `professional-branding` dopo l'applicazione manuale della migration `009`. La connessione Google usa un token store server-side persistente.

Il `DataProvider` espone alla UI le stesse operazioni in entrambe le modalità. Supabase è attivo solo quando la configurazione pubblica è presente e la modalità non è impostata su `local`.

## Autenticazione e profilo

In modalità cloud l'accesso usa email e password Supabase, mantenendo invariati persistenza cookie e auto-refresh della libreria. Il bootstrap distingue caricamento, sessione valida, assenza confermata ed errore temporaneo: soltanto l'assenza confermata porta automaticamente al login, mentre un errore di verifica offre un retry controllato. `AuthGate` protegge le route operative; `/about`, `/privacy` e `/login` sono pubbliche. AUTH1 aggiunge inoltre una diagnostica temporanea esclusivamente client-side, limitata e priva di token o identificatori. Il profilo comprende nome, cognome, professione, email e studio/centro ed è persistente nel provider attivo.

## Funzionalità

### Branding professionale

Ogni professionista può usare un logo personale nelle stampe. L'immagine viene validata, ridimensionata proporzionalmente e normalizzata in WebP nel browser. In assenza del logo personale viene usato il marchio Armonia. Il logo non fa parte di `AppData`: resta isolato in IndexedDB locale o in Storage privato per utente.

### Pazienti

Creazione, ricerca, consultazione, modifica ed eliminazione. La scheda paziente è organizzata nelle sezioni Panoramica, Percorso, Attività e Risorse, con ruoli distinti. Panoramica rappresenta la situazione corrente usando soltanto fatti già registrati. Percorso è il contenitore dell'episodio terapeutico e riunisce valutazioni, obiettivi e una sintesi delle attività pertinenti, senza imporre un processo lineare. Le sedute sono attribuite conservativamente soltanto tramite obiettivi del percorso presenti in `Session.goalIds`/`session_goals`, senza un collegamento diretto aggiunto al modello. Attività presenta la cronologia clinica dettagliata aggregando sedute e valutazioni senza una tabella timeline dedicata, consente filtri e ricerca locale e mostra a richiesta i dettagli registrati. Risorse espone i materiali del paziente associati o usati di recente, aprendoli senza abbandonare il workspace; la gestione completa di appuntamenti e materiali resta rispettivamente nel Calendario e nella Libreria. Le differenze tecniche fra Assessment V1 e V2 restano interne e non diventano etichette del workspace.

L'anagrafica amministrativa A1 è completa. La fondazione A1A, attiva in produzione tramite la migration `021` con postflight PASS, mantiene separata dalla persona trattata l'anagrafica amministrativa corrente: un paziente può avere al massimo un record opzionale e un solo intestatario documenti corrente, coincidente con il paziente oppure con un'altra persona (`patient | other`). Tutti i campi sono facoltativi; `guardian` e `contact` non vengono interpretati o copiati automaticamente e la migration non esegue backfill. La UI A1B, collaudata manualmente, permette di inserire gli stessi dati tramite una sezione secondaria e collassabile durante creazione o modifica del paziente e di consultarli o modificarli successivamente dalla card in Panoramica. In modalità locale codice fiscale e indirizzi restano nel browser senza cifratura applicativa, quindi tale modalità non è il deposito raccomandato per dati clinici o fiscali reali. La futura E3 copierà questi valori in snapshot documentali immutabili; l'avatar paziente resta un futuro task UX separato.

### Appuntamenti e calendario

Gli appuntamenti supportano creazione, consultazione, modifica ed eliminazione. È possibile creare serie settimanali fino a una data inclusiva: ogni occorrenza è un normale appuntamento con ID proprio e un riferimento nullable comune alla serie. Modifica ed eliminazione agiscono sulla singola occorrenza. La pagina Calendario offre viste Mese, Settimana e Agenda usando la stessa sorgente dati. La vista scelta è memorizzata localmente. Gli appuntamenti alimentano anche la Dashboard Oggi.

Le fondamenta del Calendario V2 introducono cataloghi isolati per utente di sedi e prestazioni. Gli appuntamenti possono ricevere riferimenti opzionali e snapshot del nome, oltre al prezzo effettivo in centesimi; durata, prezzo e snapshot vengono materializzati sull'occorrenza per preservare lo storico anche quando il catalogo cambia. La migration `018` è applicata in produzione con postflight PASS. Un pannello “Impostazioni calendario” nella pagina Calendario permette di creare, modificare, disattivare, riattivare ed eliminare in sicurezza sedi e prestazioni; le Impostazioni generali restano riservate a profilo, branding e integrazioni account. Il form appuntamento integra sede, prestazione, durata e prezzo facoltativi: la selezione copia i valori correnti come snapshot, mentre le successive modifiche ai cataloghi non alterano lo storico. Le ricorrenze materializzano gli stessi valori su ogni occorrenza.

La UI delle sedi usa una palette applicativa controllata di dodici colori pastello moderatamente saturi e distinguibili, senza color picker libero. Il valore persistito resta un normale `#RRGGBB`. La Fase D1 usa il colore della sede come accento e tinta chiara nelle card di Mese, Settimana e Agenda; gli appuntamenti senza sede mantengono il fallback salvia. La vista settimanale dispone gli eventi temporalmente sovrapposti in colonne deterministiche, senza modificare dati o comportamento delle operazioni calendario.

La Fase D2 adatta questa UI agli schermi piccoli senza introdurre una nuova vista: il Mese mobile mostra tutti i sette giorni con indicatori e una lista del giorno selezionato; la Settimana conserva l'asse orario mostrando circa tre giorni alla volta con scroll-snap; toolbar, Agenda e card evento adottano densità responsive e rispettano la safe area della navigazione inferiore.

Armonia non fornisce listini o prezzi preimpostati. Il prezzo predefinito della prestazione è facoltativo e inizialmente vuoto: viene scelto esclusivamente dal professionista. Se valorizzato può essere copiato nell'appuntamento come prezzo effettivo per conservarne lo storico; `NULL` significa prezzo non specificato e `0` significa gratuito.

### Sedute

Le sedute possono essere create manualmente o a partire da un appuntamento, poi consultate, modificate o eliminate dalla timeline del paziente. Possono essere collegate a obiettivi e materiali e includono il piano per la seduta successiva.

La registrazione retroattiva conserva la data effettiva scelta. Il collegamento `appointmentId` impedisce di creare due sedute per lo stesso appuntamento e permette di modificare quella già registrata.

La fondazione economica E1 considera la `Session` come fonte storica della prestazione realmente erogata. Quando nasce da un appuntamento, servizio, nome e prezzo vengono copiati una sola volta; una seduta manuale o retrodatata può impostarli direttamente. Gli snapshot restano indipendenti da appuntamento e catalogo. Il prezzo nullable distingue dato non specificato (`NULL`) e gratuità (`0`), senza backfill delle sedute storiche.

### Economia

La pagina `/economia` mostra esclusivamente dati supportati dalle sedute: valore erogato nel mese, numero di prestazioni, prezzi mancanti e righe delle prestazioni svolte, con filtri locali per periodo, paziente e prestazione. Riusa il catalogo `appointment_services` in sola lettura e rimanda alla gestione già presente nel Calendario. E1 non gestisce pagamenti, crediti, incassi, fatture, proforma, dati fiscali o spese.

La fondazione E2A è implementata e la migration `020` è applicata in produzione con preflight e postflight superati, senza backfill di Payment o Allocation né variazioni ai dati economici E1. Il modello separa i movimenti realmente ricevuti (`Payment`) dalle quote attribuite alle sedute (`PaymentAllocation`); lo stato economico della seduta è derivato da prezzo e allocazioni attive, senza un flag duplicato. Sono supportati pagamenti cumulativi, parziali e credito non allocato per singolo paziente. Le correzioni annullano il movimento conservandone lo storico e richiedono un nuovo Payment. Le primitive cloud sono transazionali, mentre la modalità locale applica le stesse regole nel `DataProvider`. La presenza di storico economico blocca la cancellazione del paziente e dell'account Auth; un eventuale flusso completo di cancellazione o anonimizzazione dell'account dovrà essere deciso separatamente prima del lancio.

E2B è implementata e collaudata manualmente in locale. La pagina Economia distingue incassato e valore erogato e deriva pagato/parziale/non pagato/gratuito/prezzo non specificato. “Incassa” è il flusso semplice, completo o parziale, della singola prestazione; “Registra incasso” è il flusso generale per anticipi, entrate extra o pagamenti cumulativi, può distribuire una somma su più sedute e conservarne l'avanzo come credito disponibile, ma non crea automaticamente una Session. I Payment possono essere annullati, non eliminati, e restano nello storico; la scheda paziente mostra soltanto residuo, credito e numero di prestazioni da saldare. La stessa UI usa il `DataProvider` in modalità locale e le RPC E2A in cloud.

E3A è chiusa e usa il dominio esplicito `economic_documents`/`economic_document_lines`, inizialmente limitato alle proforma. Le migration 022 e 023 sono applicate in produzione. La diagnostica finale semplice ha verificato direttamente dal catalogo PostgreSQL le policy RLS delle righe, inclusi `USING` e `WITH CHECK` di UPDATE, tutti i CHECK foundation validati, trigger d'identità, FK composita e ACL; i dati preesistenti sono invariati e non è stata rilevata corruzione. I precedenti falsi negativi erano dovuti ai checker testuali troppo rigidi. E3B, inclusi E3B.1 ed E3B.2, è **CLOSED** e collaudata manualmente: `/economia` mantiene KPI e quick action in alto e usa tab Prestazioni, Pagamenti e Documenti; la stessa UI locale/cloud gestisce elenco, filtri e CRUD delle sole bozze proforma, copia selettivamente le Session in righe snapshot o accetta righe manuali, consente di correggere gli snapshot correnti e mostra un'anteprima A4 con logo opzionale. Le Impostazioni riuniscono senza duplicazioni campi Profile, `professional_document_details` e branding nell’area professionale dedicata. Le bozze non riservano le Session e una stessa Session può quindi essere usata in più draft; soltanto un documento `issued` non annullato la rende non eleggibile. Prezzi mancanti richiedono un importo esplicito e `0` resta gratuito. Il workflow non crea o modifica incassi.

E3C-A è chiusa: la migration `024` è applicata e validata in produzione e fornisce tentativi persistenti di emissione, numerazione annuale concorrente-safe `PF-AAAA-NNNN`, guardie RLS durante la prenotazione, RPC server-only reserve/upload/finalize/error/abandon/void e il bucket privato `economic-documents`. Il finalize ripete sotto lock il controllo che una Session non appartenga ad altri documenti `issued`; draft e voided non bloccano. Gli errori transitori mantengono tentativo, numero e path, mentre un abbandono esplicito libera la bozza senza riutilizzare il numero. E3C-B/C ed E3C.1 sono implementate localmente: route Next.js Node autenticate orchestrano emissione, signed download e voiding senza esporre service role; `@react-pdf/renderer` produce il PDF A4 dai soli snapshot, il logo WebP viene copiato immutato e convertito solo in memoria per il rendering, e ogni oggetto persistito viene verificato tramite hash e dimensione. Il nuovo proforma offre nello stesso editor Salva bozza oppure Emetti proforma: l'emissione salva internamente la draft una sola volta e usa lo stesso ID e tentativo nei retry. La UI rende issued/voided in sola lettura, apre il PDF definitivo e richiede un motivo per il void; gli stadi server sono diagnosticabili senza dati sensibili. I totali browser delle bozze non sono autoritativi e il workflow non modifica pagamenti. E3C resta implementata localmente in attesa di un nuovo collaudo end-to-end.

### Dashboard Oggi

La dashboard usa il collegamento reale tra appuntamenti e sedute. Gli appuntamenti odierni senza seduta sono mostrati in “Da fare oggi”; quelli con una seduta collegata in “Completati oggi”. L'appuntamento resta nello storico e nel calendario.

### Obiettivi

Gli obiettivi sono gestiti nella scheda paziente con stato, progresso e collegamento alle sedute. Possono essere associati facoltativamente a un unico Percorso clinico dello stesso paziente; restano la sola entità `Goal` e gli obiettivi non associati continuano a funzionare normalmente.

### Percorso clinico

La scheda paziente consente di avviare e chiudere percorsi clinici opzionali, consultare i percorsi storici, associare gli obiettivi esistenti e compilare valutazioni guidate. Il wizard V2 usa sei passaggi, payload multi-modulo, autosave debounced serializzato, ripresa delle bozze e completamento esplicito con successiva sola lettura. Le valutazioni V1 `language_communication` restano supportate senza conversione e il dispatch usa `schemaVersion`. Il repository Supabase supporta liste e operazioni miste V1/V2; per V2 `module_type` resta un discriminante V1 ed è `NULL`, mentre i moduli risiedono in `data.modules`.

### Materiali

La libreria supporta upload, apertura, modifica dei metadati, eliminazione, ricerca, filtri e preferiti. I materiali possono essere associati a pazienti e sedute. In locale i file restano in IndexedDB. La Libreria terapeutica V2 cloud usa file privati e URL temporanei, una quota configurabile per account (default 1 GB), un limite di 20 MB per file e una whitelist chiusa per PDF, PNG, JPEG, MP3, M4A, WAV e DOCX. Gli audio usano il player nativo; i DOCX sono solo scaricabili. I link esterni non usano Storage e non consumano quota.

La route `/risorse` è la home unificata del dominio: presenta la Libreria esistente con conteggio, quota cloud quando disponibile e materiali recenti reali, e introduce gli ingressi futuri per documenti clinici/professionali, strumenti clinici e Laboratorio esercizi. Queste tre aree sono shell dichiaratamente in preparazione e non espongono dati o funzioni simulate. `/materiali` resta la Libreria operativa completa e mantiene compatibilità con i link esistenti.

La Banca Asset ARMONIA è separata dai materiali personali: usa un catalogo editoriale statico e tipizzato in `data/armonia-assets`, immagini pubbliche curate in `public/armonia-assets/images` e un domain layer in `lib/asset-bank`. La V0.1 è image-first, read-only e parte con zero asset; provenienza, licenza dichiarata e revisione umana sono requisiti prima dell'approvazione. Il comando `npm run asset-bank:validate` verifica il catalogo senza attribuire automaticamente validità giuridica alle licenze.

La Banca Contenuti è un dominio static-first separato in `data/armonia-content` e `lib/content-bank`: descrive unità linguistiche riutilizzabili, mentre la Banca Asset descrive le loro possibili rappresentazioni. Ogni asset lessicale è proiettato come WordContent mantenendo la Banca Asset quale unica fonte canonica di fonologia e immagine. Il contrasto delle coppie discrimina esplicitamente `phoneme` e `gemination`, senza trattare singleton/doppia come fonemi diversi. Una coda separata contiene candidati `draft` non importati dalla UI o dai Mattoncini normali. Il primo livello Mattoncini vive separatamente in `lib/exercise-lab`: tre builder puri e read-only producono anteprime deterministiche per denominazione da immagine, coppie minime e ripetizione di parole/non-parole. Ricette, esercizi persistiti e compiti restano livelli successivi e distinti.

Il flusso V2 cloud separa preparazione autenticata, prenotazione atomica dei byte, upload diretto firmato a Supabase Storage e finalizzazione server idempotente con verifica del contenuto e commit transazionale di materiale e contatori. Un esito RPC ambiguo viene verificato rileggendo la reservation e non autorizza cleanup distruttivo. Le reservation scadute restano contabilizzate finché il backend non conferma l'assenza o la rimozione dell'oggetto. Le migration `014`, `015`, `016` e `017` sono applicate in produzione: il bucket è privato, applica il limite di 20 MiB e la whitelist MIME, le scritture sono server-side e `authenticated` conserva soltanto la lettura RLS su `materials`.

La migration additiva `017` rende atomico e idempotente per ID il salvataggio dei link, dei metadati e delle associazioni paziente. Il cutover finale e il collaudo reale post-cutover sono conclusi con esito positivo: upload, apertura, associazioni, eliminazione, quota e link esterni risultano operativi.

### Google Calendar

La sincronizzazione è unidirezionale da Armonia a Google Calendar per creazione, modifica ed eliminazione degli appuntamenti. Ogni occorrenza di una serie viene sincronizzata come evento Google separato tramite il proprio appointment ID, non come evento ricorrente Google. Armonia rimane la fonte principale; le modifiche manuali su Google non vengono importate.

OAuth richiede accesso offline e un refresh token. Viene usato un calendario secondario dedicato chiamato “Armonia” con scope `calendar.app.created`. Gli eventi sono privati e occupati, senza invitati o descrizione clinica; titolo e reminder sono configurabili nelle Impostazioni.

In locale i token sono conservati nel token store di sviluppo. In cloud sono previsti token cifrati e link di sincronizzazione nelle tabelle dedicate, accessibili solo server-side.

### Calendario ARMONIA sottoscrivibile

Il backend espone un feed iCalendar privato, read-only e indipendente da Google per Apple Calendar, Outlook e altri client compatibili. Armonia resta la fonte autorevole: ogni appuntamento è un `VEVENT` autonomo, le occorrenze ricorrenti mantengono i propri ID e non viene usato `RRULE`. Il feed espone soltanto orari e il titolo configurato, esclude appuntamenti annullati e dati clinici e usa un bearer token casuale conservato nel database come hash e ciphertext server-side. La migration `013` è stata applicata e verificata manualmente in produzione; la UI locale delle Impostazioni consente attivazione, scelta del titolo, copia/apertura del link, rotazione e disattivazione, ma non è ancora stata pubblicata.

### Statistiche

È presente una pagina con conteggi di sedute, pazienti attivi, obiettivi raggiunti e andamento recente.

## Supabase e deployment

Lo schema include profili, pazienti, appuntamenti, sedute, obiettivi, materiali e tabelle di relazione. Le migration `006` e `007` introducono percorsi e valutazioni cliniche; la `010`, applicata manualmente all'ambiente reale il 25/09/2026 e registrata nel repository, abilita in modo retrocompatibile la coesistenza V1/V2 senza convertire i record storici. La `008` prepara il collegamento opzionale degli obiettivi e va verificata separatamente nell'ambiente interessato. RLS e policy isolano i dati per utente. Il bucket `therapy-materials` è privato. Le migration `014`, `015`, `016` e `017` della Libreria terapeutica V2 sono applicate in produzione; reconciliation pre-cutover, postflight e collaudo reale post-cutover hanno avuto esito positivo. La migration additiva `019` è applicata in produzione con preflight/postflight PASS: 23 sedute prima e dopo, nessun backfill e fondazione database E1 attiva. Il codice applicativo E1 ha superato il collaudo manuale desktop/mobile e dei flussi seduta prima della pubblicazione.

Il repository contiene configurazione e istruzioni per il deploy su Vercel. Lo stato effettivo del deployment e delle migration applicate nei singoli ambienti non è deducibile dal solo repository e deve essere verificato prima di interventi cloud.

## Privacy e flussi server

L'audit privacy/data-flow è completato. Le risposte delle route `/api/**` e `/calendar/**`, incluse quelle autenticate o collegate a pazienti, usano esplicitamente `Cache-Control: private, no-store`. Il feed ICS conserva ETag e supporto `304`, ma non autorizza cache persistenti o condivise.

I log server di Google Calendar e della Libreria terapeutica usano una diagnostica ristretta a `stage`, codice sicuro e indicazione di retry. Non vengono intenzionalmente registrati nomi o identificatori di pazienti/appuntamenti/eventi, URL, path Storage, filename, token, request body, note o contenuti clinici. La regione UE delle Vercel Functions e l'eventuale riduzione futura dei flussi sanitari che attraversano Vercel restano valutazioni infrastrutturali separate.

## Principi architetturali

- Una sola API dati condivisa dalla UI, con implementazioni locale e Supabase.
- Armonia è la fonte principale degli appuntamenti anche quando Google Calendar è collegato.
- Persistenza locale completa per lo sviluppo senza Supabase.
- Operazioni cloud protette da autenticazione, RLS e isolamento per utente.
- File privati aperti tramite URL temporanei, non tramite link pubblici permanenti.
- Quota cloud autorevole e prenotata atomicamente prima degli upload; il browser non riceve mai credenziali service role né sceglie liberamente path o utente.
- Modifiche al database additive e retrocompatibili, applicate manualmente.
- La prestazione erogata e il relativo valore storico appartengono alla seduta; appuntamento e catalogo sono soltanto fonti iniziali e non restano collegati in modo live.
- Risposte server sensibili non memorizzabili e diagnostica priva di identificatori clinici intenzionali.
- Il restyling UX/UI trasversale dell'app è pianificato come fase pre-lancio separata dai blocchi funzionali già conclusi.
