# QAB italiano V1 — Clinical review pack

Documento per la revisione clinico-editoriale finale della sorgente canonica ARMONIA.

## Fonti e convenzioni

- **PDF Scoresheet:** fonte canonica di testi, consegne, target, score consentiti e stop rule.
- **PDF Stimulus Cards:** fonte canonica degli stimoli e dell’associazione fra modulo, carta e sezione.
- **Workbook Excel:** fonte canonica esclusivamente di formule, aggregazioni e pesi.
- Gli ID interni sono stabili e non dipendono dalla posizione nell’array.
- Le carte ufficiali non sono ancora incluse nel repository: tutti i record hanno `assetAvailable = no`.

## Regole generali di somministrazione

1. Fornire 6 secondi per la risposta in ogni sezione; una risposta corretta dopo 3 secondi è una latenza e riceve 3 punti.
2. Valutare il materiale prodotto nei primi 6 secondi, salvo una risposta iniziata prima dei 6 secondi e poi continuata.
3. Valutare la prima risposta completa, non una falsa partenza o un frammento.
4. Gli item verbali possono essere ripetuti una volta su richiesta o per sospetta mancata comprensione/concentrazione; dopo la ripetizione il conteggio riparte da zero.
5. Gli errori da disartria o aprassia articolatoria che non alterano l’identificazione dei fonemi possono essere ignorati, eccetto nella valutazione del linguaggio motorio.

# MODULO 1

## 1. Consapevolezza

Consegna generale: valutare stabilità, veglia, orientamento, comprensione delle istruzioni e impressione complessiva secondo lo scoresheet ufficiale.

| ID interno | Consegna / target | Score ammessi | Placeholder / seguito | Stop rule | Carta |
|---|---|---|---|---|---|
| `qab1-awareness-a` | Il/la paziente è sufficientemente e clinicamente stabile per essere avvicinato/a? | 0, 4 | — | 0 → non continuare | — |
| `qab1-awareness-b` | Il/la paziente può rimanere sveglio/a? | 0, 1, 2, 3, 4 | — | 0/1 → non continuare | — |
| `qab1-awareness-c` | Puoi dirmi dove siamo adesso? | 0, 1, 2, 3, 4 | Posto esatto; biblioteca; cortile per la ricreazione; posto esatto | — | — |
| `qab1-awareness-d` | Puoi dirmi che mese è? | 0, 1, 2, 3, 4 | Mese esatto; due mesi inesatti | — | — |
| `qab1-awareness-e` | Quanti anni hai? | 0, 1, 2, 3, 4 | Età esatta; due età inesatte | — | — |
| `qab1-awareness-f` | Chiudi gli occhi. | 0, 1, 3, 4 | Se necessario: modello e «Adesso tocca a te» | — | — |
| `qab1-awareness-g` | Stringimi la mano. | 0, 1, 3, 4 | Se necessario: modello e «Adesso tocca a te» | — | — |
| `qab1-awareness-h` | Il/la paziente è in grado di rimanere sveglio, mantenere l’attenzione e seguire le istruzioni? | 0, 1, 2, 3, 4 | — | 0/1/2 → non continuare | — |

## 2. Eloquio spontaneo

Consegna: conversare per almeno tre minuti; mostrare la **carta 1** e chiedere «Che cosa succede qui?». Considerare anche altro eloquio spontaneo prodotto durante la valutazione.

### Prompt conversazionali

- il viaggio preferito che hai fatto;
- il viaggio peggiore che hai fatto;
- quando ti sei sposato/a;
- la tua festa preferita da bambino;
- un ricordo felice dell’infanzia;
- il tuo primo lavoro;
- il ricordo peggiore dell’infanzia;
- quando hai avuto il primo figlio;
- come hai incontrato tuo marito, o tua moglie, o il tuo compagno/a;
- quando sei andato/a in pensione;
- cosa ti piace del posto in cui vivi;
- un episodio in cui hai avuto paura, sei stato/a in imbarazzo o ti sei arrabbiato/a.

Scene della carta 1:

