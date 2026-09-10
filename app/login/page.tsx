"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-md p-7 sm:p-9">
        <div className="mb-8 flex items-center gap-3 text-xl font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage-700 text-white">a</span>
          Armonia
        </div>
        <h1 className="text-3xl font-bold">Bentornata</h1>
        <p className="mt-2 text-sm text-slate-500">Accedi per ritrovare i dati sincronizzati del tuo studio.</p>
        <form
          className="mt-7 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(event.currentTarget);
            const message = await signIn(String(form.get("email") || ""), String(form.get("password") || ""));
            setBusy(false);
            if (message) setError(message);
            else router.replace("/oggi");
          }}
        >
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-60">
            {busy ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </section>
    </main>
  );
}
