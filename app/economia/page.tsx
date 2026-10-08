"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AnchoredActionMenu } from "@/components/anchored-action-menu";
import { useData } from "@/components/data-provider";
import { EconomicDocumentsPanel } from "@/components/economy/economic-documents-panel";
import { AnimatedTabs, type AnimatedTabOption } from "@/components/organic-premium/animated-tabs";
import { Field, Select, Textarea } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { formatEuroCents } from "@/lib/calendar-v2";
import { buildDeliveredServiceRows, deliveredValueCents, economyServiceKey, filterEconomySessions } from "@/lib/economy";
import { focusFirstInvalidField } from "@/lib/form-validation";
import { autoDistributePayment, economicOperationError, filterPayments, openPatientSessions, outstandingCents, paymentAvailableCreditCents, paymentStateForSession, receivedCentsInPeriod, safePaymentInputToCents, validatePaymentForm } from "@/lib/payments";
import type { CreatePaymentInput, PaymentState } from "@/lib/payments";
import type { Payment, PaymentAllocation, PaymentMethod, Patient, Session } from "@/lib/types";
import { today, uid } from "@/lib/types";
import styles from "./economy-experience.module.css";

const MOBILE_LIMIT = 6;
const monthBounds = (month: string) => ({ from: `${month}-01`, to: `${month}-31T23:59:59.999Z` });
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
const dateLabel = (date: string) => new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString("it-IT");
const methodLabels: Record<PaymentMethod, string> = { cash: "Contanti", bank_transfer: "Bonifico", card: "Carta", other: "Altro" };
const stateLabels: Record<PaymentState, string> = { price_unspecified: "Prezzo non specificato", free: "Gratuita", unpaid: "Non pagato", partial: "Parziale", paid: "Pagato" };
const stateClasses: Record<PaymentState, string> = { price_unspecified: "bg-slate-100 text-slate-600", free: "bg-sky-50 text-sky-700", unpaid: "bg-amber-50 text-amber-800", partial: "bg-orange-50 text-orange-800", paid: "bg-sage-100 text-sage-800" };
const economyTabClasses = {
  services: { idle:"border-sage-100 bg-sage-50/60 text-sage-700 hover:bg-sage-50", active:"border-sage-300 bg-sage-100 text-sage-900 shadow-sm" },
  payments: { idle:"border-orange-100 bg-orange-50/50 text-orange-700 hover:bg-orange-50", active:"border-orange-200 bg-orange-100/80 text-orange-900 shadow-sm" },
  documents: { idle:"border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50", active:"border-indigo-200 bg-indigo-100/80 text-indigo-900 shadow-sm" },
} as const;
type EconomySection = "services" | "payments" | "documents";
const economyTabs: readonly AnimatedTabOption<EconomySection>[] = [
  { id: "economy-services-tab", value: "services", label: "Prestazioni", controls: "economy-services-panel" },
  { id: "economy-payments-tab", value: "payments", label: "Pagamenti", controls: "economy-payments-panel" },
  { id: "economy-documents-tab", value: "documents", label: "Documenti", controls: "economy-documents-panel" },
];

