# Workflow editoriale Banca Asset ARMONIA

1. Preparare un'immagine coerente con le linee editoriali e verificarne la provenienza.
2. Assegnare un filename stabile, minuscolo e descrittivo.
3. Inserire l'immagine in `public/armonia-assets/images/`.
4. Compilare i metadati in `catalog.ts`; `template.csv` può essere usato per la preparazione esterna.
5. Eseguire `npm run asset-bank:validate`.
6. Sottoporre asset, metadati e base d'uso a revisione umana.
7. Impostare `reviewStatus: "approved"` soltanto quando provenienza e uso commerciale sono documentati.

Il validatore controlla coerenza tecnica e completezza dichiarata, non determina la validità giuridica di una licenza. I 120 asset iniziali sono `armonia_original`, restano `draft` e usano conservativamente `commercialUseAllowed: false` finché la revisione editoriale e giuridica non autorizza un cambio di stato. La V0.1 è image-first; immagini alternative, parola scritta, audio, scene e sequenze sono possibili evoluzioni, non parte del modello corrente.

## Preparazione delle griglie 4×2

Le 15 griglie editoriali `batch-01.png` … `batch-15.png` restano in `tmp/asset-grids/` e non vengono modificate. `npm run asset-bank:split` applica il manifest esplicito, produce 120 WebP in `public/armonia-assets/images/` e crea `tmp/asset-grids/asset-grid-review.html` per il controllo visivo. Se un output esiste già, lo script si ferma; la rigenerazione richiede l'opzione esplicita `npm run asset-bank:split -- --overwrite`.
