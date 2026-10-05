"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { SessionEditor } from "@/components/session-editor";
import { fullName } from "@/lib/types";

function Form() {
  const query = useSearchParams();
  const router = useRouter();
  const { data } = useData();
  const appointmentId = query.get("a") || undefined;
  const appointment = appointmentId ? data.appointments.find((item) => item.id === appointmentId) : undefined;
  const patientId = query.get("p") || appointment?.patientId;
  const patient = patientId ? data.patients.find((item) => item.id === patientId) : undefined;
  const backHref = patientId ? `/pazienti/${patientId}?tab=activity` : "/oggi";
  return <AppShell mobileFullScreen mobileHeader={{ variant: "detail", title: "Registra seduta", backHref, backLabel: patient ? `Torna alle attività di ${fullName(patient)}` : "Torna indietro" }}><div className="px-4 pt-5 md:px-0 md:pt-0"><SessionEditor
    appointmentId={appointmentId}
    fallbackPatientId={patientId}
    fallbackDate={query.get("date") || undefined}
    onOpenDuplicate={(session) => router.push(`/pazienti/${session.patientId}?tab=activity`)}
    onSaved={(session) => router.push(`/pazienti/${session.patientId}?tab=activity`)}
  /></div></AppShell>;
}

export default function NewSession() {
  return <Suspense fallback={<p>Caricamento…</p>}><Form /></Suspense>;
}
