"use client";

import { useMemo, useState } from "react";
import {
  buildImageNamingPreview,
  buildMinimalPairsPreview,
  buildReadingComprehensionPreview,
  buildRepetitionPreview,
  exerciseBricks,
  getAvailableClusterPhonemes,
  getAvailableGeminates,
  getAvailablePairContrasts,
  getAvailableReadingAudiences,
  getAvailableWordPhonemes,
} from "@/lib/exercise-lab/bricks";
import type { ContentAudience, PassageQuestionType } from "@/lib/content-bank/types";
import type { ExerciseBrickCode, ReadingComprehensionPreview, SyllableCountFilter } from "@/lib/exercise-lab/types";

const positions = [{ value: "", label: "Qualsiasi" }, { value: "initial", label: "Iniziale" }, { value: "medial", label: "Mediale" }, { value: "final", label: "Finale" }] as const;
const counts = [4, 6, 8, 10, 12];

export function ExerciseLabBuilder() {
  const [brick, setBrick] = useState<ExerciseBrickCode>("image_naming"), [includeDrafts, setIncludeDrafts] = useState(false), [itemCount, setItemCount] = useState(6);
  const [phoneme, setPhoneme] = useState(""), [phonemeB, setPhonemeB] = useState(""), [position, setPosition] = useState(""), [syllables, setSyllables] = useState<"" | `${number}` | "4+">("");
  const [cluster, setCluster] = useState(""), [geminate, setGeminate] = useState(""), [requireImages, setRequireImages] = useState(false), [kind, setKind] = useState<"word" | "nonword" | "both">("both");
  const [showWords, setShowWords] = useState(true), [showIpa, setShowIpa] = useState(false);
  const [readingAudience, setReadingAudience] = useState(""), [passageId, setPassageId] = useState(""), [shownAnswers, setShownAnswers] = useState<Set<string>>(new Set());
  const wordPhonemes = getAvailableWordPhonemes(includeDrafts), clusters = getAvailableClusterPhonemes(includeDrafts), geminates = getAvailableGeminates(includeDrafts), contrasts = getAvailablePairContrasts(includeDrafts);
  const readingAudiences = getAvailableReadingAudiences(includeDrafts);
  const parsedSyllables = syllables ? (syllables === "4+" ? "4+" : Number(syllables)) as SyllableCountFilter : undefined;
  const preview = useMemo(() => brick === "image_naming"
    ? buildImageNamingPreview({ itemCount, includeDrafts, phoneme: phoneme || undefined, position: position as never || undefined, syllableCount: parsedSyllables, clusterPhoneme: cluster || undefined, geminate: geminate || undefined })
    : brick === "minimal_pairs"
      ? buildMinimalPairsPreview({ itemCount, includeDrafts, phonemeA: phoneme || undefined, phonemeB: phonemeB || undefined, position: position as never || undefined, requireImages })
      : brick === "reading_comprehension"
        ? buildReadingComprehensionPreview({ includeDrafts, audience: readingAudience as ContentAudience || undefined, passageId: passageId || undefined })
      : buildRepetitionPreview({ itemCount, includeDrafts, contentKind: kind, phoneme: phoneme || undefined, position: position as never || undefined, syllableCount: parsedSyllables, clusterPhoneme: cluster || undefined, geminate: geminate || undefined }),
  [brick, cluster, geminate, includeDrafts, itemCount, kind, parsedSyllables, passageId, phoneme, phonemeB, position, readingAudience, requireImages]);
  const standardPreview = preview as ReturnType<typeof buildImageNamingPreview> | ReturnType<typeof buildMinimalPairsPreview> | ReturnType<typeof buildRepetitionPreview>;

  return <div className="mt-8 space-y-6">
    <Step title="1. Scegli il mattoncino"><div className="grid gap-3 md:grid-cols-3">{exerciseBricks.map((entry) => <button type="button" key={entry.code} onClick={() => { setBrick(entry.code); setPhoneme(""); setPhonemeB(""); }} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${brick === entry.code ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-200"}`} aria-pressed={brick === entry.code}><strong className="block text-sm">{entry.title}</strong><span className="mt-2 block text-xs leading-5 text-slate-500">{entry.description}</span></button>)}</div></Step>
    <Step title="2. Configura">{brick === "reading_comprehension" ? <ReadingConfiguration preview={preview as ReadingComprehensionPreview} audiences={readingAudiences} audience={readingAudience} passageId={passageId} onAudienceChange={(value) => { setReadingAudience(value); setPassageId(""); setShownAnswers(new Set()); }} onPassageChange={(value) => { setPassageId(value); setShownAnswers(new Set()); }} /> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {brick === "minimal_pairs" ? <><Select label="Primo fonema" value={phoneme} onChange={setPhoneme} options={pairPhonemes(contrasts)} /><Select label="Secondo fonema" value={phonemeB} onChange={setPhonemeB} options={pairPhonemes(contrasts)} /></> : <Select label="Fonema" value={phoneme} onChange={setPhoneme} options={wordPhonemes} />}
      <Select label="Posizione" value={position} onChange={setPosition} options={positions.slice(1).map((x) => x.value)} labels={Object.fromEntries(positions.map((x) => [x.value, x.label]))} />
      {brick !== "minimal_pairs" && <><Select label="Sillabe" value={syllables} onChange={(x) => setSyllables(x as typeof syllables)} options={["1", "2", "3", "4+"]} /><Select label="Fonema nel cluster" value={cluster} onChange={setCluster} options={clusters} /><Select label="Geminata" value={geminate} onChange={setGeminate} options={geminates} /></>}
      {brick === "minimal_pairs" && <Check label="Richiedi due immagini" checked={requireImages} onChange={setRequireImages} />}
      {brick === "word_nonword_repetition" && <label className="text-xs font-bold text-slate-500">Contenuti<select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="field"><option value="both">Parole e non-parole</option><option value="word">Solo parole</option><option value="nonword">Solo non-parole</option></select></label>}
      <label className="text-xs font-bold text-slate-500">Quantità<select value={itemCount} onChange={(e) => setItemCount(Number(e.target.value))} className="field">{counts.map((x) => <option key={x}>{x}</option>)}</select></label>
    </div></>}<div className="mt-5 border-t border-slate-100 pt-4"><Check label="Includi bozze — solo test editoriale" checked={includeDrafts} onChange={(value) => { setIncludeDrafts(value); setPassageId(""); setShownAnswers(new Set()); }} /></div></Step>
    <Step title="3. Anteprima">{brick === "reading_comprehension" ? <ReadingPreview preview={preview as ReadingComprehensionPreview} shownAnswers={shownAnswers} onToggleAnswer={(id) => setShownAnswers((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} /> : <><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">Richiesti <strong className="text-slate-800">{standardPreview.requestedItemCount}</strong> · trovati <strong className="text-slate-800">{standardPreview.availableItemCount}</strong></p><div className="flex gap-4">{brick === "image_naming" && <Check label="Mostra parole" checked={showWords} onChange={setShowWords} />}{brick === "word_nonword_repetition" && <Check label="Mostra IPA" checked={showIpa} onChange={setShowIpa} />}</div></div>
      {standardPreview.warnings.map((warning) => <p key={warning} role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</p>)}
      <PreviewGrid preview={standardPreview} brick={brick} showWords={showWords} showIpa={showIpa} />
    </>}</Step>
  </div>;
}

const audienceLabels: Record<ContentAudience, string> = { preschool: "Età prescolare", primary_school: "Scuola primaria", secondary_school: "Scuola secondaria", adolescent: "Adolescente", adult: "Adulto", older_adult: "Adulto anziano" };
const questionLabels: Record<PassageQuestionType, string> = { literal: "Letterale", inferential: "Inferenza", sequence: "Sequenza", vocabulary: "Vocabolario" };

function ReadingConfiguration({ preview, audiences, audience, passageId, onAudienceChange, onPassageChange }: { preview: ReadingComprehensionPreview; audiences: string[]; audience: string; passageId: string; onAudienceChange: (value: string) => void; onPassageChange: (value: string) => void }) {
  return <div className="space-y-5">
    <Select label="Destinatario editoriale" value={audience} onChange={onAudienceChange} options={audiences} labels={audienceLabels} emptyLabel="Tutti i brani" />
    <div><p className="text-xs font-bold text-slate-500">Scegli il brano</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{preview.availablePassages.map((passage) => <button key={passage.passageId} type="button" aria-pressed={passageId === passage.passageId} onClick={() => onPassageChange(passage.passageId)} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${passageId === passage.passageId ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}><strong className="block text-sm text-slate-800">{passage.title}</strong><span className="mt-2 block text-xs text-slate-500">{passage.wordCount} parole · {passage.questionCount} domande</span></button>)}</div></div>
  </div>;
}

function ReadingPreview({ preview, shownAnswers, onToggleAnswer }: { preview: ReadingComprehensionPreview; shownAnswers: Set<string>; onToggleAnswer: (id: string) => void }) {
  if (!preview.selectedPassage) return <><p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Scegli un brano per visualizzare l’anteprima.</p>{preview.warnings.map((warning) => <p key={warning} role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</p>)}</>;
  const passage = preview.selectedPassage;
  return <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"><header className="border-b border-slate-100 pb-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Lettura e comprensione</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{passage.title}</h3><p className="mt-2 text-xs text-slate-500">{passage.wordCount} parole · {passage.questionCount} domande</p></header><p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">{passage.text}</p><section className="mt-8 border-t border-slate-100 pt-6"><h4 className="text-lg font-bold text-slate-900">Domande</h4><ol className="mt-4 space-y-5">{passage.questions.map((question) => <li key={question.id} className="ml-5 list-decimal pl-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold leading-6 text-slate-800">{question.prompt}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{questionLabels[question.type]}</span></div>{question.expectedAnswer && <div className="mt-2"><button type="button" onClick={() => onToggleAnswer(question.id)} aria-expanded={shownAnswers.has(question.id)} className="text-sm font-semibold text-violet-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">{shownAnswers.has(question.id) ? "Nascondi risposta suggerita" : "Mostra risposta suggerita"}</button>{shownAnswers.has(question.id) && <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-950">{question.expectedAnswer}</p>}</div>}</li>)}</ol></section></article>;
}

function PreviewGrid({ preview, brick, showWords, showIpa }: { preview: ReturnType<typeof buildImageNamingPreview> | ReturnType<typeof buildMinimalPairsPreview> | ReturnType<typeof buildRepetitionPreview>; brick: ExerciseBrickCode; showWords: boolean; showIpa: boolean }) {
  if (!preview.items.length) return <p className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Nessun contenuto disponibile con i filtri correnti.</p>;
  return <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{preview.items.map((raw) => {
    if (brick === "image_naming") { const item = raw as ReturnType<typeof buildImageNamingPreview>["items"][number]; return <Card key={item.wordId} draft={item.reviewStatus === "draft"}><img src={item.imagePath} alt={item.altText} className="aspect-[4/3] w-full rounded-xl bg-slate-50 object-contain" />{showWords && <p className="mt-3 text-center font-bold">{item.text}</p>}</Card>; }
    if (brick === "minimal_pairs") { const item = raw as ReturnType<typeof buildMinimalPairsPreview>["items"][number]; return <Card key={item.minimalPairId} draft={item.reviewStatus === "draft"}><div className="grid grid-cols-2 gap-2">{[item.imagePathA, item.imagePathB].map((path, index) => path ? <img key={path} src={path} alt="" className="aspect-square w-full rounded-xl bg-slate-50 object-contain" /> : <div key={index} className="grid aspect-square place-items-center rounded-xl bg-slate-50 text-xs text-slate-400">solo testo</div>)}</div><p className="mt-3 text-center font-bold">{item.wordA} · {item.wordB}</p><p className="mt-1 text-center text-xs text-slate-500">{item.pairType === "minimal" ? "Coppia minima" : "Quasi-minima"} · {item.contrast.kind === "phoneme" ? `/${item.contrast.phonemeA}/ ↔ /${item.contrast.phonemeB}/` : `/${item.contrast.segment}/ semplice ↔ doppia`} · {item.contrast.position}</p></Card>; }
    const item = raw as ReturnType<typeof buildRepetitionPreview>["items"][number]; return <Card key={item.contentId} draft={item.reviewStatus === "draft"}><p className="text-center text-xl font-bold">{item.text}</p><p className="mt-2 text-center text-sm text-slate-500">{item.syllabification}</p>{showIpa && <p className="mt-1 text-center text-sm text-violet-700">{item.phonemicTranscription}</p>}</Card>;
  })}</div>;
}
function Step({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-6"><h2 className="mb-4 text-base font-bold">{title}</h2>{children}</section>; }
function Card({ children, draft }: { children: React.ReactNode; draft: boolean }) { return <article className="relative rounded-2xl border border-slate-200 bg-white p-3">{draft && <span className="absolute right-5 top-5 z-10 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-800">draft</span>}{children}</article>; }
function Select({ label, value, onChange, options, labels = {}, emptyLabel = "Qualsiasi" }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; labels?: Record<string, string>; emptyLabel?: string }) { return <label className="text-xs font-bold text-slate-500">{label}<select className="field" value={value} onChange={(e) => onChange(e.target.value)}><option value="">{emptyLabel}</option>{options.map((x) => <option key={x} value={x}>{labels[x] || `/${x}/`}</option>)}</select></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-violet-600" />{label}</label>; }
function pairPhonemes(contrasts: ReturnType<typeof getAvailablePairContrasts>) { return [...new Set(contrasts.flatMap((x) => [x.phonemeA, x.phonemeB]))].sort(); }
