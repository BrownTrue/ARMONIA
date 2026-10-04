"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authEmailRedirectUrl, mapAuthError, PENDING_SIGNUP_KEY } from "@/lib/auth/signup";
import { createClient } from "@/lib/supabase/client";

type PendingSignup = { email: string; next: string };

export default function CheckEmailPage() {
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(PENDING_SIGNUP_KEY) || "null") as PendingSignup | null;
      if (parsed?.email) setPending(parsed);
    } catch { /* A missing or invalid local hint must not expose technical errors. */ }
    setLoaded(true);
  }, []);

  return <main className="grid min-h-screen place-items-center px-4 py-10">
    <section className="card w-full max-w-md p-7 text-center sm:p-9">
      <div className="mb-7 flex justify-center"><Image src="/branding/logo.svg" alt="Armonia" width={140} height={129} priority className="h-auto w-32" /></div>
      <h1 className="text-3xl font-bold">Controlla la tua email</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{pending ? <>Abbiamo inviato un link di conferma a <strong>{pending.email}</strong>.</> : "Se la registrazione è andata a buon fine, riceverai un link per confermare il tuo indirizzo."}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">Apri il link nello stesso browser per completare l’accesso ad ARMONIA.</p>
      {sent && <p role="status" className="mt-5 rounded-xl bg-sage-50 p-3 text-sm font-semibold text-sage-800">Email di conferma reinviata. Controlla anche la cartella spam.</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col gap-3">
        <button type="button" disabled={!loaded || !pending || busy || sent} aria-busy={busy} aria-describedby={!pending ? "resend-email-hint" : undefined} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" onClick={async() => {
          if (!pending || busy) return;
          setBusy(true); setError("");
          try {
            const { error: resendError } = await createClient().auth.resend({ type: "signup", email: pending.email, options: { emailRedirectTo: authEmailRedirectUrl(window.location.origin, pending.next) } });
            if (resendError) setError(mapAuthError(resendError));
            else setSent(true);
          } catch (cause) { setError(mapAuthError(cause instanceof Error ? cause : undefined)); }
          finally { setBusy(false); }
        }}>{busy ? "Invio in corso…" : sent ? "Email reinviata" : "Reinvia email di conferma"}</button>
        {!pending && loaded && <p id="resend-email-hint" className="text-xs leading-5 text-slate-500">Per reinviare l’email, torna alla registrazione o prova ad accedere con il tuo indirizzo.</p>}
        <Link href="/login" className="btn btn-secondary w-full">Torna al login</Link>
      </div>
    </section>
  </main>;
}
