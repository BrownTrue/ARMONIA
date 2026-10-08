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

Su mobile la shell usa un header sticky minimale con titolo contestuale e un menu laterale accessibile. Il drawer riunisce le destinazioni primarie — Oggi, Calendario, Pazienti e Risorse — e quelle secondarie — Economia, Statistiche e Impostazioni — con identità account e logout; la precedente bottom bar non è più presente. Desktop e mobile condividono lo stesso modello di navigazione, mentre la shell desktop conserva struttura e aspetto esistenti.

MOBILE 6 applica lo stesso principio a Economia e Impostazioni. Economia usa gli stessi dataset, calcoli, validation e repository del desktop, ricomponendo per telefono filtri, form Pagamento e flusso Proforma senza creare operazioni mobile parallele. Impostazioni usa un indice e singole superfici indirizzabili con `?section=`, ma riutilizza i form e le operazioni reali di profilo professionale, branding, Google Calendar, feed ARMONIA, sicurezza account ed export. Impostazioni Editorial V1 riusa lo stesso indirizzamento da 1024 px per una navigazione laterale e un pannello selezionato; tutte le aree rimangono montate per preservare stato e operazioni, senza logiche di salvataggio parallele. Il menu resta sticky sotto la toolbar desktop; Calendari raggruppa intestazione e pannello Google mantenendo il feed ARMONIA come card separata. Tablet 768–1023 px e mobile mantengono la presentazione precedente.

Calendar V3 è il calendario canonico su `/calendario`, resta dentro l'AppShell desktop con navigazione principale sempre disponibile e usa direttamente `DataProvider`, Appointment e Session esistenti; il lab non indicizzato conserva soltanto fixture e strumenti di sviluppo. La shell web include manifest standalone, metadata iOS, icone 192/512, viewport dinamico e safe area, senza introdurre caching offline di dati clinici. Le capability native di condivisione e installazione restano progressive enhancement: apertura e download devono continuare a funzionare quando non sono disponibili.

## Modalità dati

Armonia supporta due modalità tramite `NEXT_PUBLIC_DATA_MODE`:

- **Locale**: i dati applicativi persistono in `localStorage` tramite un envelope versionato; il formato storico non versionato viene migrato in lettura senza perdere le collezioni esistenti. I file dei materiali e il logo professionale sono conservati in object store IndexedDB separati. È presente un archivio locale separato per la connessione Google usata nello sviluppo.
- **Supabase**: autenticazione, entità applicative e relazioni sono gestite da Supabase; i file sono nel bucket privato `therapy-materials` e il logo professionale usa il bucket privato `professional-branding` dopo l'applicazione manuale della migration `009`. La connessione Google usa un token store server-side persistente.

Il `DataProvider` espone alla UI le stesse operazioni in entrambe le modalità. Supabase è attivo solo quando la configurazione pubblica è presente e la modalità non è impostata su `local`.

## Autenticazione e profilo

In modalità cloud l'accesso usa email e password Supabase, mantenendo invariati persistenza cookie e auto-refresh della libreria. Il middleware Next aggiorna la sessione SSR tramite cookie e `getUser()`, protegge le pagine operative prima del rendering e conserva una destinazione interna sicura per i deep link; API, callback Google e feed Calendar restano fuori dal matcher e mantengono la propria autenticazione. `/about`, `/privacy`, `/login`, `/signup` e le pagine tecniche della conferma email sono pubbliche, mentre `/` instrada a login oppure Oggi in base alla sessione. La registrazione usa direttamente Supabase Auth, il trigger `on_auth_user_created` resta l'unica fonte del Profile e la callback PKCE dedicata accetta esclusivamente destinazioni interne validate; resend ed errori sono presentati senza dettagli tecnici o enumerazione affidabile degli account. Il bootstrap AUTH1 e `AuthGate` restano come fallback client, senza trasformare un errore transitorio in logout. La modalità locale bypassa i flussi account e continua ad aprire l'app senza login. La diagnostica temporanea resta esclusivamente client-side, limitata e priva di token o identificatori. L'email Auth e l'eventuale email professionale del profilo restano concettualmente distinte.