- L’uomo spinge la donna.
- La donna insegue l’uomo.

| ID interno | Dimensione valutata | Score ammessi | Carta |
|---|---|---|---|
| `qab1-spontaneous-speech-a` | Enunciati di lunghezza e complessità ridotta | 0–4 | 1 |
| `qab1-spontaneous-speech-b` | Ridotta velocità di produzione (WPM) | 0–4 | 1 |
| `qab1-spontaneous-speech-c` | Discorso telegrafico / agrammatismo | 0–4 | 1 |
| `qab1-spontaneous-speech-d` | Paragrammatismo | 0–4 | 1 |
| `qab1-spontaneous-speech-e` | Anomia | 0–4 | 1 |
| `qab1-spontaneous-speech-f` | Discorso privo di significato | 0–4 | 1 |
| `qab1-spontaneous-speech-g` | Parafasie semantiche | 0–4 | 1 |
| `qab1-spontaneous-speech-h` | Parafasie fonemiche e neologismi | 0–4 | 1 |
| `qab1-spontaneous-speech-i` | Correzioni spontanee | 0–4 | 1 |
| `qab1-spontaneous-speech-j` | Compromissione globale della comunicazione | 0–4 | 1 |

Opzioni **non valutabile**:

- Assenza di linguaggio spontaneo.
- Solo stereotipie.
- Solo un incomprensibile borbottio.
- Meno di 10 parole al minuto, per lo più sì/no, singole parole o tentativi.

## 3. Comprensione parole

Consegna: «Mostrami il/la…». Carta 2 per gli item semantici; carta 3 per gli item fonologici. Score ammessi per tutti gli item: **0, 1, 3, 4**.

| ID interno | Target | Distrattori correlati | Carta |
|---|---|---|---|
| `qab1-word-comprehension-a` | leone | giraffa, cavallo | 2 |
| `qab1-word-comprehension-b` | tamburo | violino, trombone | 2 |
| `qab1-word-comprehension-c` | violino | tamburo, trombone | 2 |
| `qab1-word-comprehension-d` | giraffa | leone, cavallo | 2 |
| `qab1-word-comprehension-e` | spalla | palla | 3 |
| `qab1-word-comprehension-f` | naso | vaso, raso | 3 |
| `qab1-word-comprehension-g` | pala | palla | 3 |
| `qab1-word-comprehension-h` | raso | vaso, naso | 3 |

## 4. Comprensione frasi

Consegna: iniziare ogni frase con «Rispondi sì o no». Score ammessi: **0, 1, 2, 3, 4**. Carta associata: **4**.

| ID interno | Consegna | Risposta attesa | Placeholder dinamico |
|---|---|---|---|
| `qab1-sentence-comprehension-a` | Sei [uomo/donna]? | Sì | Uomo/donna del paziente |
| `qab1-sentence-comprehension-b` | Sono [uomo/donna]? | No | Uomo/donna dell’esaminatore |
| `qab1-sentence-comprehension-c` | Si taglia l’erba con l’ascia? | No | — |
| `qab1-sentence-comprehension-d` | I bambini sono sorvegliati dalla babysitter? | Sì | — |
| `qab1-sentence-comprehension-e` | Apri la porta di casa con una chiave? | Sì | — |
| `qab1-sentence-comprehension-f` | Se stai per uscire, sei già uscito? | No | — |
| `qab1-sentence-comprehension-g` | I testimoni vengono interrogati dalla polizia? | Sì | — |
| `qab1-sentence-comprehension-h` | Se dico che fumavo, pensi che io fumi adesso? | No | — |
| `qab1-sentence-comprehension-i` | I medici vengono curati dai pazienti? | No | — |
| `qab1-sentence-comprehension-j` | Se ero al parco quando siete arrivati, sono arrivato prima? | Sì | — |
| `qab1-sentence-comprehension-k` | Se stai per salire al piano di sopra, sei ancora al piano di sotto? | Sì | — |
| `qab1-sentence-comprehension-l` | I gatti sono inseguiti dai topi? | No | — |