export default function EconomyPage() {
  const { data, ready, createPayment, voidPayment } = useData();
  const [month, setMonth] = useState(new Date().toLocaleDateString("sv-SE").slice(0, 7));
  const [patientId, setPatientId] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [sessionState, setSessionState] = useState<PaymentState | "">("");
  const [paymentPatient, setPaymentPatient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentStatus, setPaymentStatus] = useState<Payment["status"] | "">("");
  const [paymentEditor, setPaymentEditor] = useState<{ kind: "collect"; session: Session } | { kind: "general" } | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null);
  const [sessionDetail, setSessionDetail] = useState<Session | null>(null);
  const [mobileSection, setMobileSection] = useState<EconomySection>("services");
  const [filterPanel, setFilterPanel] = useState<"services" | "payments" | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [newDocumentRequest, setNewDocumentRequest] = useState(0);

  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("patient"); if (requested) { setPatientId(requested); setPaymentPatient(requested); } }, []);
  const bounds = monthBounds(month);
  const serviceOptions = useMemo(() => { const options = new Map<string, string>(); for (const session of data.sessions) options.set(economyServiceKey(session), session.serviceNameSnapshot || "Prestazione non specificata"); return [...options].sort((a, b) => a[1].localeCompare(b[1], "it")); }, [data.sessions]);
  const monthSessions = useMemo(() => filterEconomySessions(data.sessions, bounds), [data.sessions, bounds.from, bounds.to]);
  const visibleSessions = useMemo(() => filterEconomySessions(data.sessions, { ...bounds, patientId: patientId || undefined, serviceKey: serviceKey || undefined }).filter((session) => !sessionState || paymentStateForSession(session, data.payments, data.paymentAllocations).state === sessionState), [data.sessions, data.payments, data.paymentAllocations, bounds.from, bounds.to, patientId, serviceKey, sessionState]);
  const rows = useMemo(() => buildDeliveredServiceRows(visibleSessions, data.patients), [visibleSessions, data.patients]);
  const visiblePayments = useMemo(() => filterPayments(data.payments, { ...bounds, patientId: paymentPatient || undefined, method: paymentMethod || undefined, status: paymentStatus || undefined }).sort((a, b) => b.paidAt.localeCompare(a.paidAt)), [data.payments, bounds.from, bounds.to, paymentPatient, paymentMethod, paymentStatus]);
  const patientName = (id: string) => { const p = data.patients.find((item) => item.id === id); return p ? `${p.firstName} ${p.lastName}` : "Paziente non disponibile"; };
  const serviceFilterCount = Number(Boolean(patientId)) + Number(Boolean(serviceKey)) + Number(Boolean(sessionState));
  const paymentFilterCount = Number(Boolean(paymentPatient)) + Number(Boolean(paymentMethod)) + Number(Boolean(paymentStatus));
  const mobileRows = showAllSessions ? rows : rows.slice(0, MOBILE_LIMIT);

  const serviceFilters = <><label>Periodo<input type="month" value={month} onChange={(e) => setMonth(e.target.value)}/></label><label>Paziente<select value={patientId} onChange={(e) => setPatientId(e.target.value)}><option value="">Tutti</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label><label>Prestazione<select value={serviceKey} onChange={(e) => setServiceKey(e.target.value)}><option value="">Tutte</option>{serviceOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Stato<select value={sessionState} onChange={(e) => setSessionState(e.target.value as PaymentState | "")}><option value="">Tutti</option>{Object.entries(stateLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></>;
  const paymentFilters = <><label>Periodo<input type="month" value={month} onChange={(e) => setMonth(e.target.value)}/></label><label>Paziente<select value={paymentPatient} onChange={(e) => setPaymentPatient(e.target.value)}><option value="">Tutti</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label><label>Metodo<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}><option value="">Tutti</option>{Object.entries(methodLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Stato<select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as Payment["status"] | "")}><option value="">Tutti</option><option value="active">Attivo</option><option value="voided">Annullato</option></select></label></>;

  return <AppShell>
    <div className={styles.economyPage}>
    <header className={`${styles.header} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}><div><p className={`${styles.eyebrow} text-xs font-bold uppercase tracking-[0.16em] text-sage-700`}>Gestione economica</p><h1 className={`${styles.title} mt-0.5 text-2xl font-bold sm:mt-1 sm:text-3xl`}>Economia</h1><p className={`${styles.description} mt-1 text-sm text-slate-500 sm:text-base`}>Prestazioni, incassi e documenti in bozza.</p></div><div className={`${styles.actions} grid grid-cols-2 gap-2 sm:flex`}><button className={`${styles.secondaryAction} btn btn-quiet min-w-0 px-3 py-2.5 text-sm sm:w-auto`} onClick={() => setPaymentEditor({ kind: "general" })}>+ Registra incasso</button><button className={`${styles.primaryAction} btn btn-primary min-w-0 px-3 py-2.5 text-sm sm:w-auto`} onClick={() => { setMobileSection("documents"); setNewDocumentRequest((value) => value + 1); }}>+ Crea proforma</button></div></header>
    {!ready ? <p className="mt-6 text-sm text-slate-500">Caricamento…</p> : <>
      <section className={`${styles.metrics} mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-3`} aria-label={`Riepilogo ${monthLabel(month)}`}><Metric label="Incassato questo mese" value={formatEuroCents(receivedCentsInPeriod(data.payments, bounds))}/><Metric label="Da incassare" value={formatEuroCents(outstandingCents(data.sessions, data.payments, data.paymentAllocations))}/><Metric label="Prestazioni del mese" value={String(monthSessions.length)} detail={`Valore erogato ${formatEuroCents(deliveredValueCents(monthSessions))}`} className="col-span-2 lg:col-span-1"/></section>
      <div className={`${styles.mobileTabs} mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-100 bg-white p-1.5`} aria-label="Sezione Economia">{(["services", "payments", "documents"] as const).map((section) => { const selected = mobileSection === section; const palette = economyTabClasses[section]; return <button key={section} onClick={() => setMobileSection(section)} className={`min-w-0 rounded-xl border px-1.5 py-2.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 sm:px-3 sm:text-sm ${selected ? palette.active : palette.idle}`} aria-pressed={selected}>{section === "services" ? "Prestazioni" : section === "payments" ? "Pagamenti" : "Documenti"}</button>; })}</div>
      <div className={`${styles.desktopTabs} hidden md:block`}><AnimatedTabs label="Sezioni Economia" options={economyTabs} value={mobileSection} onChange={setMobileSection} className={styles.animatedTabs}/></div>
      <section id="economy-services-panel" role="tabpanel" aria-labelledby="economy-services-tab" tabIndex={0} className={`mt-5 ${mobileSection === "services" ? "" : "hidden"}`}>
        <FilterCard className="hidden md:block">{serviceFilters}</FilterCard>
        <div className="mt-6"><SectionHeading id="delivered-services-title" title="Prestazioni svolte" subtitle="Stato economico delle sedute registrate." count={rows.length}/></div>
        <div className="mt-3 flex items-center justify-between"><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold md:hidden" onClick={() => setFilterPanel("services")}>Filtri{serviceFilterCount ? ` · ${serviceFilterCount}` : ""}</button><Link href="/calendario" className="ml-auto text-sm font-bold text-sage-700">Gestisci prestazioni</Link></div>
        {rows.length ? <><div className="mt-3 space-y-2 md:hidden">{mobileRows.map((row) => <ServiceCard key={row.session.id} row={row} payments={data.payments} allocations={data.paymentAllocations} onCollect={() => setPaymentEditor({ kind: "collect", session: row.session })} onDetail={() => setSessionDetail(row.session)}/>)}</div>{rows.length > MOBILE_LIMIT && !showAllSessions && <button className="mt-3 w-full py-2 text-sm font-bold text-sage-700 md:hidden" onClick={() => setShowAllSessions(true)}>Vedi tutte</button>}<div className={`${styles.serviceTable} card mt-3 hidden overflow-hidden md:block`}><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Paziente</th><th className="px-4 py-3">Prestazione</th><th className="px-4 py-3 text-right">Importo</th><th className="px-4 py-3">Stato</th><th className="px-4 py-3 text-right">Residuo</th><th className="px-4 py-3 text-right">Azioni</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => { const summary = paymentStateForSession(row.session, data.payments, data.paymentAllocations); return <tr key={row.session.id}><td className="px-4 py-3 font-medium">{dateLabel(row.session.date)}</td><td className="px-4 py-3">{row.patientName}</td><td className="px-4 py-3">{row.serviceName || "Non specificata"}</td><td className="px-4 py-3 text-right font-bold">{priceLabel(row.effectivePriceCents)}</td><td className="px-4 py-3"><StateBadge state={summary.state}/></td><td className="px-4 py-3 text-right">{summary.residualCents > 0 ? formatEuroCents(summary.residualCents) : "—"}</td><td className="px-4 py-3 text-right"><RowActions state={summary.state} onCollect={() => setPaymentEditor({ kind: "collect", session: row.session })} onDetail={() => setSessionDetail(row.session)}/></td></tr>; })}</tbody></table></div></> : <Empty text="Nessuna prestazione per i filtri selezionati."/>}
      </section>
      <section id="economy-payments-panel" role="tabpanel" aria-labelledby="economy-payments-tab" tabIndex={0} className={`mt-6 ${mobileSection === "payments" ? "" : "hidden"}`}>
        <SectionHeading id="payments-title" title="Pagamenti recenti" subtitle="Incassi ricevuti; quelli annullati restano nello storico." count={visiblePayments.length}/>
        <FilterCard compact className="hidden md:block">{paymentFilters}</FilterCard>
        <button className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold md:hidden" onClick={() => setFilterPanel("payments")}>Filtri{paymentFilterCount ? ` · ${paymentFilterCount}` : ""}</button>
        {visiblePayments.length ? <div className="mt-3 grid gap-2 lg:grid-cols-2">{visiblePayments.map((payment) => <button key={payment.id} onClick={() => setPaymentDetail(payment)} className={`${styles.paymentCard} card w-full p-3 text-left transition hover:border-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 sm:p-4`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-slate-400">{dateLabel(payment.paidAt)}</p><p className="mt-0.5 truncate font-bold">{patientName(payment.patientId)}</p><p className="text-sm text-slate-500">{methodLabels[payment.method]} · {payment.status === "voided" ? "Annullato" : "Attivo"}</p></div><div className="shrink-0 text-right"><p className="font-bold sm:text-lg">{formatEuroCents(payment.amountCents)}</p><p className="mt-0.5 text-xs text-slate-500">Credito {formatEuroCents(paymentAvailableCreditCents(payment, data.paymentAllocations))}</p><span className="mt-1 inline-block text-xs font-bold text-sage-700">Apri</span></div></div></button>)}</div> : <Empty text="Nessun pagamento per i filtri selezionati."/>}
      </section>
      <div id="economy-documents-panel" role="tabpanel" aria-labelledby="economy-documents-tab" tabIndex={0} className={`${styles.documents} mt-7 ${mobileSection === "documents" ? "" : "hidden"}`}><EconomicDocumentsPanel createRequest={newDocumentRequest} className=""/></div>
    </>}
    </div>
    {filterPanel && <Modal title="Filtri" onClose={() => setFilterPanel(null)}><FilterFields>{filterPanel === "services" ? serviceFilters : paymentFilters}</FilterFields><div className="mt-5 flex justify-end"><button className="btn btn-primary" onClick={() => setFilterPanel(null)}>Applica</button></div></Modal>}
    {paymentEditor && <PaymentEditor
      kind={paymentEditor.kind}
      session={paymentEditor.kind === "collect" ? paymentEditor.session : undefined}
      initialPatientId={paymentEditor.kind === "general" ? paymentPatient : undefined}
      sessions={data.sessions}
      payments={data.payments}
      allocations={data.paymentAllocations}
      patients={data.patients}
      onClose={() => setPaymentEditor(null)}
      onSave={async (input) => { await createPayment(input); setPaymentEditor(null); }}
    />}
    {sessionDetail && <SessionEconomicDetail session={sessionDetail} patientName={patientName(sessionDetail.patientId)} payments={data.payments} allocations={data.paymentAllocations} onClose={() => setSessionDetail(null)}/>}
    {paymentDetail && <PaymentDetail payment={paymentDetail} sessions={data.sessions} allocations={data.paymentAllocations} patientName={patientName(paymentDetail.patientId)} onClose={() => setPaymentDetail(null)} onVoid={async () => { await voidPayment(paymentDetail.id); setPaymentDetail(null); }}/>}
  </AppShell>;
}

function PaymentEditor({ kind, session, initialPatientId, sessions, payments, allocations, patients, onClose, onSave }: { kind: "collect" | "general"; session?: Session; initialPatientId?: string; sessions: Session[]; payments: Payment[]; allocations: PaymentAllocation[]; patients: Patient[]; onClose: () => void; onSave: (input: CreatePaymentInput) => Promise<void> }) {
  const initialResidual = session ? paymentStateForSession(session, payments, allocations).residualCents : 0;
  const [patientId, setPatientId] = useState(session?.patientId || initialPatientId || "");
  const [amount, setAmount] = useState(initialResidual ? String(initialResidual / 100) : "");
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [allocationErrors, setAllocationErrors] = useState<Record<string, string>>({});
  const [allocationError, setAllocationError] = useState("");
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const amountCents = safePaymentInputToCents(amount);
  const openSessions = openPatientSessions(patientId, sessions, payments, allocations);
  const selected = kind === "collect" && session && amountCents && amountCents > 0 ? [{ sessionId: session.id, amountCents }] : openSessions.flatMap((item) => { const cents = safePaymentInputToCents(values[item.id] || ""); return cents && cents > 0 ? [{ sessionId: item.id, amountCents: cents }] : []; });
  const allocated = selected.reduce((sum, item) => sum + item.amountCents, 0);
  const credit = Math.max(0, (amountCents || 0) - allocated);
  const validationIssueCount = Object.values(fieldErrors).filter(Boolean).length + Object.values(allocationErrors).filter(Boolean).length + Number(Boolean(allocationError));
  const distribute = () => { if (!amountCents || amountCents <= 0) { setFieldErrors({ amount: "Inserisci un importo valido." }); focusFirstInvalidField({ amount: "" }); return; } const next = autoDistributePayment(amountCents, openSessions, payments, allocations); setValues(Object.fromEntries(next.map((item) => [item.sessionId, String(item.amountCents / 100)]))); setAllocationErrors({}); setAllocationError(""); };
  const submit = async () => {
    setServerError("");
    const residualBySession = Object.fromEntries(openSessions.map((item) => [item.id, paymentStateForSession(item, payments, allocations).residualCents]));
    const validation = validatePaymentForm({ patientId, paidOn, amount, allocationValues: kind === "general" ? values : {}, residualBySession });
    if (kind === "collect" && amountCents && amountCents > initialResidual) validation.fieldErrors.amount = "L’importo supera il residuo della prestazione.";
    setFieldErrors(validation.fieldErrors);
    setAllocationErrors(validation.allocationErrors);
    setAllocationError(validation.allocationError || "");
    if (Object.keys(validation.fieldErrors).length || Object.keys(validation.allocationErrors).length || validation.allocationError) {
      const focusErrors = Object.keys(validation.fieldErrors).length
        ? validation.fieldErrors
        : Object.keys(validation.allocationErrors).length
          ? { [`allocation-${Object.keys(validation.allocationErrors)[0]}`]: "" }
          : { allocations: "" };
      focusFirstInvalidField(focusErrors);
      return;
    }
    if (!amountCents) return;
    setSaving(true);
    try { const stamp = new Date().toISOString(); await onSave({ id: uid(), patientId, amountCents, paidAt: new Date(`${paidOn}T12:00:00`).toISOString(), method, note, createdAt: stamp, allocations: selected }); } catch (cause) { const message=economicOperationError(cause).message; setServerError(message === "Non è stato possibile completare l’operazione economica. Riprova." ? "Non è stato possibile registrare l’incasso. Riprova." : message); } finally { setSaving(false); }
  };
  const linkedPatient = patients.find((patient) => patient.id === patientId);
  const remaining = kind === "collect" && amountCents ? initialResidual - amountCents : 0;
  return <Modal title={kind === "collect" ? "Incassa prestazione" : "Registra incasso"} onClose={onClose}><form noValidate className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    {validationIssueCount > 1 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-bold">Ci sono alcune informazioni da controllare.</p><p className="mt-1">Correggi i campi evidenziati e riprova.</p></div>}
    {kind === "collect" && session ? <div className="rounded-2xl bg-sage-50 p-4 text-sm"><p><b>Paziente</b> · {linkedPatient ? `${linkedPatient.firstName} ${linkedPatient.lastName}` : "Non disponibile"}</p><p className="mt-1"><b>Prestazione</b> · {session.serviceNameSnapshot || "Non specificata"}</p><p className="mt-1"><b>Residuo attuale</b> · {formatEuroCents(initialResidual)}</p></div> : <><p className="text-sm text-slate-600">Registra una somma ricevuta dal paziente e associala alle prestazioni.</p><Select id="payment-patient" data-validation-field="patientId" label="Paziente" value={patientId} error={fieldErrors.patientId} onChange={(e) => { setPatientId(e.target.value); setValues({}); setFieldErrors((current) => ({...current, patientId: ""})); setAllocationErrors({}); setAllocationError(""); }}><option value="">Seleziona…</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}</Select></>}
    <div className="grid gap-3 sm:grid-cols-2"><Field id="payment-amount" data-validation-field="amount" label="Importo ricevuto (€)" value={amount} error={fieldErrors.amount} onChange={(event) => {setAmount(event.target.value);setFieldErrors((current)=>({...current,amount:""}));setAllocationError("");}} inputMode="decimal"/><Field id="payment-date" data-validation-field="paidOn" label="Data incasso" value={paidOn} error={fieldErrors.paidOn} onChange={(event) => {setPaidOn(event.target.value);setFieldErrors((current)=>({...current,paidOn:""}));}} type="date"/></div>
    <Select label="Metodo" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{Object.entries(methodLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
    <Textarea label="Nota (facoltativa)" value={note} onChange={(e) => setNote(e.target.value)}/>
    {kind === "collect" && amountCents && amountCents <= initialResidual ? <p className="rounded-xl bg-sage-50 p-3 text-sm text-sage-900">{remaining > 0 ? `Dopo questo incasso resteranno ${formatEuroCents(remaining)} da saldare.` : "La prestazione risulterà saldata."}</p> : null}
    {kind === "general" && patientId && <section data-validation-field="allocations" tabIndex={-1}><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Distribuzione sulle prestazioni</h3><p className="text-sm text-slate-500">Le più vecchie sono mostrate per prime.</p></div><button type="button" onClick={distribute} className="text-sm font-bold text-sage-700">Distribuisci automaticamente</button></div>{allocationError && <p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{allocationError}</p>}<div className="mt-3 space-y-2">{openSessions.length ? openSessions.map((item) => { const summary = paymentStateForSession(item, payments, allocations); const rowError=allocationErrors[item.id]; const errorId=`allocation-${item.id}-error`; return <label key={item.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_9rem] sm:items-center"><span><b>{dateLabel(item.date)} · {item.serviceNameSnapshot || "Prestazione"}</b><small className="mt-1 block text-slate-500">Prezzo {formatEuroCents(item.effectivePriceCents!)} · già associato {formatEuroCents(summary.allocatedCents)} · residuo {formatEuroCents(summary.residualCents)}</small></span><span><input data-validation-field={`allocation-${item.id}`} aria-label={`Importo da associare alla seduta del ${dateLabel(item.date)}`} aria-invalid={Boolean(rowError)} aria-describedby={rowError?errorId:undefined} inputMode="decimal" value={values[item.id] || ""} onChange={(e) => {setValues((current) => ({ ...current, [item.id]: e.target.value }));setAllocationErrors((current)=>({...current,[item.id]:""}));setAllocationError("");}} placeholder="0,00" className={`w-full rounded-xl border bg-white p-3 outline-none ${rowError?"border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100":"border-slate-200 focus:border-sage-500"}`}/>{rowError&&<small id={errorId} role="alert" className="mt-1.5 block text-sm font-medium text-red-700">{rowError}</small>}</span></label>; }) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nessuna prestazione aperta per questo paziente.</p>}</div></section>}
    {kind === "general" && <div className="grid grid-cols-3 gap-2 rounded-2xl bg-sage-50 p-3 text-sm"><Summary label="Ricevuto" value={amountCents ? formatEuroCents(amountCents) : "—"}/><Summary label="Associato" value={formatEuroCents(allocated)}/><Summary label="Credito disponibile" value={formatEuroCents(credit)}/></div>}
    {serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
    <div className="flex justify-end gap-2"><button type="button" disabled={saving} className="btn btn-quiet" onClick={onClose}>Annulla</button><button type="submit" disabled={saving} aria-busy={saving} className="btn btn-primary disabled:opacity-50">{saving ? "Salvataggio…" : "Conferma incasso"}</button></div>
  </form></Modal>;
}

function SessionEconomicDetail({ session, patientName, payments, allocations, onClose }: { session: Session; patientName: string; payments: Payment[]; allocations: PaymentAllocation[]; onClose: () => void }) {
  const summary = paymentStateForSession(session, payments, allocations);
  const links = allocations.filter((item) => item.sessionId === session.id).map((item) => ({ allocation: item, payment: payments.find((payment) => payment.id === item.paymentId) })).filter((item): item is { allocation: PaymentAllocation; payment: Payment } => Boolean(item.payment));
  return <Modal title="Dettaglio economico" onClose={onClose}><div className="space-y-4"><div className="grid gap-3 rounded-2xl bg-sage-50 p-4 sm:grid-cols-2"><Summary label="Data" value={dateLabel(session.date)}/><Summary label="Paziente" value={patientName}/><Summary label="Prestazione" value={session.serviceNameSnapshot || "Non specificata"}/><Summary label="Importo" value={priceLabel(session.effectivePriceCents)}/><Summary label="Stato" value={stateLabels[summary.state]}/><Summary label="Totale incassato" value={formatEuroCents(summary.allocatedCents)}/><Summary label="Residuo" value={formatEuroCents(summary.residualCents)}/></div><div><h3 className="font-bold">Incassi associati</h3>{links.length ? <div className="mt-2 divide-y divide-slate-100">{links.map(({ allocation, payment }) => <div key={`${payment.id}-${allocation.sessionId}`} className="grid grid-cols-2 gap-2 py-3 text-sm sm:grid-cols-4"><span>{dateLabel(payment.paidAt)}</span><b>{formatEuroCents(allocation.amountCents)}</b><span>{methodLabels[payment.method]}</span><span className="text-right">{payment.status === "voided" ? "Annullato" : "Attivo"}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">Nessun incasso registrato.</p>}</div><div className="flex justify-end"><Link href={`/pazienti/${session.patientId}?tab=activity`} className="text-sm font-bold text-sage-700">Apri seduta clinica</Link></div></div></Modal>;
}

function PaymentDetail({ payment, sessions, allocations, patientName, onClose, onVoid }: { payment: Payment; sessions: Session[]; allocations: PaymentAllocation[]; patientName: string; onClose: () => void; onVoid: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const links = allocations.filter((item) => item.paymentId === payment.id);
  const confirmVoid = async () => {
    setSaving(true);
    setError("");
    try { await onVoid(); setConfirmOpen(false); }
    catch (cause) { setError(economicOperationError(cause).message); setSaving(false); setConfirmOpen(false); }
  };
  return <>
    <Modal title="Dettaglio pagamento" onClose={() => { if (!saving) onClose(); }}><div className="space-y-4"><div className="rounded-2xl bg-sage-50 p-4"><p className="text-3xl font-bold">{formatEuroCents(payment.amountCents)}</p><p className="mt-1 text-sm text-slate-600">{patientName} · {dateLabel(payment.paidAt)} · {methodLabels[payment.method]}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${payment.status === "voided" ? "bg-slate-200 text-slate-700" : "bg-sage-100 text-sage-800"}`}>{payment.status === "voided" ? "Annullato" : "Attivo"}</span></div>{payment.note && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nota</p><p className="mt-1 text-sm">{payment.note}</p></div>}<div><h3 className="font-bold">Importi associati</h3>{links.length ? <div className="mt-2 divide-y divide-slate-100">{links.map((link) => { const linkedSession = sessions.find((item) => item.id === link.sessionId); return <div key={link.sessionId} className="flex justify-between gap-3 py-3 text-sm"><span>{linkedSession ? `${dateLabel(linkedSession.date)} · ${linkedSession.serviceNameSnapshot || "Prestazione"}` : "Seduta non disponibile"}</span><b>{formatEuroCents(link.amountCents)}</b></div>; })}</div> : <p className="mt-2 text-sm text-slate-500">Nessuna prestazione associata.</p>}</div><div className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>Credito disponibile</span><b>{formatEuroCents(paymentAvailableCreditCents(payment, allocations))}</b></div>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{payment.status === "active" && <button type="button" disabled={saving} className="text-sm font-bold text-red-600 disabled:opacity-50" onClick={() => setConfirmOpen(true)}>Annulla pagamento</button>}</div></Modal>
    {confirmOpen && <Modal title="Annullare questo pagamento?" onClose={() => { if (!saving) setConfirmOpen(false); }}><p className="text-sm leading-6 text-slate-600">Le prestazioni torneranno eventualmente da saldare. Il movimento resterà nello storico.</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setConfirmOpen(false)} className="btn btn-quiet">Mantieni pagamento</button><button type="button" disabled={saving} aria-busy={saving} onClick={() => void confirmVoid()} className="btn bg-red-600 text-white disabled:cursor-wait disabled:opacity-50">{saving ? "Annullamento…" : "Conferma annullamento"}</button></div></Modal>}
  </>;
}

