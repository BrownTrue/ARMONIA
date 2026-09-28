import type { Payment, PaymentAllocation, PaymentMethod, Session } from "./types.ts";

export type PaymentState = "price_unspecified" | "free" | "unpaid" | "partial" | "paid";
export type PaymentStateSummary = {
  state: PaymentState;
  allocatedCents: number;
  residualCents: number;
};
export type PaymentPeriod = { from?: string; to?: string };
export type PaymentAllocationInput = { sessionId: string; amountCents: number };
export type CreatePaymentInput = {
  id: string;
  patientId: string;
  amountCents: number;
  paidAt: string;
  method: PaymentMethod;
  note?: string;
  allocations: PaymentAllocationInput[];
  createdAt: string;
};

const activePaymentIds = (payments: Payment[]) => new Set(payments.filter((payment) => payment.status === "active").map((payment) => payment.id));

export function activeAllocatedCents(sessionId: string, payments: Payment[], allocations: PaymentAllocation[]): number {
  const active = activePaymentIds(payments);
  return allocations.reduce((total, allocation) => total + (allocation.sessionId === sessionId && active.has(allocation.paymentId) ? allocation.amountCents : 0), 0);
}

export function paymentStateForSession(session: Session, payments: Payment[], allocations: PaymentAllocation[]): PaymentStateSummary {
  const allocatedCents = activeAllocatedCents(session.id, payments, allocations);
  const price = session.effectivePriceCents;
  if (price === undefined) return { state: "price_unspecified", allocatedCents, residualCents: 0 };
  if (price === 0) return { state: "free", allocatedCents, residualCents: 0 };
  if (allocatedCents > price) throw new Error("payment_integrity_violation");
  const residualCents = price - allocatedCents;
  return { state: allocatedCents === 0 ? "unpaid" : residualCents === 0 ? "paid" : "partial", allocatedCents, residualCents };
}

export function receivedCentsInPeriod(payments: Payment[], period: PaymentPeriod): number {
  return payments.reduce((total, payment) => total + (payment.status === "active" && (!period.from || payment.paidAt >= period.from) && (!period.to || payment.paidAt <= period.to) ? payment.amountCents : 0), 0);
}

export function outstandingCents(sessions: Session[], payments: Payment[], allocations: PaymentAllocation[]): number {
  return sessions.reduce((total, session) => session.effectivePriceCents !== undefined && session.effectivePriceCents > 0
    ? total + paymentStateForSession(session, payments, allocations).residualCents
    : total, 0);
}

export function unallocatedCreditCents(patientId: string, payments: Payment[], allocations: PaymentAllocation[]): number {
  return payments.reduce((total, payment) => {
    if (payment.patientId !== patientId || payment.status !== "active") return total;
    const allocated = allocations.reduce((sum, allocation) => sum + (allocation.paymentId === payment.id ? allocation.amountCents : 0), 0);
    if (allocated > payment.amountCents) throw new Error("payment_integrity_violation");
    return total + payment.amountCents - allocated;
  }, 0);
}

export function sessionsCountInPeriod(sessions: Session[], period: PaymentPeriod): number {
  return sessions.filter((session) => (!period.from || session.date >= period.from) && (!period.to || session.date <= period.to)).length;
}

export function buildMarkPaidInput(session: Session, payments: Payment[], allocations: PaymentAllocation[], input: { id: string; paidAt: string; method: PaymentMethod; note?: string; createdAt: string }): CreatePaymentInput | null {
  const summary = paymentStateForSession(session, payments, allocations);
  if (summary.residualCents <= 0) return null;
  return { ...input, patientId: session.patientId, amountCents: summary.residualCents, allocations: [{ sessionId: session.id, amountCents: summary.residualCents }] };
}