## 5. Denominazione

Consegna: mostrare la **carta 5** e chiedere «Cos’è questo? E questo?». Score ammessi: **0–4**.

| ID interno | Target |
|---|---|
| `qab1-naming-a` | cane |
| `qab1-naming-b` | matita |
| `qab1-naming-c` | carrozzina |
| `qab1-naming-d` | polpo |
| `qab1-naming-e` | amaca |
| `qab1-naming-f` | ascensore |

## 6. Ripetizione

Consegna: «Ripeti dopo di me». Score ammessi: **0–4**. Nessuna carta associata.

| ID interno | Target |
|---|---|
| `qab1-repetition-a` | se |
| `qab1-repetition-b` | treno |
| `qab1-repetition-c` | monociclo |
| `qab1-repetition-d` | rilevabile |
| `qab1-repetition-e` | Il sole sorge ad oriente. |
| `qab1-repetition-f` | Il bravo giornalista scoprì dov’erano andati. |

## 7. Lettura

Consegna: mostrare la **carta 6** e dire «Leggi queste parole e frasi ad alta voce». Score ammessi: **0–4**.

| ID interno | Target |
|---|---|
| `qab1-reading-a` | la |
| `qab1-reading-b` | quota |
| `qab1-reading-c` | lavatrice |
| `qab1-reading-d` | disordinato |
| `qab1-reading-e` | Il bambino piange di notte. |
| `qab1-reading-f` | Il romanziere capì perché avevo chiamato. |

## 8. Articolazione / Fonazione

Compiti: lingua da una parte all’altra; `aaaaaah` fino a 15 secondi; `pʌ pʌ pʌ pʌ pʌ`; `pʌtʌkʌ pʌtʌkʌ pʌtʌkʌ`; contare fino a 10. Nessuna carta associata.

| ID interno | Valutazione complessiva | Score ammessi |
|---|---|---|
| `qab1-motor-speech-a` | Disartria | 0–4 |
| `qab1-motor-speech-b` | Aprassia articolatoria | 0–4 |

# MODULO 2

## 1. Consapevolezza

| ID interno | Consegna / target | Score ammessi | Placeholder / seguito | Stop rule |
|---|---|---|---|---|
| `qab2-awareness-a` | Il/la paziente è sufficientemente e clinicamente stabile per essere avvicinato/a? | 0, 4 | — | 0 |
| `qab2-awareness-b` | Il/la paziente può rimanere sveglio/a? | 0–4 | — | 0/1 |
| `qab2-awareness-c` | Puoi dirmi dove siamo adesso? | 0–4 | Posto esatto; biblioteca; cortile; posto esatto | — |
| `qab2-awareness-d` | Puoi dirmi che mese è? | 0–4 | Mese esatto; due mesi inesatti | — |
| `qab2-awareness-e` | Quanti anni hai? | 0–4 | Età esatta; due età inesatte | — |
| `qab2-awareness-f` | Chiudi gli occhi. | 0, 1, 3, 4 | Modello e «Adesso tocca a te» | — |
| `qab2-awareness-g` | Stringimi la mano. | 0, 1, 3, 4 | Modello e «Adesso tocca a te» | — |
| `qab2-awareness-h` | Il/la paziente è in grado di rimanere sveglio, mantenere l’attenzione e seguire le istruzioni? | 0–4 | — | 0/1/2 |

## 2. Eloquio spontaneo

I prompt conversazionali e le opzioni non valutabile sono quelli elencati nel Modulo 1.

Scene della **carta 1**:

- L’uomo lava la donna.
- La donna prende a calci l’uomo.