## Funzionalità

### Branding professionale

Ogni professionista può usare un logo personale nelle stampe. L'immagine viene validata, ridimensionata proporzionalmente e normalizzata in WebP nel browser. In assenza del logo personale viene usato il marchio Armonia. Il logo non fa parte di `AppData`: resta isolato in IndexedDB locale o in Storage privato per utente.

Le azioni browser sui documenti usano una foundation leggera distinta dai generatori e dal dominio: una sorgente può essere un Blob client-side oppure un URL già autorizzato (route autenticata, risorsa ufficiale o file statico), mentre apertura, condivisione con feature detection, download e stampa/fallback restano capability della superficie. MOBILE 5A/5B applica la stessa gerarchia mobile alle attestazioni Blob, agli handout statici, ai PDF della Libreria Materiali e ai PDF autenticati degli strumenti originali ARMONIA. MOBILE 5C.1 la riusa per generare nel browser PDF A4 reali delle Worksheet. MOBILE 5C.2 applica la stessa pipeline alle Valutazioni cliniche V1/V2: `ClinicalAssessment` resta la source of truth, un modello stampabile condiviso alimenta HTML e React PDF e ogni modulo V2 contribuisce tramite il proprio contratto nel registry, senza hardcoding nel renderer centrale. Schede e Valutazioni producono Blob temporanei sul dispositivo e conservano la stampa HTML desktop. Le route private vengono trasformate in file solo sul dispositivo e non sono condivise come URL; i link esterni restano presso la fonte ufficiale. Non vengono introdotti upload esterni, URL pubblici per asset privati, persistenza, PWA o un nuovo sistema documentale.

### Pazienti

Creazione, ricerca, consultazione, modifica ed eliminazione. La scheda paziente è organizzata nelle sezioni Panoramica, Percorso, Attività e Risorse, con ruoli distinti. Panoramica rappresenta la situazione corrente usando soltanto fatti già registrati. Percorso è il contenitore dell'episodio terapeutico e riunisce valutazioni, obiettivi e una sintesi delle attività pertinenti, senza imporre un processo lineare. Le sedute sono attribuite conservativamente soltanto tramite obiettivi del percorso presenti in `Session.goalIds`/`session_goals`, senza un collegamento diretto aggiunto al modello. Attività presenta la cronologia clinica dettagliata aggregando sedute e valutazioni senza una tabella timeline dedicata, consente filtri e ricerca locale e mostra a richiesta i dettagli registrati. Risorse espone materiali associati/usati e Schede paziente concrete create nel Laboratorio, riapribili, modificabili, stampabili e duplicabili; la gestione completa resta nei rispettivi domini. Le differenze tecniche fra Assessment V1 e V2 restano interne e non diventano etichette del workspace.

L'anagrafica amministrativa A1 è completa. La fondazione A1A, attiva in produzione tramite la migration `021` con postflight PASS, mantiene separata dalla persona trattata l'anagrafica amministrativa corrente: un paziente può avere al massimo un record opzionale e un solo intestatario documenti corrente, coincidente con il paziente oppure con un'altra persona (`patient | other`). Tutti i campi sono facoltativi; `guardian` e `contact` non vengono interpretati o copiati automaticamente e la migration non esegue backfill. La UI A1B, collaudata manualmente, permette di inserire gli stessi dati tramite una sezione secondaria e collassabile durante creazione o modifica del paziente e di consultarli o modificarli successivamente dalla card in Panoramica. In modalità locale codice fiscale e indirizzi restano nel browser senza cifratura applicativa, quindi tale modalità non è il deposito raccomandato per dati clinici o fiscali reali. La futura E3 copierà questi valori in snapshot documentali immutabili; l'avatar paziente resta un futuro task UX separato.

### Appuntamenti e calendario

