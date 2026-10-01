# Banca Contenuti ARMONIA

La Banca Contenuti è un catalogo editoriale static-first di unità linguistiche
e cliniche riutilizzabili. È distinta dalla Banca Asset:

- **Banca Asset** — come un contenuto può essere rappresentato (oggi immagini);
- **Banca Contenuti** — qual è l'unità linguistica o clinica (parola,
  non-parola, coppia, frase, brano o sequenza);
- **Mattoncino** — che cosa viene chiesto di fare;
- **Ricetta** — come viene configurato un Mattoncino;
- **Esercizio** — l'istanza concreta risultante.

La V1 contiene un corpus originale e read-only nel repository. Non usa
database, Supabase, Storage, API pubbliche o generazione AI runtime.

## Collegamento con la Banca Asset

I contenuti possono riferire gli ID stabili degli asset, ma gli asset non
dipendono dai contenuti. Per le parole già illustrate il catalogo risolve a
runtime di build i metadati fonologici revisionati della Banca Asset: questi
record non possiedono una seconda copia editoriale della fonologia.

Le parole senza rappresentazione visiva mantengono fonologia inline nel
ContentItem e possono essere usate normalmente. La disponibilità di testo e
immagine è calcolata dai link reali tramite
`getAvailableRepresentations(wordId)`, non salvata come flag manuale.

## Confini V1

Il validator controlla contratto, ID, discriminanti, fonologia strutturata e
riferimenti. Non certifica correttezza clinica, acquisizione linguistica o
appropriatezza normativa. Le fasce di pubblico e la difficoltà sono soltanto
metadati editoriali facoltativi.

Per le non-parole il validator può controllare struttura, ID, fonologia e
collisioni con i cataloghi ARMONIA, ma non può dimostrare automaticamente che
una stringa sia assente dall'intero lessico italiano. Ogni `NonwordContent`
richiede quindi anche una revisione lessicale editoriale; una blacklist statica
protegge almeno dalle collisioni già individuate, senza introdurre dizionari o
inferenze ortografia→IPA nel runtime.

Il catalogo reale comprende una proiezione Word per ciascuno dei 120 asset:
fonologia e immagine restano riferimenti alla Banca Asset, senza copie manuali.
I contenuti testuali proposti per l'espansione vivono invece in
`candidates/catalog.ts`, sono tutti `draft`, non sono importati dal catalogo
normale e richiedono revisione editoriale prima di qualsiasi promozione.

`coverage-report.md` fotografa la copertura reale. Si rigenera con
`npm run content-bank:coverage`; `npm run content-bank:candidates:validate`
controlla struttura, conteggi e riferimenti della coda editoriale separata.

Il corpus non è un editor e non introduce Ricette, esercizi persistiti,
compiti a casa, audio o CRUD.