| ID interno | Dimensione valutata | Score | Carta |
|---|---|---|---|
| `qab2-spontaneous-speech-a` | Enunciati di lunghezza e complessità ridotta | 0–4 | 1 |
| `qab2-spontaneous-speech-b` | Ridotta velocità di produzione (WPM) | 0–4 | 1 |
| `qab2-spontaneous-speech-c` | Discorso telegrafico / agrammatismo | 0–4 | 1 |
| `qab2-spontaneous-speech-d` | Paragrammatismo | 0–4 | 1 |
| `qab2-spontaneous-speech-e` | Anomia | 0–4 | 1 |
| `qab2-spontaneous-speech-f` | Discorso privo di significato | 0–4 | 1 |
| `qab2-spontaneous-speech-g` | Parafasie semantiche | 0–4 | 1 |
| `qab2-spontaneous-speech-h` | Parafasie fonemiche e neologismi | 0–4 | 1 |
| `qab2-spontaneous-speech-i` | Correzioni spontanee | 0–4 | 1 |
| `qab2-spontaneous-speech-j` | Compromissione globale della comunicazione | 0–4 | 1 |

## 3. Comprensione parole

Score ammessi: **0, 1, 3, 4**.

| ID interno | Target | Distrattori correlati | Carta |
|---|---|---|---|
| `qab2-word-comprehension-a` | chitarra | sassofono, arpa | 2 |
| `qab2-word-comprehension-b` | tigre | zebra, asino | 2 |
| `qab2-word-comprehension-c` | zebra | tigre, asino | 2 |
| `qab2-word-comprehension-d` | sassofono | chitarra, arpa | 2 |
| `qab2-word-comprehension-e` | duna | luna | 3 |
| `qab2-word-comprehension-f` | petto | tetto, letto | 3 |
| `qab2-word-comprehension-g` | letto | tetto, petto | 3 |
| `qab2-word-comprehension-h` | lana | luna | 3 |

## 4. Comprensione frasi

Consegna: «Rispondi sì o no». Score ammessi: **0–4**. Carta associata: **4**.

| ID interno | Consegna | Attesa | Placeholder |
|---|---|---|---|
| `qab2-sentence-comprehension-a` | Sei [seduto/sdraiato/etc.]? | Sì | Posizione del paziente |
| `qab2-sentence-comprehension-b` | Sono [seduto/sdraiato/etc.]? | No | Posizione dell’esaminatore |
| `qab2-sentence-comprehension-c` | Mangi il gelato con un cucchiaio? | Sì | — |
| `qab2-sentence-comprehension-d` | I ragni sono morsi dalle persone? | No | — |
| `qab2-sentence-comprehension-e` | Indossi i guanti ai piedi? | No | — |
| `qab2-sentence-comprehension-f` | Se stai per uscire, sei ancora dentro? | Sì | — |
| `qab2-sentence-comprehension-g` | I vermi vengono mangiati dagli uccelli? | Sì | — |
| `qab2-sentence-comprehension-h` | Se ti dico che facevo esercizio fisico, pensi che lo faccia adesso? | No | — |
| `qab2-sentence-comprehension-i` | I bambini vengono fatti nascere da medici? | Sì | — |
| `qab2-sentence-comprehension-j` | Se stai per iniziare, hai già iniziato? | No | — |
| `qab2-sentence-comprehension-k` | I genitori sono cresciuti dai figli? | No | — |
| `qab2-sentence-comprehension-l` | Se eri alla festa quando sono arrivato, sei arrivato prima? | Sì | — |

## 5. Denominazione

Carta 5; score **0–4**.

| ID interno | Target |
|---|---|
| `qab2-naming-a` | libro |
| `qab2-naming-b` | pettine |
| `qab2-naming-c` | maschera |
| `qab2-naming-d` | vulcano |
| `qab2-naming-e` | cuore |
| `qab2-naming-f` | piramide |

## 6. Ripetizione

| ID interno | Target | Score |
|---|---|---|
| `qab2-repetition-a` | re | 0–4 |
| `qab2-repetition-b` | scopa | 0–4 |
| `qab2-repetition-c` | staccionata | 0–4 |
| `qab2-repetition-d` | mozzafiato | 0–4 |
| `qab2-repetition-e` | Il cane abbaia alla porta. | 0–4 |
| `qab2-repetition-f` | L’architetto sa chi vedremo domani a pranzo. | 0–4 |

## 7. Lettura

Carta 6; score **0–4**.

