"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBranding } from "@/components/branding-provider";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { euroInputToCents, formatEuroCents } from "@/lib/calendar-v2";
import {
  addEconomicDocumentLine,
  createEconomicDocumentDraft,
  createManualEconomicDocumentLine,
  currentEconomicDocumentRecipient,
  currentProfessionalDocumentSnapshot,
  economicDocumentLineFromSession,
  economicDocumentWithLines,
  professionalDocumentMissingFields,
  recipientDocumentMissingFields,
  sessionIsInActiveIssuedEconomicDocument,
  type ProfessionalDocumentSnapshot,
  type RecipientDocumentSnapshot,
} from "@/lib/economic-documents";
import type { EconomicDocument, EconomicDocumentLine, Patient, PatientAdministrativeDetails, Session } from "@/lib/types";
import { fullName, uid } from "@/lib/types";
import {
  EconomicDocumentRequestError,
  createEconomicDocumentIssueRunner,
  economicDocumentDraftIsDirty,
  economicDocumentDownloadErrorMessage,
  economicDocumentDownloadUrl,
  economicDocumentIssueErrorMessage,
  economicDocumentVoidErrorMessage,
  issueEconomicDocument as requestEconomicDocumentIssue,
  voidEconomicDocument as requestEconomicDocumentVoid,
} from "@/lib/economic-documents/client";

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-400";
const dateLabel = (value: string) => new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("it-IT");
const statusLabel = { draft: "Bozza", issued: "Emesso", voided: "Annullato" } as const;
const statusClass = { draft: "bg-amber-50 text-amber-800", issued: "bg-sage-100 text-sage-800", voided: "bg-slate-100 text-slate-600" } as const;
const text = (value: unknown) => typeof value === "string" ? value : "";
const numberValue = (value: string, fallback: number) => { const parsed = Number(value); return Number.isInteger(parsed) ? parsed : fallback; };

