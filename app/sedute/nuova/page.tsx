"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SessionEditor } from "@/components/session-editor";

function Form() {
  const query = useSearchParams();
  const router = useRouter();
  return <AppShell><SessionEditor
    appointmentId={query.get("a") || undefined}
    fallbackPatientId={query.get("p") || undefined}
    fallbackDate={query.get("date") || undefined}
    onOpenDuplicate={(session) => router.push(`/pazienti/${session.patientId}`)}
    onSaved={(session) => router.push(`/pazienti/${session.patientId}`)}
  /></AppShell>;
}

export default function NewSession() {
  return <Suspense fallback={<p>Caricamento…</p>}><Form /></Suspense>;
}