| ID interno | Target |
|---|---|
| `qab2-reading-a` | per |
| `qab2-reading-b` | igiene |
| `qab2-reading-c` | bilancia |
| `qab2-reading-d` | affettuoso |
| `qab2-reading-e` | Il sole tramonta a ovest. |
| `qab2-reading-f` | L’investigatore scoprì perché stavo aspettando. |

## 8. Articolazione / Fonazione

Stessi cinque compiti del Modulo 1; nessuna carta.

| ID interno | Valutazione | Score |
|---|---|---|
| `qab2-motor-speech-a` | Disartria | 0–4 |
| `qab2-motor-speech-b` | Aprassia articolatoria | 0–4 |

# MODULO 3

## 1. Consapevolezza

| ID interno | Consegna / target | Score ammessi | Placeholder / seguito | Stop rule |
|---|---|---|---|---|
| `qab3-awareness-a` | Il/la paziente è sufficientemente e clinicamente stabile per essere avvicinato/a? | 0, 4 | — | 0 |
| `qab3-awareness-b` | Il/la paziente può rimanere sveglio/a? | 0–4 | — | 0/1 |
| `qab3-awareness-c` | Puoi dirmi dove siamo adesso? | 0–4 | Posto esatto; biblioteca; cortile; posto esatto | — |
| `qab3-awareness-d` | Puoi dirmi che mese è? | 0–4 | Mese esatto; due mesi inesatti | — |
| `qab3-awareness-e` | Quanti anni hai? | 0–4 | Età esatta; due età inesatte | — |
| `qab3-awareness-f` | Chiudi gli occhi. | 0, 1, 3, 4 | Modello e «Adesso tocca a te» | — |
| `qab3-awareness-g` | Stringimi la mano. | 0, 1, 3, 4 | Modello e «Adesso tocca a te» | — |
| `qab3-awareness-h` | Il/la paziente è in grado di rimanere sveglio, mantenere l’attenzione e seguire le istruzioni? | 0–4 | — | 0/1/2 |

## 2. Eloquio spontaneo

I prompt conversazionali e le opzioni non valutabile sono quelli elencati nel Modulo 1.

Scene della **carta 1**:

- La donna tira l’uomo.
- L’uomo bacia la donna.

| ID interno | Dimensione valutata | Score | Carta |
|---|---|---|---|
| `qab3-spontaneous-speech-a` | Enunciati di lunghezza e complessità ridotta | 0–4 | 1 |
| `qab3-spontaneous-speech-b` | Ridotta velocità di produzione (WPM) | 0–4 | 1 |
| `qab3-spontaneous-speech-c` | Discorso telegrafico / agrammatismo | 0–4 | 1 |
| `qab3-spontaneous-speech-d` | Paragrammatismo | 0–4 | 1 |
| `qab3-spontaneous-speech-e` | Anomia | 0–4 | 1 |
| `qab3-spontaneous-speech-f` | Discorso privo di significato | 0–4 | 1 |
| `qab3-spontaneous-speech-g` | Parafasie semantiche | 0–4 | 1 |
| `qab3-spontaneous-speech-h` | Parafasie fonemiche e neologismi | 0–4 | 1 |
| `qab3-spontaneous-speech-i` | Correzioni spontanee | 0–4 | 1 |
| `qab3-spontaneous-speech-j` | Compromissione globale della comunicazione | 0–4 | 1 |

## 3. Comprensione parole

Score ammessi: **0, 1, 3, 4**.

| ID interno | Target | Distrattori correlati | Carta |
|---|---|---|---|
| `qab3-word-comprehension-a` | elefante | cammello, orso | 2 |
| `qab3-word-comprehension-b` | piano | tromba, violoncello | 2 |
| `qab3-word-comprehension-c` | cammello | elefante, orso | 2 |
| `qab3-word-comprehension-d` | tromba | piano, violoncello | 2 |
| `qab3-word-comprehension-e` | zappa | kappa, mappa | 3 |
| `qab3-word-comprehension-f` | fango | mango, fungo | 3 |
| `qab3-word-comprehension-g` | fungo | fango | 3 |
| `qab3-word-comprehension-h` | mappa | zappa, kappa | 3 |