export function EconomicDocumentsPanel({ className = "", createRequest = 0 }: { className?: string; createRequest?: number }) {
  const { data, connection, reload, saveEconomicDocumentDraft, deleteEconomicDocumentDraft, saveEconomicDocumentLineDraft, deleteEconomicDocumentLineDraft } = useData();
  const [editor, setEditor] = useState<EconomicDocument | "new" | null>(null);
  const [patientFilter, setPatientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EconomicDocument["status"] | "">("");
  useEffect(() => { if (createRequest > 0) setEditor("new"); }, [createRequest]);
  const documents = useMemo(() => data.economicDocuments
    .filter((document) => (!patientFilter || document.patientId === patientFilter) && (!statusFilter || document.status === statusFilter))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [data.economicDocuments, patientFilter, statusFilter]);
  const nameFor = (id: string) => { const patient = data.patients.find((item) => item.id === id); return patient ? fullName(patient) : "Paziente non disponibile"; };
  return <section className={className} aria-labelledby="economic-documents-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="economic-documents-title" className="text-xl font-bold sm:text-2xl">Documenti</h2><p className="mt-1 text-sm text-slate-500">Proforma in bozza, separati dagli incassi.</p></div><button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setEditor("new")}>+ Nuovo proforma</button></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500">Paziente<select className={inputClass} value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}><option value="">Tutti</option>{data.patients.map((patient) => <option key={patient.id} value={patient.id}>{fullName(patient)}</option>)}</select></label><label className="text-xs font-bold text-slate-500">Stato<select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EconomicDocument["status"] | "")}><option value="">Tutti</option><option value="draft">Bozza</option><option value="issued">Emesso</option><option value="voided">Annullato</option></select></label></div>
    {documents.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{documents.map((document) => { const recipient = document.recipientSnapshot as RecipientDocumentSnapshot; const displayDate = document.status === "draft" ? document.updatedAt : document.issueDate || document.updatedAt; return <button type="button" key={document.id} onClick={() => setEditor(document)} className="card w-full p-4 text-left transition hover:border-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{document.documentNumber || "Proforma senza numero"}</p><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[document.status]}`}>{statusLabel[document.status]}</span></div><p className="mt-1 truncate text-sm text-slate-600">{nameFor(document.patientId)}</p><p className="truncate text-xs text-slate-400">Destinatario: {[recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "Da completare"}</p></div><div className="shrink-0 text-right"><p className="font-bold text-sage-800">{formatEuroCents(document.totalCents)}</p><p className="mt-1 text-xs text-slate-400">{dateLabel(displayDate)}</p></div></div></button>; })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-sage-200 bg-sage-50/40 px-5 py-9 text-center"><p className="font-bold">Nessun documento ancora</p><p className="mt-1 text-sm text-slate-500">Crea un proforma in bozza partendo dalle prestazioni registrate.</p><button type="button" className="btn btn-primary mt-4" onClick={() => setEditor("new")}>+ Nuovo proforma</button></div>}
    {editor && (
      editor !== "new" && editor.status !== "draft" ? <EconomicDocumentHistory document={editor} lines={data.economicDocumentLines.filter((line) => line.documentId === editor.id).sort((a, b) => a.position - b.position)} onClose={() => setEditor(null)} onReload={reload} onChange={setEditor}/>
        : <EconomicDocumentEditor cloudEnabled={connection.kind === "cloud"} document={editor === "new" ? undefined : editor} patients={data.patients} onClose={() => setEditor(null)} onDelete={async (document) => { if (!window.confirm("Eliminare questa bozza? Le sedute e i pagamenti resteranno invariati.")) return; await deleteEconomicDocumentDraft(document.id); setEditor(null); }} onIssue={async (id) => { const issued = await requestEconomicDocumentIssue(id); setEditor(issued); await reload(); return issued; }} onSave={async (document, lines, previousLineIds) => { await saveEconomicDocumentDraft(document); for (const id of previousLineIds.filter((id) => !lines.some((line) => line.id === id))) await deleteEconomicDocumentLineDraft(id); for (const line of lines) await saveEconomicDocumentLineDraft(line); await saveEconomicDocumentDraft(economicDocumentWithLines(document, lines, new Date().toISOString())); }}/>
    )}
  </section>;
}

function EconomicDocumentEditor({ document, patients, cloudEnabled, onClose, onSave, onDelete, onIssue }: { document?: EconomicDocument; patients: Patient[]; cloudEnabled: boolean; onClose: () => void; onSave: (document: EconomicDocument, lines: EconomicDocumentLine[], previousLineIds: string[]) => Promise<void>; onDelete: (document: EconomicDocument) => Promise<void>; onIssue: (id: string) => Promise<EconomicDocument> }) {
  const { data } = useData();
  const { logoSrc, hasCustomLogo, ready: brandingReady } = useBranding();
  const readOnly = Boolean(document && document.status !== "draft");
  const initialPatient = document?.patientId || new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("patient") || "";
  const [patientId, setPatientId] = useState(initialPatient);
  const [draftId] = useState(document?.id || uid());
  const [createdAt] = useState(document?.createdAt || new Date().toISOString());
  const originalLines = useMemo(() => document ? data.economicDocumentLines.filter((line) => line.documentId === document.id).sort((a, b) => a.position - b.position) : [], [data.economicDocumentLines, document]);
  const [lines, setLines] = useState<EconomicDocumentLine[]>(originalLines);
  const [persistedLineIds, setPersistedLineIds] = useState(() => originalLines.map((line) => line.id));
  const [notes, setNotes] = useState(document?.notes || "");
  const [recipient, setRecipient] = useState<RecipientDocumentSnapshot>(() => document?.recipientSnapshot as RecipientDocumentSnapshot || recipientFor(initialPatient, patients, data.patientAdministrativeDetails));
  const [professional, setProfessional] = useState<ProfessionalDocumentSnapshot>(() => document?.professionalSnapshot as ProfessionalDocumentSnapshot || currentProfessionalDocumentSnapshot(data.profile, data.professionalDocumentDetails));
  const [logoIncluded, setLogoIncluded] = useState(document?.logoIncluded ?? hasCustomLogo);
  const [sessionPrices, setSessionPrices] = useState<Record<string, string>>({});
  const [manualDescription, setManualDescription] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualAmount, setManualAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueFailed, setIssueFailed] = useState(false);
  const issueFlight = useRef(false);
  const issueRunner = useRef(createEconomicDocumentIssueRunner());
  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const patientSessions = data.sessions.filter((session) => session.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const totals = useMemo(() => lines.reduce((sum, line) => sum + line.lineTotalCents, 0), [lines]);
  const missingProfessional = professionalDocumentMissingFields(professional);
  const missingRecipient = recipientDocumentMissingFields(recipient);
  useEffect(() => {
    if (!document && brandingReady && hasCustomLogo) setLogoIncluded(true);
  }, [brandingReady, document, hasCustomLogo]);
  const choosePatient = (nextId: string) => { setPatientId(nextId); setLines([]); setRecipient(recipientFor(nextId, patients, data.patientAdministrativeDetails)); setError(""); };
  const addSession = (session: Session) => { try { const custom = session.effectivePriceCents === undefined ? euroInputToCents(sessionPrices[session.id] || "") : undefined; const line = economicDocumentLineFromSession({ id: uid(), documentId: draftId, session, unitAmountCents: custom, position: lines.length + 1, createdAt: new Date().toISOString() }); setLines(addEconomicDocumentLine(lines, line)); } catch { setError("Specifica un importo valido per aggiungere questa prestazione."); } };
  const addManual = () => { try { const amount = euroInputToCents(manualAmount); if (amount === undefined) throw new Error(); const line = createManualEconomicDocumentLine({ id: uid(), documentId: draftId, patientId, description: manualDescription, quantity: numberValue(manualQuantity, 0), unitAmountCents: amount, position: lines.length + 1, createdAt: new Date().toISOString() }); setLines([...lines, line]); setManualDescription(""); setManualQuantity("1"); setManualAmount(""); setError(""); } catch { setError("Completa descrizione, quantità e importo della riga manuale."); } };
  const updateLine = (id: string, patch: Partial<EconomicDocumentLine>) => setLines((current) => current.map((line) => { if (line.id !== id) return line; const next = { ...line, ...patch, updatedAt: new Date().toISOString() }; return { ...next, lineTotalCents: next.quantity * next.unitAmountCents }; }));
  const prepareDraft = () => { if (!patientId || !selectedPatient) throw new Error("Seleziona un paziente."); if (!lines.length) throw new Error("Aggiungi almeno una prestazione o una riga manuale."); if (lines.some((line) => !line.descriptionSnapshot.trim() || !Number.isInteger(line.quantity) || line.quantity <= 0 || !Number.isInteger(line.unitAmountCents) || line.unitAmountCents < 0)) throw new Error("Controlla descrizione, quantità e importo delle righe."); const stamp = new Date().toISOString(); const base = document || createEconomicDocumentDraft({ id: draftId, patientId, professionalSnapshot: professional, recipientSnapshot: recipient, logoIncluded: hasCustomLogo && logoIncluded, createdAt }); const normalizedLines = lines.map((line, index) => ({ ...line, patientId, documentId: draftId, position: index + 1 })); return { next:economicDocumentWithLines({ ...base, patientId, professionalSnapshot: professional, recipientSnapshot: recipient, notes, logoIncluded: hasCustomLogo && logoIncluded, updatedAt: stamp }, normalizedLines, stamp), normalizedLines }; };
  const save = async () => { setSaving(true); setError(""); try { const { next, normalizedLines } = prepareDraft(); await onSave(next, normalizedLines, persistedLineIds); setLines(normalizedLines); setPersistedLineIds(normalizedLines.map((line) => line.id)); onClose(); } catch (cause) { setError(cause instanceof Error && cause.message ? cause.message : "Non è stato possibile salvare la bozza. Riprova."); } finally { setSaving(false); } };
  const requestIssueConfirmation = () => { setError(""); setIssueFailed(false); setIssueOpen(true); };
  const confirmIssue = async () => {
    if (issueFlight.current) return;
    issueFlight.current = true;
    setIssuing(true);
    setIssueFailed(false);
    setError("");
    try {
      const prepared = prepareDraft();
      if (missingRecipient.length) throw new Error(`Completa i dati del destinatario: ${missingRecipient.join(", ")}.`);
      if (missingProfessional.length) throw new Error(`Completa i dati professionali: ${missingProfessional.join(", ")}.`);
      if (!Number.isSafeInteger(totals) || totals < 0) throw new Error("Controlla il totale del proforma prima dell’emissione.");
      const shouldPersist = !document || economicDocumentDraftIsDirty(document, originalLines, prepared.next, prepared.normalizedLines);
      await issueRunner.current.run({ documentId: document?.id, shouldPersist, persist: async () => { const { next, normalizedLines }=prepareDraft(); await onSave(next, normalizedLines, persistedLineIds); setLines(normalizedLines); setPersistedLineIds(normalizedLines.map((line)=>line.id)); return next; }, issue:onIssue });
      setIssueOpen(false);
    } catch (cause) {
      setIssueFailed(true);
      setError(cause instanceof EconomicDocumentRequestError ? economicDocumentIssueErrorMessage(cause) : cause instanceof Error && cause.message ? cause.message : "Non è stato possibile emettere il proforma. Riprova.");
    } finally {
      issueFlight.current = false;
      setIssuing(false);
    }
  };
  return <Modal title={document ? (readOnly ? "Dettaglio proforma" : "Modifica proforma") : "Nuovo proforma"} onClose={onClose}><div className="space-y-5">
    <p className="text-sm text-slate-500">{readOnly ? "Il documento è nello storico e non può essere modificato in E3B." : "Prepara una bozza. Nessun pagamento verrà creato o modificato."}</p>
    <section className="rounded-2xl border border-sage-100 p-4"><h3 className="font-bold">1. Paziente</h3><label className="mt-3 block text-sm font-bold">Paziente<select disabled={readOnly || Boolean(document)} className={inputClass} value={patientId} onChange={(event) => choosePatient(event.target.value)}><option value="">Seleziona…</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{fullName(patient)}</option>)}</select></label>{document && <p className="mt-2 text-xs text-slate-500">Il paziente della bozza resta fisso; crea una nuova bozza per un altro paziente.</p>}</section>
    {patientId && <section className="rounded-2xl border border-sage-100 p-4"><h3 className="font-bold">2. Prestazioni</h3>{!readOnly && <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">{patientSessions.length ? patientSessions.map((session) => { const included = lines.some((line) => line.sessionId === session.id); const issued = sessionIsInActiveIssuedEconomicDocument(session.id, data.economicDocuments, data.economicDocumentLines); return <div key={session.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{session.serviceNameSnapshot || "Prestazione non specificata"}</p><p className="text-xs text-slate-500">{dateLabel(session.date)} · {session.effectivePriceCents === undefined ? "Prezzo da specificare" : formatEuroCents(session.effectivePriceCents)}</p>{issued && <p className="mt-1 text-xs font-bold text-amber-700">Già presente in un documento emesso</p>}</div>{included ? <button type="button" className="text-sm font-bold text-red-600" onClick={() => setLines(lines.filter((line) => line.sessionId !== session.id))}>Rimuovi</button> : <button type="button" disabled={issued} className="text-sm font-bold text-sage-700 disabled:text-slate-300" onClick={() => addSession(session)}>Aggiungi</button>}</div>{session.effectivePriceCents === undefined && !included && !issued && <label className="mt-2 block text-xs font-bold text-slate-500">Importo (€)<input inputMode="decimal" className={inputClass} value={sessionPrices[session.id] || ""} onChange={(event) => setSessionPrices((current) => ({ ...current, [session.id]: event.target.value }))}/></label>}</div>; }) : <p className="text-sm text-slate-500">Nessuna seduta registrata per questo paziente.</p>}</div>}
      {!readOnly && <div className="mt-4 border-t border-sage-100 pt-4"><p className="text-sm font-bold">Aggiungi riga manuale</p><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_5rem_8rem_auto]"><input aria-label="Descrizione riga manuale" placeholder="Descrizione" className={inputClass} value={manualDescription} onChange={(event) => setManualDescription(event.target.value)}/><input aria-label="Quantità riga manuale" type="number" min="1" className={inputClass} value={manualQuantity} onChange={(event) => setManualQuantity(event.target.value)}/><input aria-label="Importo unitario riga manuale" inputMode="decimal" placeholder="Importo €" className={inputClass} value={manualAmount} onChange={(event) => setManualAmount(event.target.value)}/><button type="button" className="btn btn-quiet mt-1" onClick={addManual}>Aggiungi</button></div></div>}
      <div className="mt-4 space-y-2">{lines.map((line) => <div key={line.id} className="rounded-xl border border-slate-100 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem_auto]"><input aria-label="Descrizione prestazione" disabled={readOnly} className={inputClass} value={line.descriptionSnapshot} onChange={(event) => updateLine(line.id, { descriptionSnapshot: event.target.value })}/><input aria-label="Quantità" disabled={readOnly} type="number" min="1" className={inputClass} value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: numberValue(event.target.value, 1) })}/><input aria-label="Importo unitario" disabled={readOnly} inputMode="decimal" className={inputClass} value={String(line.unitAmountCents / 100)} onChange={(event) => { const cents = euroInputToCents(event.target.value); if (cents !== undefined) updateLine(line.id, { unitAmountCents: cents }); }}/>{!readOnly && <button type="button" aria-label="Rimuovi riga" className="mt-1 text-sm font-bold text-red-600" onClick={() => setLines(lines.filter((item) => item.id !== line.id))}>Rimuovi</button>}</div><p className="mt-2 text-right text-sm font-bold">{formatEuroCents(line.lineTotalCents)}</p></div>)}</div>
    </section>}
    {patientId && <div id="economic-recipient-section"><SnapshotSection title="3. Destinatario documento" warning={missingRecipient.length ? `Dati da completare prima dell’emissione: ${missingRecipient.join(", ")}.` : undefined} onReset={!readOnly ? () => setRecipient(recipientFor(patientId, patients, data.patientAdministrativeDetails)) : undefined}><SnapshotFields kind="recipient" value={recipient} disabled={readOnly} onChange={setRecipient}/></SnapshotSection></div>}
    {patientId && <div id="economic-professional-section"><SnapshotSection title="4. I tuoi dati nel documento" warning={missingProfessional.length ? "Completa i dati professionali prima di emettere il documento." : undefined} onReset={!readOnly ? () => setProfessional(currentProfessionalDocumentSnapshot(data.profile, data.professionalDocumentDetails)) : undefined}><SnapshotFields kind="professional" value={professional} disabled={readOnly} onChange={setProfessional}/>{brandingReady && hasCustomLogo && <label className="mt-3 flex min-h-11 items-center gap-3 text-sm font-bold"><input type="checkbox" checked={logoIncluded} disabled={readOnly} onChange={(event) => setLogoIncluded(event.target.checked)}/>Mostra logo nel documento</label>}</SnapshotSection></div>}
    {patientId && <section><label className="block text-sm font-bold">Note facoltative<textarea disabled={readOnly} rows={3} className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)}/></label></section>}
    {patientId && (
      <DocumentPreview patient={selectedPatient} professional={professional} recipient={recipient} lines={lines} notes={notes} total={totals} logoSrc={hasCustomLogo && logoIncluded ? logoSrc : undefined}/>
    )}
    {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
    <div className="flex flex-col-reverse gap-2 border-t border-sage-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div>{document?.status === "draft" && <button type="button" disabled={saving || issuing} className="btn w-full text-red-600 sm:w-auto" onClick={() => void onDelete(document)}>Elimina bozza</button>}</div><div className="grid gap-2 sm:flex sm:flex-row sm:justify-end"><button type="button" disabled={saving || issuing} className="btn btn-quiet" onClick={onClose}>Annulla</button><button type="button" disabled={saving || issuing} className="btn btn-quiet" onClick={() => void save()}>{saving ? "Salvataggio…" : document ? "Salva modifiche" : "Salva bozza"}</button><button type="button" disabled={saving || issuing || !cloudEnabled} title={cloudEnabled ? undefined : "L’emissione definitiva è disponibile in modalità cloud"} className="btn btn-primary" onClick={requestIssueConfirmation}>Emetti proforma</button></div></div>
    {issueOpen && <Modal title="Emettere questo proforma?" onClose={() => { if (!issuing) setIssueOpen(false); }}><div className="space-y-5"><p className="text-sm leading-6 text-slate-600">Verrà assegnato un numero definitivo e generato il PDF. Il documento non sarà più modificabile; eventuali correzioni richiederanno l’annullamento e un nuovo proforma.</p>{issuing && <p role="status" className="rounded-xl bg-sage-50 px-3 py-2 text-sm font-bold text-sage-800">Emissione del proforma…</p>}{issueFailed && error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}<div className="grid gap-2 sm:flex sm:justify-end"><button type="button" disabled={issuing} className="btn btn-quiet" onClick={() => setIssueOpen(false)}>Annulla</button><button type="button" disabled={issuing} className="btn btn-primary" onClick={() => void confirmIssue()}>{issuing ? "Emissione…" : issueFailed ? "Riprova emissione" : "Emetti proforma"}</button></div></div></Modal>}
  </div></Modal>;
}

