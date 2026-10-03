"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBranding } from "@/components/branding-provider";
import { useData } from "@/components/data-provider";
import { currentProfessionalDocumentSnapshot } from "@/lib/economic-documents";
import { defaultAttendanceIssuePlace, formatItalianDate, professionalAddress, professionalExtraDetails, todayInRome } from "@/lib/professional-documents/attendance-attestation";
import {
  buildPathwayAttestationModel,
  defaultPathwayLocation,
  pathwayAttestationFileName,
  pathwayAttestationLabel,
  pathwayAttestationParagraphs,
  pathwayAttestationPrefill,
  pathwaysForAttestation,
  validatePathwayAttestationDraft,
  type PathwayAttestationDraft,
  type PathwayAttestationField,
  type PathwayAttestationIssues,
  type PathwayAttestationModel,
} from "@/lib/professional-documents/pathway-attestation";

const emptyDraft = (location: string, issuePlace: string): PathwayAttestationDraft => ({ patientId: "", pathwayId: "", status: "active", startDate: "", endDate: "", location, issuePlace, issueDate: todayInRome(), includeLogo: false });
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200";
const errorClass = "mt-1 text-sm font-medium text-red-700";

export function PathwayAttestationGenerator() {
  const { data, ready } = useData();
  const { logoSrc, hasCustomLogo, ready: brandingReady } = useBranding();
  const [draft, setDraft] = useState<PathwayAttestationDraft>(() => emptyDraft(defaultPathwayLocation(data.profile), defaultAttendanceIssuePlace(data.profile, data.professionalDocumentDetails)));
  const [issues, setIssues] = useState<PathwayAttestationIssues>({});
  const [preview, setPreview] = useState<PathwayAttestationModel>();
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const logoDefaultApplied = useRef(false);
  const patientPathways = useMemo(() => pathwaysForAttestation(data.clinicalPathways, draft.patientId), [data.clinicalPathways, draft.patientId]);
  const selectedPatient = data.patients.find((patient) => patient.id === draft.patientId);
  const selectedPathway = data.clinicalPathways.find((pathway) => pathway.id === draft.pathwayId && pathway.patientId === draft.patientId);
  const professional = useMemo(() => currentProfessionalDocumentSnapshot(data.profile, data.professionalDocumentDetails), [data.profile, data.professionalDocumentDetails]);

  useEffect(() => {
    if (!brandingReady || logoDefaultApplied.current) return;
    logoDefaultApplied.current = true;
    if (hasCustomLogo) setDraft((current) => ({ ...current, includeLogo: true }));
  }, [brandingReady, hasCustomLogo]);

  const update = <K extends keyof PathwayAttestationDraft>(key: K, value: PathwayAttestationDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key in issues) setIssues((current) => ({ ...current, [key]: undefined }));
    setPreview(undefined);
    setDownloadError("");
  };

  const choosePatient = (patientId: string) => {
    setDraft((current) => ({ ...current, patientId, pathwayId: "", status: "active", startDate: "", endDate: "" }));
    setIssues({});
    setPreview(undefined);
    setDownloadError("");
  };

  const choosePathway = (pathwayId: string) => {
    const pathway = data.clinicalPathways.find((item) => item.id === pathwayId && item.patientId === draft.patientId);
    if (!pathway) {
      setDraft((current) => ({ ...current, pathwayId: "", status: "active", startDate: "", endDate: "" }));
      return;
    }
    const prefill = pathwayAttestationPrefill(pathway);
    setDraft((current) => ({ ...current, pathwayId, ...prefill }));
    setIssues((current) => ({ ...current, pathwayId: undefined, startDate: undefined, endDate: undefined }));
    setPreview(undefined);
    setDownloadError("");
  };

  const validModel = () => {
    const nextIssues = validatePathwayAttestationDraft(draft);
    if (!selectedPatient && !nextIssues.patientId) nextIssues.patientId = "Seleziona un paziente.";
    if (!selectedPathway && !nextIssues.pathwayId) nextIssues.pathwayId = "Seleziona un percorso clinico.";
    setIssues(nextIssues);
    const first = Object.keys(nextIssues)[0] as PathwayAttestationField | undefined;
    if (first) {
      requestAnimationFrame(() => (formRef.current?.querySelector(`[data-pathway-attestation-field="${first}"]`) as HTMLElement | null)?.focus());
      return;
    }
    return buildPathwayAttestationModel({ draft, patient: selectedPatient!, pathway: selectedPathway!, profile: data.profile, professionalDetails: data.professionalDocumentDetails, logoSrc: hasCustomLogo && draft.includeLogo ? logoSrc : undefined });
  };

  const showPreview = () => {
    const model = validModel();
    if (model) setPreview(model);
  };

  const download = async () => {
    const model = validModel();
    if (!model || !selectedPatient) return;
    setBusy(true);
    setDownloadError("");
    try {
      const [{ pdf }, { pathwayAttestationPdfDocument }] = await Promise.all([import("@react-pdf/renderer"), import("@/components/resources/pathway-attestation-pdf")]);
      const blob = await pdf(pathwayAttestationPdfDocument(model)).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = pathwayAttestationFileName(selectedPatient, draft.issueDate);
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setPreview(model);
    } catch {
      setDownloadError("Non è stato possibile creare il PDF. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div className="mt-8 rounded-2xl border border-sage-100 bg-white p-6 text-sm text-slate-500">Caricamento dati…</div>;

  return <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)]">
    <form ref={formRef} className="rounded-[1.5rem] border border-sage-100 bg-white p-5 shadow-[0_12px_32px_rgba(43,69,55,.05)] sm:p-6" onSubmit={(event) => event.preventDefault()} noValidate>
      <h2 className="text-xl font-bold">Dati dell’attestazione</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Scegli un percorso registrato. Il documento attesta soltanto esistenza e periodo del percorso, senza contenuti clinici.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Paziente" required error={issues.patientId} htmlFor="pathway-attestation-patient">
          <select id="pathway-attestation-patient" data-pathway-attestation-field="patientId" value={draft.patientId} onChange={(event) => choosePatient(event.target.value)} aria-invalid={Boolean(issues.patientId)} className={inputClass}>
            <option value="">Seleziona un paziente</option>
            {data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}
          </select>
        </Field>
        <Field label="Percorso clinico" required error={issues.pathwayId} htmlFor="pathway-attestation-pathway">
          <select id="pathway-attestation-pathway" data-pathway-attestation-field="pathwayId" value={draft.pathwayId} disabled={!draft.patientId} onChange={(event) => choosePathway(event.target.value)} aria-invalid={Boolean(issues.pathwayId)} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}>
            <option value="">{draft.patientId ? "Seleziona un percorso" : "Scegli prima il paziente"}</option>
            {patientPathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathwayAttestationLabel(pathway)}</option>)}
          </select>
          {draft.patientId && !patientPathways.length && <p className="mt-2 text-xs text-slate-500">Nessun percorso registrato per questo paziente.</p>}
        </Field>
        <Field label="Stato percorso" required htmlFor="pathway-attestation-status">
          <select id="pathway-attestation-status" value={draft.status} onChange={(event) => update("status", event.target.value as "active" | "closed")} className={inputClass}>
            <option value="active">Attivo</option><option value="closed">Concluso</option>
          </select>
        </Field>
        <div className="hidden sm:block" aria-hidden="true" />
        <Field label="Data inizio" required error={issues.startDate} htmlFor="pathway-attestation-start">
          <input id="pathway-attestation-start" data-pathway-attestation-field="startDate" type="date" value={draft.startDate} onChange={(event) => update("startDate", event.target.value)} aria-invalid={Boolean(issues.startDate)} className={inputClass} />
        </Field>
        <Field label="Data fine" required={draft.status === "closed"} error={issues.endDate} htmlFor="pathway-attestation-end">
          <input id="pathway-attestation-end" data-pathway-attestation-field="endDate" type="date" value={draft.endDate} disabled={draft.status === "active"} onChange={(event) => update("endDate", event.target.value)} aria-invalid={Boolean(issues.endDate)} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`} />
          {draft.status === "active" && <p className="mt-1 text-xs text-slate-500">Non richiesta per un percorso attualmente in corso.</p>}
        </Field>
        <Field label="Studio / sede" required error={issues.location} htmlFor="pathway-attestation-location" wide>
          <input id="pathway-attestation-location" data-pathway-attestation-field="location" value={draft.location} onChange={(event) => update("location", event.target.value)} aria-invalid={Boolean(issues.location)} placeholder="Es. Studio professionale" className={inputClass} />
        </Field>
        <Field label="Luogo di emissione" htmlFor="pathway-attestation-issue-place">
          <input id="pathway-attestation-issue-place" value={draft.issuePlace} onChange={(event) => update("issuePlace", event.target.value)} placeholder="Facoltativo" className={inputClass} />
        </Field>
        <Field label="Data documento" required error={issues.issueDate} htmlFor="pathway-attestation-issue-date">
          <input id="pathway-attestation-issue-date" data-pathway-attestation-field="issueDate" type="date" value={draft.issueDate} onChange={(event) => update("issueDate", event.target.value)} aria-invalid={Boolean(issues.issueDate)} className={inputClass} />
        </Field>
      </div>

      <section className="mt-7 rounded-2xl bg-sage-50 p-4" aria-labelledby="pathway-professional-title">
        <div className="flex items-start gap-3">
          {brandingReady && hasCustomLogo && <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-2"><Image src={logoSrc} alt="Logo professionale" width={80} height={56} unoptimized className="max-h-full max-w-full object-contain" /></div>}
          <div className="min-w-0"><h3 id="pathway-professional-title" className="font-bold">Dati professionali</h3><p className="mt-1 text-sm font-bold text-slate-800">{professional.professionalName || "Nome professionista non disponibile"}</p><p className="text-sm text-slate-600">{[professional.profession || "Logopedista", professional.studio, professionalAddress(professional)].filter(Boolean).join(" · ") || "Completa i dati professionali nelle Impostazioni."}</p></div>
        </div>
        <Link href="/impostazioni" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-sage-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Gestisci dati professionali</Link>
        {brandingReady && hasCustomLogo && <label className="mt-2 flex min-h-11 items-center gap-3 text-sm font-bold"><input type="checkbox" checked={draft.includeLogo} onChange={(event) => update("includeLogo", event.target.checked)} className="h-5 w-5 accent-sage-700" />Includi logo professionale</label>}
      </section>
      {downloadError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{downloadError}</p>}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" disabled={busy} onClick={showPreview} className="min-h-11 rounded-xl border border-sage-200 px-5 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 disabled:opacity-50">Anteprima</button>
        <button type="button" disabled={busy} aria-busy={busy} onClick={() => void download()} className="min-h-11 rounded-xl bg-sage-700 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy ? "Creazione PDF…" : "Scarica PDF"}</button>
      </div>
    </form>

    <section aria-labelledby="pathway-attestation-preview-title" className="min-w-0">
      <h2 id="pathway-attestation-preview-title" className="text-lg font-bold">Anteprima</h2>
      <p className="mt-1 text-sm text-slate-500">Il documento viene creato soltanto al download e non viene salvato in ARMONIA.</p>
      {preview ? <PathwayPreview model={preview} /> : <div className="mt-4 grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-sage-200 bg-white p-8 text-center text-sm text-slate-500">Compila i dati e scegli “Anteprima”.</div>}
    </section>
  </div>;
}

function Field({ label, required, error, htmlFor, wide, children }: { label: string; required?: boolean; error?: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={wide ? "sm:col-span-2" : undefined}><label htmlFor={htmlFor} className="text-sm font-bold text-slate-700">{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{error && <p id={`${htmlFor}-error`} role="alert" className={errorClass}>{error}</p>}</div>;
}

function PathwayPreview({ model }: { model: PathwayAttestationModel }) {
  const name = model.professional.professionalName || [model.professional.firstName, model.professional.lastName].filter(Boolean).join(" ");
  const address = professionalAddress(model.professional);
  const details = professionalExtraDetails(model.professional);
  return <div className="mt-4 overflow-auto rounded-[1.5rem] bg-slate-100 p-2 sm:p-4"><article className="mx-auto min-h-[42rem] w-full max-w-[46rem] bg-white px-6 py-8 text-slate-800 shadow-sm sm:px-10 sm:py-10">
    <header className="flex items-start gap-4 border-b border-slate-200 pb-5">{model.logoSrc && <div className="flex h-16 w-24 shrink-0 items-center justify-center"><Image src={model.logoSrc} alt="" width={96} height={64} unoptimized className="max-h-full max-w-full object-contain" /></div>}<div><p className="font-bold text-sage-900">{name}</p><p className="text-sm text-slate-600">{model.professional.profession || "Logopedista"}</p>{model.professional.studio && <p className="text-sm text-slate-600">{model.professional.studio}</p>}{address && <p className="mt-1 text-xs text-slate-500">{address}</p>}{model.professional.email && <p className="text-xs text-slate-500">{model.professional.email}</p>}</div></header>
    <h3 className="mt-12 text-center text-xl font-bold">Attestazione di percorso logopedico</h3>
    <div className="mt-10 space-y-5 text-sm leading-7 sm:text-base">{pathwayAttestationParagraphs(model).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    <p className="mt-10 text-sm">{[model.issuePlace, formatItalianDate(model.issueDate)].filter(Boolean).join(", ")}</p>
    <div className="ml-auto mt-12 w-56 text-center text-sm"><p className="font-bold">{name}</p><p>Logopedista</p>{details && <p className="mt-2 text-xs leading-5 text-slate-500">{details}</p>}<div className="mt-14 border-t border-slate-400 pt-1 text-xs text-slate-500">Firma</div></div>
  </article></div>;
}
