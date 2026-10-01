"use client";

import { useMemo, useState } from "react";
import { searchContents } from "@/lib/content-bank/catalog";
import { CONTENT_TYPES, type ContentItem, type ContentType } from "@/lib/content-bank/types";

const typeLabels: Record<ContentType, string> = { word: "Parole", nonword: "Non-parole", minimal_pair: "Coppie fonologiche", sentence: "Frasi", passage: "Brani", sequence: "Sequenze" };

export function ContentBankBrowser({ contents }: { contents: readonly ContentItem[] }) {
  const [query, setQuery] = useState(""), [type, setType] = useState<"" | ContentType>("");
  const visible = useMemo(() => searchContents(query, contents).filter((item) => !type || item.contentType === type), [contents, query, type]);
  return <>
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CONTENT_TYPES.map((contentType) => <div key={contentType} className="rounded-2xl border border-violet-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{typeLabels[contentType]}</p><p className="mt-2 text-2xl font-bold">{contents.filter((item) => item.contentType === contentType).length}</p></div>)}
    </div>
    <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5" aria-label="Ricerca Banca Contenuti">
      <div className="grid gap-3 sm:grid-cols-[1fr_15rem]">
        <label className="text-xs font-bold text-slate-500">Ricerca<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca testo, lemma o domanda…" className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" /></label>
        <label className="text-xs font-bold text-slate-500">Tipo<select value={type} onChange={(event) => setType(event.target.value as "" | ContentType)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><option value="">Tutti</option>{CONTENT_TYPES.map((value) => <option key={value} value={value}>{typeLabels[value]}</option>)}</select></label>
      </div>
    </section>
    {visible.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{visible.map((item) => <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">{typeLabels[item.contentType]}</p><h2 className="mt-1 text-lg font-bold">{contentTitle(item)}</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{item.reviewStatus}</span></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{contentSummary(item)}</p>
      <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2"><Detail label="ID" value={item.id} /><Detail label="Rappresentazioni" value={item.contentType === "word" ? `testo · ${item.imageAssetIds?.length ? "immagine" : "nessuna immagine"}` : undefined} /><Detail label="Fonologia" value={item.contentType === "word" || item.contentType === "nonword" ? item.phonemicTranscription : undefined} /><Detail label="Elementi" value={item.contentType === "sequence" ? `${item.steps.length} step` : item.contentType === "passage" ? `${item.questions?.length || 0} domande` : undefined} /></dl>
    </article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Nessun contenuto corrisponde ai filtri selezionati.</p>}
  </>;
}

function contentTitle(item: ContentItem) {
  if (item.contentType === "word" || item.contentType === "nonword") return item.text;
  if (item.contentType === "minimal_pair") return item.id.replace(/^pair_|_001$/g, "").replaceAll("_", " ↔ ");
  if (item.contentType === "sentence") return item.text;
  return item.title || "Sequenza";
}
function contentSummary(item: ContentItem) {
  if (item.contentType === "word") return `${item.syllabification} · ${item.partOfSpeech}`;
  if (item.contentType === "nonword") return `${item.syllabification} · item editoriale di test`;
  if (item.contentType === "minimal_pair") return item.contrast.kind === "phoneme" ? `Contrasto /${item.contrast.phonemeA}/ – /${item.contrast.phonemeB}/ · ${item.pairType === "minimal" ? "minima" : "quasi minima"}` : `Contrasto singleton – geminata /${item.contrast.segment}/ · ${item.pairType === "minimal" ? "minima" : "quasi minima"}`;
  if (item.contentType === "sentence") return `${item.wordCount} parole`;
  if (item.contentType === "passage") return item.text;
  return item.steps.map((step) => `${step.order}. ${step.canonicalDescription || step.imageAssetId}`).join(" ");
}
function Detail({ label, value }: { label: string; value?: string }) { if (!value) return null; return <div><dt className="font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-words text-slate-600">{value}</dd></div>; }