function EconomicDocumentHistory({ document, lines, onClose, onReload, onChange }: { document: EconomicDocument; lines: EconomicDocumentLine[]; onClose: () => void; onReload: () => Promise<void>; onChange: (document: EconomicDocument) => void }) {
  const professional = document.professionalSnapshot as ProfessionalDocumentSnapshot;
  const recipient = document.recipientSnapshot as RecipientDocumentSnapshot;
  const [openingPdf, setOpeningPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");
  const voidFlight = useRef(false);

  const openPdf = async () => {
    const target = window.open("about:blank", "_blank");
    if (target) target.opener = null;
    setOpeningPdf(true);
    setDownloadError("");
    try {
      const url = await economicDocumentDownloadUrl(document.id);
      if (target) target.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      target?.close();
      setDownloadError(economicDocumentDownloadErrorMessage(cause));
    } finally {
      setOpeningPdf(false);
    }
  };

  const confirmVoid = async () => {
    const reason = voidReason.trim();
    if (!reason) { setVoidError("Inserisci il motivo dell’annullamento."); return; }
    if (voidFlight.current) return;
    voidFlight.current = true;
    setVoiding(true);
    setVoidError("");
    try {
      const updated = await requestEconomicDocumentVoid(document.id, reason);
      onChange(updated);
      await onReload();
      setVoidOpen(false);
    } catch (cause) {
      setVoidError(economicDocumentVoidErrorMessage(cause));
    } finally {
      voidFlight.current = false;
      setVoiding(false);
    }
  };

  const professionalName = [professional.firstName, professional.lastName].filter(Boolean).join(" ") || professional.professionalName || "Professionista";
  const recipientName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "Destinatario";
  return <Modal title="Dettaglio proforma" onClose={onClose}><div className="space-y-5">
    <header className="rounded-2xl border border-sage-100 bg-sage-50/40 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{document.documentNumber || "Proforma"}</h3><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[document.status]}`}>{statusLabel[document.status]}</span></div><p className="mt-1 text-sm text-slate-500">Emesso il {document.issueDate ? dateLabel(document.issueDate) : "—"}</p>{document.status === "voided" && <p className="mt-1 text-sm text-slate-500">Annullato il {document.voidedAt ? dateLabel(document.voidedAt) : "—"}</p>}</div><p className="text-2xl font-bold text-sage-800">{formatEuroCents(document.totalCents)}</p></div></header>

    {document.status === "voided" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Documento annullato</h3><p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">{document.voidReason || "Motivo non disponibile"}</p></section>}

    <div className="grid gap-3 sm:grid-cols-2"><HistorySnapshot title="Professionista" name={professionalName} taxCode={professional.taxCode || professional.vatNumber} address={[professional.address, professional.postalCode, professional.city, professional.province, professional.country].filter(Boolean).join(" · ")}/><HistorySnapshot title="Destinatario" name={recipientName} taxCode={recipient.taxCode} address={[recipient.address, recipient.postalCode, recipient.city, recipient.province, recipient.country].filter(Boolean).join(" · ")}/></div>

    <section className="rounded-2xl border border-slate-100 p-4"><h3 className="font-bold">Prestazioni</h3><div className="mt-3 divide-y divide-slate-100">{lines.map((line) => <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="font-medium break-words">{line.descriptionSnapshot}</p><p className="mt-1 text-xs text-slate-500">{line.serviceDateSnapshot ? dateLabel(line.serviceDateSnapshot) : "Riga manuale"} · Quantità {line.quantity}</p></div><p className="whitespace-nowrap font-bold">{formatEuroCents(line.lineTotalCents)}</p></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4"><span className="font-bold">Totale</span><strong className="text-xl text-sage-800">{formatEuroCents(document.totalCents)}</strong></div></section>
    {document.notes.trim() && <section className="rounded-2xl border border-slate-100 p-4"><h3 className="font-bold">Note</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{document.notes}</p></section>}
    <p className="text-xs leading-5 text-slate-500">Il PDF definitivo conserva il documento emesso. Questa vista è un riepilogo e non modifica gli snapshot storici.</p>
    {downloadError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{downloadError}</p>}
    <div className="flex flex-col-reverse gap-2 border-t border-sage-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div>{document.status === "issued" && <button type="button" className="btn w-full text-red-600 sm:w-auto" onClick={() => { setVoidReason(""); setVoidError(""); setVoidOpen(true); }}>Annulla documento</button>}</div><div className="grid gap-2 sm:flex sm:justify-end"><button type="button" className="btn btn-quiet" onClick={onClose}>Chiudi</button><button type="button" disabled={openingPdf} className="btn btn-primary" onClick={() => void openPdf()}>{openingPdf ? "Apertura PDF…" : "Apri PDF definitivo"}</button></div></div>
    {voidOpen && <Modal title="Annullare questo proforma?" onClose={() => { if (!voiding) setVoidOpen(false); }}><div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Il documento resterà nello storico con numero e PDF originali; il numero non verrà riutilizzato. Le prestazioni potranno essere incluse in un nuovo proforma.</p><label className="block text-sm font-bold">Motivo dell’annullamento<textarea autoFocus rows={4} className={inputClass} value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Indica il motivo…"/></label>{voidError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{voidError}</p>}<div className="grid gap-2 sm:flex sm:justify-end"><button type="button" disabled={voiding} className="btn btn-quiet" onClick={() => setVoidOpen(false)}>Torna indietro</button><button type="button" disabled={voiding || !voidReason.trim()} className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => void confirmVoid()}>{voiding ? "Annullamento…" : voidError ? "Riprova annullamento" : "Annulla documento"}</button></div></div></Modal>}
  </div></Modal>;
}

function HistorySnapshot({ title, name, taxCode, address }: { title: string; name: string; taxCode?: string; address?: string }) {
  return <section className="rounded-2xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 font-bold break-words">{name}</p>{taxCode && <p className="mt-1 break-words text-sm text-slate-500">{taxCode}</p>}{address && <p className="mt-1 break-words text-sm text-slate-500">{address}</p>}</section>;
}

function recipientFor(patientId: string, patients: Patient[], details: PatientAdministrativeDetails[]) {
  const patient = patients.find((item) => item.id === patientId);
  if (!patient) return { firstName: "", lastName: "", billingSubjectType: "patient" as const };
  const stored = details.find((item) => item.patientId === patientId) || { patientId, billingSubjectType: "patient" as const, createdAt: "", updatedAt: "" };
  return currentEconomicDocumentRecipient(patient, stored);
}

function SnapshotSection({ title, warning, onReset, children }: { title: string; warning?: string; onReset?: () => void; children: React.ReactNode }) { return <section className="rounded-2xl border border-sage-100 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{title}</h3>{onReset && <button type="button" className="text-xs font-bold text-sage-700" onClick={onReset}>Usa dati salvati</button>}</div>{warning && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{warning}</p>}<div className="mt-3">{children}</div></section>; }

function SnapshotFields<T extends RecipientDocumentSnapshot | ProfessionalDocumentSnapshot>({ kind, value, disabled, onChange }: { kind: "recipient" | "professional"; value: T; disabled: boolean; onChange: (value: T) => void }) {
  const fields = kind === "recipient" ? [["firstName","Nome"],["lastName","Cognome"],["taxCode","Codice fiscale"],["address","Indirizzo"],["postalCode","CAP"],["city","Città"],["province","Provincia"],["country","Paese"],["administrativeEmail","Email amministrativa"]] : [["firstName","Nome"],["lastName","Cognome"],["profession","Professione"],["studio","Studio / centro"],["taxCode","Codice fiscale"],["vatNumber","Partita IVA"],["address","Indirizzo"],["postalCode","CAP"],["city","Città"],["province","Provincia"],["country","Paese"],["email","Email"]];
  return <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-500">{label}<input disabled={disabled} className={inputClass} value={text((value as unknown as Record<string, unknown>)[key])} onChange={(event) => { const next = { ...value, [key]: event.target.value } as T; if (kind === "professional" && (key === "firstName" || key === "lastName")) (next as ProfessionalDocumentSnapshot).professionalName = [text((next as ProfessionalDocumentSnapshot).firstName), text((next as ProfessionalDocumentSnapshot).lastName)].filter(Boolean).join(" ") || undefined; onChange(next); }}/></label>)}</div>;
}

function DocumentPreview({ patient, professional, recipient, lines, notes, total, logoSrc }: { patient?: Patient; professional: ProfessionalDocumentSnapshot; recipient: RecipientDocumentSnapshot; lines: EconomicDocumentLine[]; notes: string; total: number; logoSrc?: string }) { const professionalName = [professional.firstName,professional.lastName].filter(Boolean).join(" ") || professional.professionalName; const professionalAddress = [professional.address,professional.postalCode,professional.city,professional.province,professional.country].filter(Boolean).join(" · "); return <section aria-label="Anteprima proforma" className="overflow-hidden rounded-2xl bg-slate-100 p-2 sm:p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">5. Anteprima</p><article className="mx-auto min-h-[34rem] max-w-[46rem] bg-white p-5 shadow-sm sm:p-8"><header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between"> <div className="flex min-w-0 items-start gap-3">{logoSrc && <div className="flex h-16 w-24 shrink-0 items-center justify-center"><Image src={logoSrc} alt="" width={96} height={64} unoptimized className="max-h-full max-w-full object-contain"/></div>}<div><p className="font-bold">{professionalName || "Professionista"}</p>{professional.profession && <p className="text-sm text-slate-500">{professional.profession}</p>}{professional.studio && <p className="text-sm text-slate-500">{professional.studio}</p>}<p className="mt-2 text-xs leading-5 text-slate-400">{[professional.taxCode || professional.vatNumber, professionalAddress, professional.email].filter(Boolean).join(" · ")}</p></div></div><div className="shrink-0 sm:text-right"><p className="text-xl font-bold tracking-wide text-sage-800">PROFORMA</p><p className="mt-1 text-xs text-slate-400">Bozza · {dateLabel(new Date().toISOString())}</p></div></header><div className="mt-6 text-sm"><AddressBlock title="Destinatario" name={[recipient.firstName,recipient.lastName].filter(Boolean).join(" ") || (patient ? fullName(patient) : undefined)} taxCode={recipient.taxCode} address={[recipient.address,recipient.postalCode,recipient.city,recipient.province,recipient.country].filter(Boolean).join(" · ")}/></div><div className="mt-7 overflow-x-auto"><table className="w-full min-w-[30rem] text-left text-sm"><thead className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-400"><tr><th className="py-2">Data</th><th className="py-2">Prestazione</th><th className="py-2 text-center">Q.tà</th><th className="py-2 text-right">Importo</th></tr></thead><tbody className="divide-y divide-slate-100">{lines.map((line) => <tr key={line.id}><td className="py-3 text-slate-500">{line.serviceDateSnapshot ? dateLabel(line.serviceDateSnapshot) : "—"}</td><td className="py-3 font-medium">{line.descriptionSnapshot}</td><td className="py-3 text-center">{line.quantity}</td><td className="py-3 text-right">{formatEuroCents(line.lineTotalCents)}</td></tr>)}</tbody></table></div><div className="mt-6 flex justify-end border-t border-slate-200 pt-4"><div className="flex min-w-48 items-center justify-between gap-8"><span className="font-bold">Totale</span><strong className="text-xl text-sage-800">{formatEuroCents(total)}</strong></div></div>{notes.trim() && <div className="mt-7 text-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Note</p><p className="mt-2 whitespace-pre-wrap text-slate-600">{notes.trim()}</p></div>}</article></section>; }
function AddressBlock({ title, name, taxCode, address }: { title: string; name?: string; taxCode?: string; address?: string }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-2 font-bold">{name || "Da completare"}</p>{taxCode && <p className="text-slate-500">{taxCode}</p>}{address && <p className="mt-1 text-slate-500">{address}</p>}</div>; }