export function createLocalPayment(data: { patients: { id: string }[]; sessions: Session[]; payments: Payment[]; paymentAllocations: PaymentAllocation[] }, input: CreatePaymentInput) {
  if (!data.patients.some((patient) => patient.id === input.patientId)) throw new Error("Paziente non trovato.");
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("L’importo del pagamento non è valido.");
  if (!(["cash", "bank_transfer", "card", "other"] as string[]).includes(input.method)) throw new Error("Metodo di pagamento non valido.");
  if (data.payments.some((payment) => payment.id === input.id)) throw new Error("Pagamento già registrato.");
  const seen = new Set<string>();
  let allocatedTotal = 0;
  for (const allocation of input.allocations) {
    if (seen.has(allocation.sessionId)) throw new Error("Una seduta è presente più volte nel pagamento.");
    seen.add(allocation.sessionId);
    if (!Number.isInteger(allocation.amountCents) || allocation.amountCents <= 0) throw new Error("Importo allocato non valido.");
    const session = data.sessions.find((item) => item.id === allocation.sessionId);
    if (!session) throw new Error("Seduta non trovata.");
    if (session.patientId !== input.patientId) throw new Error("Il pagamento e la seduta devono appartenere allo stesso paziente.");
    if (session.effectivePriceCents === undefined || session.effectivePriceCents <= 0) throw new Error("La seduta deve avere un prezzo maggiore di zero.");
    const current = activeAllocatedCents(session.id, data.payments, data.paymentAllocations);
    if (current + allocation.amountCents > session.effectivePriceCents) throw new Error("L’importo supera il residuo della seduta.");
    allocatedTotal += allocation.amountCents;
  }
  if (allocatedTotal > input.amountCents) throw new Error("Le allocazioni superano l’importo del pagamento.");
  const payment: Payment = { id: input.id, patientId: input.patientId, amountCents: input.amountCents, paidAt: input.paidAt, method: input.method, note: input.note?.trim() || "", status: "active", createdAt: input.createdAt, updatedAt: input.createdAt };
  const createdAllocations: PaymentAllocation[] = input.allocations.map((allocation) => ({ paymentId: input.id, sessionId: allocation.sessionId, patientId: input.patientId, amountCents: allocation.amountCents, createdAt: input.createdAt }));
  return { payment, allocations: createdAllocations };
}

export function voidLocalPayment(payments: Payment[], paymentId: string, voidedAt: string): Payment[] {
  const payment = payments.find((item) => item.id === paymentId);
  if (!payment) throw new Error("Pagamento non trovato.");
  if (payment.status === "voided") return payments;
  return payments.map((item) => item.id === paymentId ? { ...item, status: "voided", voidedAt, updatedAt: voidedAt } : item);
}

export function assertSessionPriceAllowed(session: Session, payments: Payment[], allocations: PaymentAllocation[]) {
  const allocated = activeAllocatedCents(session.id, payments, allocations);
  if (allocated > 0 && (session.effectivePriceCents === undefined || session.effectivePriceCents < allocated)) throw new Error("Il prezzo non può essere inferiore all’importo già pagato.");
}

export function assertSessionDeleteAllowed(sessionId: string, allocations: PaymentAllocation[]) {
  if (allocations.some((allocation) => allocation.sessionId === sessionId)) throw new Error("La seduta non può essere eliminata perché ha pagamenti associati.");
}

export function assertPatientDeleteAllowed(patientId: string, payments: Payment[]) {
  if (payments.some((payment) => payment.patientId === patientId)) throw new Error("Il paziente non può essere eliminato perché ha uno storico pagamenti.");
}

export async function commitAfterRemoteDelete(remoteDelete: (() => Promise<void>) | null, commit: () => void) {
  if (remoteDelete) await remoteDelete();
  commit();
}

export function economicDeleteError(cause: unknown, entity: "patient" | "session") {
  const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : "";
  if (code === "23503") return new Error(entity === "session"
    ? "Questa seduta ha pagamenti associati e non può essere eliminata."
    : "Questo paziente ha uno storico economico e non può essere eliminato.");
  return new Error(entity === "session"
    ? "Non è stato possibile eliminare la seduta. Riprova."
    : "Non è stato possibile eliminare il paziente. Riprova.");
}