## 4. Comprensione frasi

Consegna: «Rispondi sì o no». Score ammessi: **0–4**. Carta associata: **4**.

| ID interno | Consegna | Attesa | Placeholder |
|---|---|---|---|
| `qab3-sentence-comprehension-a` | Indosso un/a [camicia/abito] [colore]? | Sì | Capo e colore dell’esaminatore |
| `qab3-sentence-comprehension-b` | Indossa un/a [camicia/abito] [colore]? | No | Capo e colore dell’esaminatore |
| `qab3-sentence-comprehension-c` | Ti lavi i denti con il pettine? | No | — |
| `qab3-sentence-comprehension-d` | I bambini vengono sgridati dai genitori? | Sì | — |
| `qab3-sentence-comprehension-e` | Scatti le foto con una macchina fotografica? | Sì | — |
| `qab3-sentence-comprehension-f` | Se stai per finire, hai già finito? | No | — |
| `qab3-sentence-comprehension-g` | Le persone sono tassate dai governi? | Sì | — |
| `qab3-sentence-comprehension-h` | Se stai per entrare, sei ancora fuori? | Sì | — |
| `qab3-sentence-comprehension-i` | I lupi vengono aggrediti dai cervi? | No | — |
| `qab3-sentence-comprehension-j` | Se era presente alla mostra quando siete arrivati, è arrivato per primo? | Sì | — |
| `qab3-sentence-comprehension-k` | I ladri sono derubati dalle vittime? | No | — |
| `qab3-sentence-comprehension-l` | Se ti dico che bevevo caffè, pensi che lo beva adesso? | No | — |

## 5. Denominazione

Carta 5; score **0–4**.

| ID interno | Target |
|---|---|
| `qab3-naming-a` | letto |
| `qab3-naming-b` | fiore |
| `qab3-naming-c` | zucca |
| `qab3-naming-d` | armonica |
| `qab3-naming-e` | pellicano |
| `qab3-naming-f` | stetoscopio |

## 6. Ripetizione

| ID interno | Target | Score |
|---|---|---|
| `qab3-repetition-a` | ma | 0–4 |
| `qab3-repetition-b` | spada | 0–4 |
| `qab3-repetition-c` | prossimità | 0–4 |
| `qab3-repetition-d` | socievole | 0–4 |
| `qab3-repetition-e` | Il bambino beve dal biberon. | 0–4 |
| `qab3-repetition-f` | Il cantante ha capito dove avremmo alloggiato. | 0–4 |

## 7. Lettura

Carta 6; score **0–4**.

| ID interno | Target |
|---|---|
| `qab3-reading-a` | su |
| `qab3-reading-b` | balia |
| `qab3-reading-c` | strofinaccio |
| `qab3-reading-d` | orgoglioso |
| `qab3-reading-e` | Il cane dorme fuori. |
| `qab3-reading-f` | Il contabile capì perché mi ero nascosto. |

## 8. Articolazione / Fonazione

Stessi cinque compiti del Modulo 1; nessuna carta.

| ID interno | Valutazione | Score |
|---|---|---|
| `qab3-motor-speech-a` | Disartria | 0–4 |
| `qab3-motor-speech-b` | Aprassia articolatoria | 0–4 |

# Stimulus cards

