"use client";

import type { ExerciseBlockDraft, WorksheetDraft } from "@/lib/exercise-lab/worksheet-draft";

export function WorksheetPreview({ worksheet, onBack, onPrint }: { worksheet: WorksheetDraft; onBack: () => void; onPrint: () => void }) {
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={onBack} className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">← Modifica scheda</button><button type="button" onClick={onPrint} className="btn btn-primary">PDF / Stampa</button></div>
    <article className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
      <header className="border-b border-emerald-100 pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Scheda di attività</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{worksheet.title || "Scheda senza titolo"}</h1>
        {worksheet.instructions && <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{worksheet.instructions}</p>}
      </header>
      <ol className="mt-8 space-y-10">{worksheet.blocks.map((block, index) => <li key={block.id}><PreviewBlock block={block} index={index} /></li>)}</ol>
    </article>
  </div>;
}

function PreviewBlock({ block, index }: { block: ExerciseBlockDraft; index: number }) {
  const exercise = block.exercise;
  return <section aria-labelledby={`preview-${block.id}`}>
    <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">{index + 1}</span><div><h2 id={`preview-${block.id}`} className="text-xl font-bold text-slate-900">{exercise.title}</h2>{exercise.instructions && <p className="mt-1 text-sm leading-6 text-slate-500">{exercise.instructions}</p>}</div></div>
    <div className="mt-5">{exercise.kind === "picture_naming" ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{exercise.items.map((item) => <figure key={item.wordId} className="rounded-2xl border border-slate-100 p-3 text-center"><img src={item.imagePath} alt={item.altText} className="aspect-[4/3] w-full object-contain" /><figcaption className="mt-2 font-bold text-slate-800">{item.text}</figcaption></figure>)}</div> : exercise.kind === "minimal_pairs" ? <div className="grid gap-4 sm:grid-cols-2">{exercise.items.map((item) => <div key={item.minimalPairId} className="rounded-2xl border border-slate-100 p-4"><div className="grid grid-cols-2 gap-3 text-center">{[[item.imagePathA, item.wordA], [item.imagePathB, item.wordB]].map(([path, word]) => <div key={word}>{path && <img src={path} alt="" className="mx-auto aspect-square w-full max-w-32 object-contain" />}<p className="mt-2 font-bold text-slate-800">{word}</p></div>)}</div></div>)}</div> : exercise.kind === "repetition" ? <div className="grid gap-3 sm:grid-cols-2">{exercise.items.map((item, itemIndex) => <div key={item.contentId} className="flex items-baseline gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-emerald-700">{itemIndex + 1}</span><p className="font-bold text-slate-800">{item.text}</p></div>)}</div> : exercise.kind === "reading_comprehension" ? exercise.items.map((item) => <div key={item.passageId}><h3 className="font-bold text-slate-900">{item.passageTitle}</h3><p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{item.text}</p><ol className="mt-5 list-decimal space-y-3 pl-6">{item.questions.map((question) => <li key={question.id} className="pl-1 leading-7 text-slate-800">{question.prompt}</li>)}</ol></div>) : <ol className="space-y-3">{exercise.items.map((item, itemIndex) => <li key={item.sentenceId} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className="font-bold text-emerald-700">{itemIndex + 1}.</span><p className="font-semibold leading-7 text-slate-800">{item.text}</p></li>)}</ol>}</div>
  </section>;
}