Gli appuntamenti supportano creazione, consultazione, modifica ed eliminazione. È possibile creare serie settimanali fino a una data inclusiva: ogni occorrenza è un normale appuntamento con ID proprio e un riferimento nullable comune alla serie. Modifica ed eliminazione agiscono sulla singola occorrenza. La pagina Calendario offre viste Mese, Settimana e Agenda usando la stessa sorgente dati. La vista scelta è memorizzata localmente. Gli appuntamenti alimentano anche la Dashboard Oggi.

Le fondamenta del Calendario V2 introducono cataloghi isolati per utente di sedi e prestazioni. Gli appuntamenti possono ricevere riferimenti opzionali e snapshot del nome, oltre al prezzo effettivo in centesimi; durata, prezzo e snapshot vengono materializzati sull'occorrenza per preservare lo storico anche quando il catalogo cambia. La migration `018` è applicata in produzione con postflight PASS. Un pannello “Impostazioni calendario” nella pagina Calendario permette di creare, modificare, disattivare, riattivare ed eliminare in sicurezza sedi e prestazioni; le Impostazioni generali restano riservate a profilo, branding e integrazioni account. Il form appuntamento integra sede, prestazione, durata e prezzo facoltativi: la selezione copia i valori correnti come snapshot, mentre le successive modifiche ai cataloghi non alterano lo storico. Le ricorrenze materializzano gli stessi valori su ogni occorrenza.

La UI delle sedi usa una palette applicativa controllata di dodici colori pastello moderatamente saturi e distinguibili, senza color picker libero. Il valore persistito resta un normale `#RRGGBB`. La Fase D1 usa il colore della sede come accento e tinta chiara nelle card di Mese, Settimana e Agenda; gli appuntamenti senza sede mantengono il fallback salvia. La vista settimanale dispone gli eventi temporalmente sovrapposti in colonne deterministiche, senza modificare dati o comportamento delle operazioni calendario.

La stessa palette è disponibile anche per le Prestazioni, con colore facoltativo. Un colore valido della Prestazione prevale automaticamente in tutte le viste; in sua assenza resta il colore della Sede e, se manca anche quello, il fallback salvia. Le nuove Prestazioni non ricevono colori automatici e i record legacy restano quindi visivamente invariati. La migration additiva `030_calendar_service_colors.sql` è applicata; la colonna `profiles.calendar_color_mode` resta compatibile ma è intenzionalmente inutilizzata dall'interfaccia e dal rendering.

Nel Calendar V3 la gestione quotidiana di Sedi e Prestazioni è integrata direttamente nella sidebar: le righe mantengono la funzione di filtro e usano un controllo distinto per aprire un editor compatto nello stesso spazio. La UI riusa dominio, palette, validazione e operazioni del `DataProvider`; non introduce una fonte dati o un modello parallelo. I valori predefiniti di una Prestazione sono copiati soltanto quando viene selezionata per un nuovo Appointment, mentre gli Appointment già materializzati conservano i propri snapshot storici.

Il ciclo di vita del catalogo distingue inoltre disattivazione temporanea, archiviazione e cancellazione definitiva. Un elemento archiviato resta caricato per preservare riferimenti, nomi e colori storici, ma scompare dalle selezioni e dalle viste operative; il ripristino futuro non lo riattiverà automaticamente. L'hard delete resta riservato agli elementi mai referenziati. La migration additiva `033_calendar_catalog_archiving.sql` prepara questa semantica e una guardia concorrente lato database, ma deve essere revisionata e applicata manualmente prima del collaudo cloud.

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

