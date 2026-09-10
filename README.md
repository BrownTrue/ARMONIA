# Armonia

Gestionale personale, responsive e privacy-first per una logopedista. Con le variabili Supabase configurate, autenticazione, dati e file usano il cloud.

## Modalità dati

### Modalità Supabase (predefinita quando configurata)

- Pazienti, appuntamenti, sedute, obiettivi, materiali, relazioni e profilo vengono letti e scritti nelle tabelle PostgreSQL.
- L'accesso email/password usa Supabase Auth e la sessione viene mantenuta dal client Supabase.
- I file sono caricati nel bucket privato `therapy-materials` e aperti tramite signed URL temporanei.
- Le policy RLS isolano i dati per utente.

### Modalità locale (fallback di sviluppo)

- Pazienti, appuntamenti, sedute, materiali e profilo sono persistiti in `localStorage`.
- I file caricati sono conservati in IndexedDB e non lasciano il dispositivo.
- La modalità è completa per lo sviluppo, ma non sincronizza dati tra browser o dispositivi e non è adatta a dati sanitari reali.
- Per attivarla esplicitamente, imposta `NEXT_PUBLIC_DATA_MODE=local` nell'ambiente di sviluppo.

## Avvio locale

1. Crea un progetto su Supabase e copia URL e anon key in `.env.local`, partendo da `.env.example`.
2. Nel SQL Editor esegui in ordine le migration presenti in `supabase/migrations`: `001_initial_schema.sql`, `002_profile_fields.sql` e `003_authenticated_grants.sql`.
3. In **Storage**, crea il bucket privato `therapy-materials`. Le policy SQL incluse proteggono i file: ciascun upload deve usare il percorso `<user-id>/<nome-file>`.
4. Installa ed esegui: `npm install` e `npm run dev`.

## Autenticazione

Supabase Auth gestisce email/password, sessione persistente e logout. Prima del go-live, abilita Email provider in **Authentication → Providers** e configura il redirect URL del sito in **Authentication → URL Configuration**. Le RLS policy sono la protezione effettiva dei dati.

## Storage

L'app genera signed URL con scadenza breve per visualizzare i file privati. Non rendere pubblico il bucket e non usare URL permanenti per i documenti clinici.

## Pubblicazione su Vercel

1. Carica il repository su GitHub e importalo in Vercel.
2. Aggiungi `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nelle Environment Variables di Vercel.
3. Pubblica. A ogni push sul branch principale Vercel crea un nuovo deploy.

## Aggiornamenti

Ogni modifica al database va in una nuova migration SQL ordinata. Applica la migration prima del deploy dell’app. Non inserire mai chiavi di servizio o dati sanitari nel repository.