function RowActions({ state, onCollect, onDetail }: { state: PaymentState; onCollect: () => void; onDetail: () => void }) { const actionable = state === "unpaid" || state === "partial"; return <span className="inline-flex items-center gap-2">{actionable && <button onClick={onCollect} className="rounded-lg bg-sage-700 px-3 py-1.5 text-xs font-bold text-white sm:text-sm">Incassa</button>}<AnchoredActionMenu label="Altre azioni" actions={[{ label: "Dettaglio economico", onSelect: onDetail }]}/></span>; }
function ServiceCard({ row, payments, allocations, onCollect, onDetail }: { row: ReturnType<typeof buildDeliveredServiceRows>[number]; payments: Payment[]; allocations: PaymentAllocation[]; onCollect: () => void; onDetail: () => void }) { const summary = paymentStateForSession(row.session, payments, allocations); return <article className="card p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-slate-400">{dateLabel(row.session.date)}</p><p className="truncate font-bold">{row.patientName}</p><p className="truncate text-sm text-slate-500">{row.serviceName || "Prestazione non specificata"}</p></div><p className="shrink-0 font-bold">{priceLabel(row.effectivePriceCents)}</p></div><div className="mt-2 flex items-center justify-between gap-2"><StateBadge state={summary.state}/>{summary.residualCents > 0 && <span className="text-xs text-slate-500">Residuo <b className="text-slate-700">{formatEuroCents(summary.residualCents)}</b></span>}</div><div className="mt-2 flex justify-end"><RowActions state={summary.state} onCollect={onCollect} onDetail={onDetail}/></div></article>; }
function StateBadge({ state }: { state: PaymentState }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${stateClasses[state]}`}>{stateLabels[state]}</span>; }
function priceLabel(value?: number) { return value === undefined ? "Non specificato" : value === 0 ? "Gratuita" : formatEuroCents(value); }
function Metric({ label, value, detail, className = "" }: { label: string; value: string; detail?: string; className?: string }) { return <div className={`${styles.metric} card p-3 sm:p-5 ${className}`}><p className="text-[11px] leading-snug text-slate-500 sm:text-sm">{label}</p><p className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>; }
function FilterCard({ children, compact = false, className = "" }: { children: React.ReactNode; compact?: boolean; className?: string }) { return <section className={`${styles.filterCard} card ${compact ? "mt-3" : "mt-5"} p-4 ${className}`}><FilterFields>{children}</FilterFields></section>; }
function FilterFields({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&_input]:mt-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_select]:mt-1 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_label]:text-sm [&_label]:font-bold">{children}</div>; }
function SectionHeading({ id, title, subtitle, count }: { id: string; title: string; subtitle: string; count: number }) { return <div className="flex items-end justify-between gap-3"><div><h2 id={id} className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><span className="text-sm font-bold text-slate-500">{count}</span></div>; }
function Empty({ text }: { text: string }) { return <div className="card mt-3 p-6 text-center text-sm text-slate-500">{text}</div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>; }