La route `/risorse` è la home unificata del dominio: presenta la Libreria esistente con conteggio, quota cloud quando disponibile e materiali recenti reali. “Modulistica e handout” V1 espone quattro PDF statici ARMONIA pronti per anteprima e download e due generatori professionali. L'attestazione di presenza usa soltanto Patient, Session registrata, dati professionali e l'eventuale Appointment collegato per precompilare ora e sede. L'attestazione di percorso usa Patient e ClinicalPathway per attestare esclusivamente stato e periodo, senza importare contenuti clinici. Entrambe generano anteprima e PDF A4 client-side senza database, Storage o storico. Strumenti clinici è una directory static-first di 45 strumenti revisionati, inclusi sette originali ARMONIA con materiali autenticati, mentre il Laboratorio esercizi è operativo e presenta quattro ingressi comprensibili: Crea nuova scheda, Modelli di scheda, Attività salvate e Banca contenuti. `/materiali` resta la Libreria operativa completa e mantiene compatibilità con i link esistenti.

La directory Strumenti clinici conserva nel repository metadata clinici, popolazione, disponibilità italiana, fonti e stato dei diritti. Include inoltre sette strumenti originali ARMONIA V1 non standardizzati: i materiali reali sono asset privati del deploy e vengono aperti o scaricati esclusivamente tramite route autenticata, senza renderli URL pubblici. Da Clinical Assessment V2 il professionista può selezionare uno strumento e salvarne uno snapshot minimo oppure continuare con l’inserimento manuale. Italian QAB resta l'unico strumento nativo: usa contenuto canonico per tre moduli, 18 carte ufficiali, stop rule esplicite e scoring ufficiale senza classificazione automatica di gravità. Risposte e stato restano nel JSONB della valutazione e usano il suo autosave; il timer è soltanto un ausilio visivo e non assegna punteggi. Gli altri strumenti restano catalogo, materiali autenticati o collegamenti esterni; partnership e marketplace non fanno parte della V1.

La Banca Asset ARMONIA è separata dai materiali personali: usa un catalogo editoriale statico e tipizzato in `data/armonia-assets`, immagini pubbliche curate in `public/armonia-assets/images` e un domain layer in `lib/asset-bank`. La V0.1 è image-first, read-only e parte con zero asset; provenienza, licenza dichiarata e revisione umana sono requisiti prima dell'approvazione. Il comando `npm run asset-bank:validate` verifica il catalogo senza attribuire automaticamente validità giuridica alle licenze.

La Banca Contenuti è un dominio static-first separato in `data/armonia-content` e `lib/content-bank`: descrive unità linguistiche riutilizzabili, mentre la Banca Asset descrive le loro possibili rappresentazioni. Il Laboratorio segue internamente la catena `Banca Contenuti → Brick → Exercise Block → Worksheet → Print Renderer`: cinque builder puri e read-only producono selezioni per denominazione, coppie minime, ripetizione, comprensione e lettura di frasi. Il modello di stampa condiviso alimenta sia la vista HTML/stampa desktop sia il renderer PDF A4 client-side, includendo asset locali, ordine dei blocchi e paginazione multipla. La UI traduce questo modello in termini professionali: Attività, Attività salvate, Modelli di scheda e Schede. I nomi `ExerciseRecipeV1`, `WorksheetDraft` e relativi nomi DB restano invariati. Le migration `026`, `027` e `028` sono applicate. Schede paziente V1 congela una Worksheet concreta per un paziente e riusa editor, stampa e PDF esistenti: il Laboratorio generale permette di scegliere un paziente e creare una nuova scheda, il contesto proveniente dalle Risorse preimposta il paziente e una scheda esistente viene aggiornata sullo stesso ID. Anteprima, salvataggio per il paziente e modello riutilizzabile hanno gerarchie UX distinte; validazione inline, spiegazioni per CTA incomplete e conferme applicative proteggono le operazioni senza cambiare il dominio. L'assegnazione a casa è un metadato opzionale sulla stessa scheda, non un nuovo dominio: la migration additiva `029` è in attesa di review/applicazione manuale. Scadenze, completamento, reminder, scoring e un eventuale dominio Homework restano evoluzioni future separate.

