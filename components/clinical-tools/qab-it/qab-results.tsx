import { QAB_ITALIAN_ATTRIBUTION } from "@/lib/clinical-tools/qab-it/content";
import { scoreQabItalian } from "@/lib/clinical-tools/qab-it/scoring";
import type { QabAdministrationV1, QabScores } from "@/lib/clinical-tools/qab-it/types";

const DOMAIN_LABELS: readonly [keyof Omit<QabScores, "overall" | "formulaVersion">, string][] = [
  ["wordComprehension", "Comprensione parole"],
  ["sentenceComprehension", "Comprensione frasi"],
  ["lexicalRetrieval", "Recupero lessicale"],
  ["grammar", "Costruzione grammaticale"],
  ["motorProgramming", "Programmazione fonetico-articolatoria"],
  ["repetition", "Ripetizione"],
  ["reading", "Lettura"],
];

export const formatQabScore = (value: number) => value.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function QabResults({ value, compact = false }: { value: QabAdministrationV1; compact?: boolean }) {
  const result = value.form ? scoreQabItalian(value) : { status: "incomplete" as const };
  if (result.status !== "available") return <p className="text-sm text-slate-500">{result.status === "stopped" ? "Somministrazione interrotta secondo la regola clinica prevista." : "Risultati non disponibili: la somministrazione non è completa."}</p>;
  return <div>
    <div className="rounded-2xl bg-sage-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sage-700">QAB generale</p><p className="mt-1 text-3xl font-black text-sage-900">{formatQabScore(result.scores.overall)} <span className="text-base font-semibold">/ 10</span></p></div>
    {!compact && <dl className="mt-4 grid gap-2 sm:grid-cols-2">{DOMAIN_LABELS.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-sage-100 px-3 py-2"><dt className="text-sm text-slate-600">{label}</dt><dd className="font-bold">{formatQabScore(result.scores[key])}</dd></div>)}</dl>}
    {!compact && <><p className="mt-4 text-xs text-slate-500">Modulo {value.form} · formula {result.scores.formulaVersion}</p><p className="mt-2 text-xs leading-5 text-slate-500">{QAB_ITALIAN_ATTRIBUTION.title} · {QAB_ITALIAN_ATTRIBUTION.adaptationAuthors.join(", ")} · {QAB_ITALIAN_ATTRIBUTION.license}</p></>}
  </div>;
}

export { DOMAIN_LABELS as QAB_RESULT_DOMAIN_LABELS };
