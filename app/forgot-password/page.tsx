"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Field } from "@/components/form-controls";
import { mapAuthError } from "@/lib/auth/signup";
import { recoveryRedirectUrl } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

const RECOVERY_SENT = "Se esiste un account associato a questa email, riceverai un link per reimpostare la password.";

export default function ForgotPasswordPage() {
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return <main className="grid min-h-screen place-items-center px-4 py-10"><section className="card w-full max-w-md p-7 sm:p-9">
    <div className="mb-7 flex justify-center"><Image src="/branding/logo.svg" alt="Armonia" width={150} height={138} priority className="h-auto w-36" /></div>
    <h1 className="text-3xl font-bold">Reimposta la password</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500">Inserisci l’email usata per accedere ad ARMONIA.</p>
    {sent ? <div className="mt-7"><p role="status" className="rounded-xl bg-sage-50 p-4 text-sm font-semibold leading-6 text-sage-800">{RECOVERY_SENT}</p><Link href="/login" className="btn btn-primary mt-5 w-full">Torna al login</Link></div> : <form className="mt-7 space-y-4" noValidate onSubmit={async(event) => {
      event.preventDefault();
      if (busy) return;
      const email = String(new FormData(event.currentTarget).get("email") || "").trim();
      const invalid = !email ? "Inserisci l’email." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Inserisci un indirizzo email valido." : "";
      setEmailError(invalid); setError("");
      if (invalid) { document.getElementById("recovery-email")?.focus(); return; }
      setBusy(true);
      try {
        const { error: requestError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirectUrl(window.location.origin) });
        if (requestError) setError(mapAuthError(requestError));
        else setSent(true);
      } catch (cause) { setError(mapAuthError(cause instanceof Error ? cause : undefined)); }
      finally { setBusy(false); }
    }}>
      <Field id="recovery-email" label="Email *" name="email" type="email" autoComplete="email" error={emailError} required />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} aria-busy={busy} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-60">{busy ? "Invio in corso…" : "Invia link di recupero"}</button>
      <Link href="/login" className="btn btn-secondary w-full">Torna al login</Link>
    </form>}
  </section></main>;
}