Il flusso V2 cloud separa preparazione autenticata, prenotazione atomica dei byte, upload diretto firmato a Supabase Storage e finalizzazione server idempotente con verifica del contenuto e commit transazionale di materiale e contatori. Un esito RPC ambiguo viene verificato rileggendo la reservation e non autorizza cleanup distruttivo. Le reservation scadute restano contabilizzate finché il backend non conferma l'assenza o la rimozione dell'oggetto. Le migration `014`, `015`, `016` e `017` sono applicate in produzione: il bucket è privato, applica il limite di 20 MiB e la whitelist MIME, le scritture sono server-side e `authenticated` conserva soltanto la lettura RLS su `materials`.

La migration additiva `017` rende atomico e idempotente per ID il salvataggio dei link, dei metadati e delle associazioni paziente. Il cutover finale e il collaudo reale post-cutover sono conclusi con esito positivo: upload, apertura, associazioni, eliminazione, quota e link esterni risultano operativi.

### Google Calendar

La sincronizzazione è unidirezionale da Armonia a Google Calendar per creazione, modifica ed eliminazione degli appuntamenti. Ogni occorrenza di una serie viene sincronizzata come evento Google separato tramite il proprio appointment ID, non come evento ricorrente Google. Armonia rimane la fonte principale; le modifiche manuali su Google non vengono importate.

OAuth richiede accesso offline e un refresh token. Viene usato un calendario secondario dedicato chiamato “Armonia” con scope `calendar.app.created`. Gli eventi sono privati e occupati, senza invitati o descrizione clinica; titolo e reminder sono configurabili nelle Impostazioni.

In locale i token sono conservati nel token store di sviluppo. In cloud sono previsti token cifrati e link di sincronizzazione nelle tabelle dedicate, accessibili solo server-side.

### Calendario ARMONIA sottoscrivibile

Il backend espone un feed iCalendar privato, read-only e indipendente da Google per Apple Calendar, Outlook e altri client compatibili. Armonia resta la fonte autorevole: ogni appuntamento è un `VEVENT` autonomo, le occorrenze ricorrenti mantengono i propri ID e non viene usato `RRULE`. Il feed espone soltanto orari e il titolo configurato, esclude appuntamenti annullati e dati clinici e usa un bearer token casuale conservato nel database come hash e ciphertext server-side. La migration `013` è stata applicata e verificata manualmente in produzione; la UI locale delle Impostazioni consente attivazione, scelta del titolo, copia/apertura del link, rotazione e disattivazione, ma non è ancora stata pubblicata.

### Statistiche

Statistiche V2 offre una sintesi operativa filtrabile per periodo: sedute registrate, ore lavorate, pazienti seguiti, giorni lavorati, andamento temporale, prestazioni, stato dell'agenda, pazienti ed economia. Le metriche di attività usano le Session realmente registrate e non inferiscono outcome clinici. In cloud la pagina usa un reader Supabase dedicato, paginato e limitato ai soli campi necessari di sedute, appuntamenti, pazienti, pagamenti e catalogo prestazioni; in locale applica le stesse formule all'`AppData` normalizzato.

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
## Esportazione dati utente

ARMONIA offre un export portabile client-side in CSV/JSON e ZIP. L'export comprende dati professionali, pazienti, agenda, sedute, clinica, economia, schede e metadati dei materiali; non comprende binari Storage, segreti delle integrazioni o funzioni di ripristino.
# Auth e sicurezza account

ARMONIA cloud supporta registrazione con verifica email, recupero password e cambio password autenticato. La policy password è applicativa e condivisa; il recupero usa una callback PKCE dedicata, non espone l’esistenza degli account e richiede un nuovo login dopo il reset. La modalità locale non simula account o recuperi password.
# Onboarding account cloud

I nuovi account cloud completano una sola configurazione professionale essenziale prima di accedere al gestionale. Lo stato canonico è `profiles.onboarding_completed_at`; i dati restano nello stesso Profile modificabile dalle Impostazioni. La guard applicativa riusa il bootstrap dati esistente, mentre autenticazione e protezione anonima restano nel middleware. Gli account storici sono esclusi tramite backfill e la modalità locale non simula onboarding cloud.
