"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/form-controls";
import { safeNextPath } from "@/lib/auth/routing";
import { authEmailRedirectUrl, mapAuthError, PENDING_SIGNUP_KEY, validateSignup, type SignupErrors } from "@/lib/auth/signup";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_POLICY_TEXT } from "@/lib/auth/password";

export default function SignupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<SignupErrors>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return <main className="grid min-h-screen place-items-center px-4 py-10">
    <section className="card w-full max-w-md p-7 sm:p-9">
      <div className="mb-7 flex justify-center"><Image src="/branding/logo.svg" alt="Armonia" width={160} height={147} priority className="h-auto w-36 sm:w-40" /></div>
      <h1 className="text-3xl font-bold">Crea il tuo account ARMONIA</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Inserisci email e password. Potrebbe essere necessario confermare l’indirizzo tramite il link che riceverai.</p>
      <form className="mt-7 space-y-4" noValidate onSubmit={async(event) => {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        const fields = { email: String(form.get("email") || "").trim(), password: String(form.get("password") || ""), confirmPassword: String(form.get("confirmPassword") || "") };
        const validation = validateSignup(fields);
        setErrors(validation);
        setNotice("");
        const firstError = Object.keys(validation)[0] as keyof typeof fields | undefined;
        if (firstError) {
          document.getElementById(`signup-${firstError}`)?.focus();
          return;
        }
        setBusy(true);
        try {
          const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
          const { data, error } = await createClient().auth.signUp({
            email: fields.email,
            password: fields.password,
            options: { emailRedirectTo: authEmailRedirectUrl(window.location.origin, next) },
          });
          if (error) {
            setNotice(mapAuthError(error));
            return;
          }
          if (data.session) {
            router.replace(next);
            return;
          }
          sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({ email: fields.email, next }));
          router.push("/check-email");
        } catch (error) {
          setNotice(mapAuthError(error instanceof Error ? error : undefined));
        } finally {
          setBusy(false);
        }
      }}>
        <Field id="signup-email" label="Email *" name="email" type="email" autoComplete="email" error={errors.email} required />
        <Field id="signup-password" label="Password *" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" error={errors.password} aria-describedby="signup-password-requirements" required />
        <p id="signup-password-requirements" className="-mt-2 text-xs text-slate-500">{PASSWORD_POLICY_TEXT}</p>
        <Field id="signup-confirmPassword" label="Conferma password *" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" error={errors.confirmPassword} required />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-sage-700" />Mostra password</label>
        {notice && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{notice}</p>}
        <button type="submit" disabled={busy} aria-busy={busy} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-60">{busy ? "Creazione in corso…" : "Crea account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">Hai già un account? <Link href="/login" className="font-bold text-sage-700">Accedi</Link></p>
    </section>
  </main>;
}