| Modulo | Carta | Sezione | Funzione | assetAvailable |
|---:|---:|---|---|---|
| 1 | 1 | Eloquio spontaneo | Descrizione di due scene | no |
| 1 | 2 | Comprensione parole | Relazioni semantiche | no |
| 1 | 3 | Comprensione parole | Relazioni fonologiche | no |
| 1 | 4 | Comprensione frasi | Supporto visivo Sì/No | no |
| 1 | 5 | Denominazione | Sei figure | no |
| 1 | 6 | Lettura | Quattro parole e due frasi | no |
| 2 | 1 | Eloquio spontaneo | Descrizione di due scene | no |
| 2 | 2 | Comprensione parole | Relazioni semantiche | no |
| 2 | 3 | Comprensione parole | Relazioni fonologiche | no |
| 2 | 4 | Comprensione frasi | Supporto visivo Sì/No | no |
| 2 | 5 | Denominazione | Sei figure | no |
| 2 | 6 | Lettura | Quattro parole e due frasi | no |
| 3 | 1 | Eloquio spontaneo | Descrizione di due scene | no |
| 3 | 2 | Comprensione parole | Relazioni semantiche | no |
| 3 | 3 | Comprensione parole | Relazioni fonologiche | no |
| 3 | 4 | Comprensione frasi | Supporto visivo Sì/No | no |
| 3 | 5 | Denominazione | Sei figure | no |
| 3 | 6 | Lettura | Quattro parole e due frasi | no |

Totale: **18 carte**.

# Stop rule

Le regole sono identiche nei tre moduli.

| Item awareness | Testo canonico | Score che interrompono | Motivo canonico |
|---|---|---|---|
| a | Il/la paziente è sufficientemente e clinicamente stabile per essere avvicinato/a? | 0 | Paziente non sufficientemente stabile: non continuare. |
| b | Il/la paziente può rimanere sveglio/a? | 0, 1 | Stato di veglia insufficiente: non continuare. |
| h | Il/la paziente è in grado di rimanere sveglio, mantenere l’attenzione e seguire le istruzioni? | 0, 1, 2 | Consapevolezza complessiva insufficiente: non continuare. |

Una stop rule attiva non produce un punteggio finale QAB.

# Discrepanze PDF / Excel

Regola editoriale: **il PDF Scoresheet è la fonte canonica dei testi; Excel è la fonte canonica esclusivamente delle formule**.

| Modulo / item | Testo PDF adottato | Divergenza Excel |
|---|---|---|
| M1 awareness a | «clinicamente stabile» | «clinicamente tranquillo/a» |
| M1 comprensione frasi d | «I bambini sono sorvegliati dalla babysitter?» | Refuso di maiuscola in “sorvegliati” |
| M1 comprensione frasi h | «Se dico che fumavo, pensi che io fumi adesso?» | Duplicazione «fumi fumi» |
| M3 comprensione frasi c | «Ti lavi i denti con il pettine?» | Forma plurale di cortesia |
| M3 comprensione frasi d | «I bambini vengono sgridati dai genitori?» | «I bambini vengono nominati dai genitori?» |
| M3 comprensione frasi e | «Scatti le foto con una macchina fotografica?» | Forma plurale di cortesia |
| M3 comprensione frasi l | «Se ti dico che bevevo caffè, pensi che lo beva adesso?» | Forma plurale di cortesia |

I test automatici proteggono esplicitamente “clinicamente stabile”, la frase del Modulo 1 senza duplicazione di “fumi”, “sgridati” nel Modulo 3 e le forme singolari canoniche.

# Scoring — sintesi per la revisione

- Il risultato comprende **sette domini più il QAB complessivo**.
- Le formule, le aggregazioni e i pesi derivano dal workbook ufficiale.
- I raw score sono la fonte autorevole; i risultati derivati non sono raw input.
- Nessun dato mancante, non somministrato o non valutabile viene trasformato in zero.
- Se manca un input richiesto, il risultato è incompleto e non viene prodotto un punteggio ufficiale.
- Una stop rule produce uno stato interrotto e nessun punteggio finale.
- Non viene applicata alcuna classificazione automatica di gravità.

# Checklist per il logopedista

- [ ] Modulo 1 verificato
- [ ] Modulo 2 verificato
- [ ] Modulo 3 verificato
- [ ] Consegne corrette
- [ ] Target corretti
- [ ] Score ammessi corretti
- [ ] Stop rule corrette
- [ ] Stimulus cards correttamente associate
- [ ] Discrepanze PDF/Excel risolte correttamente
- [ ] Nessun contenuto mancante

## NOTE / CORREZIONI

................................................................................

................................................................................

................................................................................

................................................................................
