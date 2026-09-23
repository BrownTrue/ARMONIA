import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Armonia",
  description: "Privacy Policy di Armonia e informazioni sull'integrazione con Google Calendar.",
};

export default function PrivacyPage() {
  return (
    <PublicPage>
      <article className="card p-6 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-sage-700">Privacy</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
        <p className="mt-5 leading-7 text-slate-600">
          Armonia è un gestionale per l&apos;organizzazione dell&apos;attività professionale
          logopedica. Questa pagina descrive in particolare come viene utilizzata
          l&apos;integrazione facoltativa con Google Calendar.
        </p>

        <div className="mt-10 space-y-9">
          <section>
            <h2 className="text-2xl font-bold">Autorizzazione Google Calendar</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Il collegamento a Google Calendar avviene soltanto dopo un&apos;azione volontaria
              e un&apos;autorizzazione esplicita dell&apos;utente tramite il flusso OAuth di Google.
              Il collegamento non è necessario per utilizzare le altre funzioni di Armonia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Accesso richiesto e finalità</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Armonia richiede lo scope Google Calendar <code className="rounded bg-sage-50 px-1.5 py-1 text-sm">calendar.app.created</code>,
              necessario per creare un calendario secondario dedicato chiamato “Armonia” e
              gestire gli eventi creati dall&apos;app in quel calendario.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              Armonia non usa questa integrazione per leggere indiscriminatamente i calendari
              personali dell&apos;utente. La sincronizzazione è unidirezionale, da Armonia verso
              Google Calendar; le modifiche effettuate manualmente in Google Calendar non
              modificano i dati presenti in Armonia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Dati inseriti negli eventi</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Gli eventi contengono soltanto le informazioni necessarie alla gestione
              dell&apos;appuntamento: un titolo identificativo secondo la preferenza scelta
              dall&apos;utente, data, ora, durata e promemoria. Gli eventi sono creati come privati
              e occupati, senza invitati e con descrizione vuota. Non vengono inseriti diagnosi,
              obiettivi terapeutici, note cliniche, scuola, tutore o materiali.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Protezione dei token OAuth</h2>
            <p className="mt-3 leading-7 text-slate-600">
              In modalità cloud, access token e refresh token Google sono conservati lato server
              in forma cifrata e non vengono esposti al browser. Sono utilizzati esclusivamente
              per creare, aggiornare o eliminare nel calendario dedicato gli eventi corrispondenti
              agli appuntamenti gestiti in Armonia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Scollegamento</h2>
            <p className="mt-3 leading-7 text-slate-600">
              L&apos;utente può scollegare Google Calendar in qualsiasi momento dalle Impostazioni
              di Armonia. Il flusso di scollegamento revoca l&apos;autorizzazione Google e rimuove la
              connessione memorizzata da Armonia. Gli eventi già creati nel calendario non vengono
              eliminati automaticamente durante lo scollegamento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Vendita, pubblicità e condivisione</h2>
            <p className="mt-3 leading-7 text-slate-600">
              I dati Google non vengono venduti e non vengono utilizzati per pubblicità. Il loro
              utilizzo è limitato alla funzionalità di sincronizzazione Google Calendar descritta
              in questa pagina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Google API Services User Data Policy e Limited Use</h2>
            <p className="mt-3 leading-7 text-slate-600">
              L&apos;uso e il trasferimento ad altre applicazioni delle informazioni ricevute dalle
              API di Google rispettano la Google API Services User Data Policy, inclusi i requisiti
              di Limited Use. In termini semplici, i dati ottenuti tramite Google vengono usati
              soltanto per offrire la sincronizzazione richiesta dall&apos;utente e non per scopi
              ulteriori non dichiarati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Contatti</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Per richieste relative alla privacy o per assistenza puoi scrivere a{" "}
              <a className="font-bold text-sage-700 hover:underline" href="mailto:browntrue66@gmail.com">
                browntrue66@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-sage-100 pt-6">
          <Link href="/about" className="font-bold text-sage-700 hover:underline">← Torna alle informazioni su Armonia</Link>
        </div>
      </article>
    </PublicPage>
  );
}
